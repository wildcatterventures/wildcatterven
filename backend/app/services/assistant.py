import json
import logging
from typing import Any, Dict, List
import asyncpg
from app.agents.base import BaseLLMProvider
from app.agents.groq_provider import GroqLLMProvider
from app.agents.mock_provider import MockLLMProvider
from app.agents.tools import APPROVED_TOOLS_SPEC, execute_tool
from app.core.config import get_settings
from app.schemas.assistant import (
    AssistantMessageRequest,
    AssistantMessageResponse,
    ToolCallRecord,
)
from app.services.safety import evaluate_input_safety, evaluate_output_safety

logger = logging.getLogger("campus_uncut.assistant")


def get_llm_provider() -> BaseLLMProvider:
    """Instantiate configured LLM provider, defaulting to MockLLMProvider if key is missing or invalid."""
    settings = get_settings()
    configured_provider = (settings.LLM_PROVIDER or "mock").strip().lower()
    has_key = bool(settings.api_key)

    if configured_provider == "groq" and has_key:
        clean_key = settings.api_key.strip()
        if clean_key and clean_key.lower() not in ("your_groq_api_key_here", "none", "null"):
            try:
                provider = GroqLLMProvider(
                    api_key=clean_key,
                    model=settings.LLM_MODEL,
                    timeout=settings.LLM_TIMEOUT,
                )
                logger.info(
                    "[DIAGNOSTIC] Initialized GroqLLMProvider successfully (model: '%s', timeout: %.1fs, has_api_key=True)",
                    settings.LLM_MODEL,
                    settings.LLM_TIMEOUT,
                )
                return provider
            except Exception as e:
                logger.warning(
                    "[DIAGNOSTIC] Could not initialize GroqLLMProvider: %s. Using MockLLMProvider.",
                    e,
                )
        else:
            logger.info(
                "[DIAGNOSTIC] Groq provider requested but API key is placeholder. Using MockLLMProvider."
            )
    else:
        logger.info(
            "[DIAGNOSTIC] Provider configured as '%s' (has_api_key=%s). Using MockLLMProvider.",
            configured_provider,
            has_key,
        )
    return MockLLMProvider()


async def process_assistant_message(
    conn: asyncpg.Connection,
    req: AssistantMessageRequest,
) -> AssistantMessageResponse:
    """
    Orchestrate conversational AI interaction with approved tool calling.
    Includes deterministic fallback if configured LLM provider is unavailable or fails.
    """
    provider = get_llm_provider()
    provider_name = "groq" if isinstance(provider, GroqLLMProvider) else "mock"

    logger.info(
        "[DIAGNOSTIC] Incoming assistant message: '%.60s...' | Active provider: '%s'",
        req.message,
        provider_name,
    )

    # Phase 3 safety: Evaluate user input before LLM invocation or tool execution
    input_safety = evaluate_input_safety(req.message)
    if not input_safety.is_safe:
        logger.info(
            "[SAFETY] Input blocked by safety filter: %s (reason: %s)",
            input_safety.category,
            input_safety.reason,
        )
        return AssistantMessageResponse(
            reply=input_safety.refusal_message,
            tool_calls=[],
            structured_payload=None,
            provider_used="safety_guard",
        )

    # Assemble conversation messages
    messages: List[Dict[str, Any]] = []
    if req.history:
        for m in req.history[-6:]:  # Keep recent history concise
            messages.append({"role": m.role, "content": m.content})

    messages.append({"role": "user", "content": req.message})

    tool_call_records: List[ToolCallRecord] = []
    structured_payload: Dict[str, Any] = {}

    # Step 1: Initial model completion with approved tools
    try:
        reply_text, tool_calls = await provider.generate_response(messages, APPROVED_TOOLS_SPEC)
        logger.info(
            "[DIAGNOSTIC] Step 1 completion succeeded with provider '%s'. Proposed tool calls: %d",
            provider_name,
            len(tool_calls),
        )
    except Exception as exc:
        logger.warning(
            "[DIAGNOSTIC] Primary LLM provider '%s' failed (%s). Activating deterministic MockProvider fallback.",
            provider_name,
            exc,
        )
        provider = MockLLMProvider()
        provider_name = "mock_fallback"
        reply_text, tool_calls = await provider.generate_response(messages, APPROVED_TOOLS_SPEC)

    # Step 2: Multi-step tool execution loop (up to 2 iterations)
    iteration = 0
    max_tool_iterations = 2

    while tool_calls and iteration < max_tool_iterations:
        iteration += 1

        # Append assistant tool-proposals message
        messages.append({
            "role": "assistant",
            "content": reply_text or None,
            "tool_calls": tool_calls,
        })

        for tc in tool_calls:
            tname = tc["name"]
            targs = tc.get("arguments", {})

            # Auto-inject client_uuid and session_id from request if omitted by model
            if req.client_uuid:
                targs.setdefault("respondent_client_uuid", str(req.client_uuid))
            if req.session_id and "session_id" not in targs:
                targs["session_id"] = str(req.session_id)

            # Safely execute through validated backend domain services
            tool_res = await execute_tool(conn, tname, targs)
            has_error = bool(isinstance(tool_res, dict) and tool_res.get("error"))
            logger.info(
                "[DIAGNOSTIC] Executed tool '%s' (status: %s)",
                tname,
                "error" if has_error else "success",
            )

            tool_call_records.append(
                ToolCallRecord(tool_name=tname, arguments=targs, result=tool_res)
            )

            # Store the most informative tool result as structured card payload for UI
            is_empty_res = (
                isinstance(tool_res, dict)
                and (
                    tool_res.get("count") == 0
                    or tool_res.get("found") is False
                    or bool(tool_res.get("error"))
                )
            )
            if not structured_payload or (
                structured_payload.get("data", {}).get("count") == 0
                and not is_empty_res
            ):
                structured_payload = {"type": tname, "data": tool_res}

            # Append tool result with tool_call_id according to standard format
            messages.append({
                "role": "tool",
                "tool_call_id": tc.get("id", "call_unknown"),
                "name": tname,
                "content": json.dumps(tool_res, default=str),
            })

        # Generate follow-up conversational synthesis based on tool results
        try:
            follow_up_reply, next_tool_calls = await provider.generate_response(
                messages,
                APPROVED_TOOLS_SPEC if iteration < max_tool_iterations else None,
            )
            if follow_up_reply:
                reply_text = follow_up_reply
            tool_calls = next_tool_calls
            logger.info(
                "[DIAGNOSTIC] Step 2 follow-up completion succeeded with provider '%s'. Reply length: %d",
                provider_name,
                len(reply_text or ""),
            )
        except Exception as exc:
            logger.warning(
                "[DIAGNOSTIC] Follow-up LLM response generation failed on '%s': %s. Using deterministic summary.",
                provider_name,
                exc,
            )
            # If follow up call fails, synthesize response using MockProvider
            fallback_mock = MockLLMProvider()
            synth_reply, _ = await fallback_mock.generate_response(messages, [])
            if synth_reply:
                reply_text = synth_reply
            tool_calls = []

    logger.info(
        "[DIAGNOSTIC] Assistant message finished (provider_used: '%s', total_tools: %d)",
        provider_name,
        len(tool_call_records),
    )

    final_reply = reply_text or "Platform query completed successfully."
    output_safety = evaluate_output_safety(final_reply)
    if not output_safety.is_safe:
        logger.warning(
            "[SAFETY] Output blocked by safety filter: %s (reason: %s, provider: %s)",
            output_safety.category,
            output_safety.reason,
            provider_name,
        )
        return AssistantMessageResponse(
            reply=output_safety.refusal_message,
            tool_calls=[],
            structured_payload=None,
            provider_used="safety_guard",
        )

    return AssistantMessageResponse(
        reply=final_reply,
        tool_calls=tool_call_records,
        structured_payload=structured_payload or None,
        provider_used=provider_name,
    )
