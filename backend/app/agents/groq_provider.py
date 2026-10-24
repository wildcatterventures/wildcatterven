import json
import logging
from typing import Any, Dict, List, Optional, Tuple
import httpx
from app.agents.base import BaseLLMProvider

logger = logging.getLogger("campus_uncut.agents.groq")

# System prompt with strict integrity guardrails and dynamic conversational intelligence
SYSTEM_PROMPT = (
    "You are the Campus Uncut Conversational Intelligence Assistant for an unedited student college intelligence platform.\n\n"
    "YOUR ROLE & INTELLIGENCE:\n"
    "1. You understand what users want to ask across both typed and voice interactions—whether casual ('is SFIT any good?'), analytical ('how are placements at VJTI?'), or location-based ('colleges in Mumbai').\n"
    "2. For college inquiries, scores, rankings, or parameters (food, hostel quality, professor accessibility, ragging prevention, women's safety, placements), proactively call approved tools to retrieve real platform records.\n"
    "3. Synthesize dynamic, direct, and conversational responses that directly answer the user's specific curiosity. Don't recite canned boilerplate; highlight relevant factors (city, score, verified parameter averages, student submissions).\n"
    "4. For platform concepts, explain how Campus Uncut works: every college starts at a clean baseline of 100, official score changes happen only after deterministic 20-submission review blocks, and affiliations are self-declared.\n\n"
    "CRITICAL INTEGRITY PRINCIPLES:\n"
    "1. You NEVER fabricate scores, ratings, reviews, respondent counts, or transaction statuses.\n"
    "2. If a college has 0 reviews, explain that it sits on the clean baseline score of 100 awaiting its first 20-submission block.\n"
    "3. All respondent profiles in the current system have self-declared, unverified affiliations.\n"
    "4. Adding an unknown college requires explicit user confirmation before creation.\n"
    "5. If retrieved data is empty or missing, state that clearly instead of guessing.\n"
    "6. Speak in an articulate, natural, conversational tone with clean Markdown. Do NOT output raw JSON dumps."
)


class GroqLLMProvider(BaseLLMProvider):
    """
    Groq-compatible LLM provider implementing OpenAI-standard tool calling.
    Uses free-tier tool-calling models such as llama-3.3-70b-versatile or llama-3.1-8b-instant.
    """

    def __init__(
        self,
        api_key: str,
        model: str = "llama-3.3-70b-versatile",
        timeout: float = 25.0,
        base_url: str = "https://api.groq.com/openai/v1/chat/completions",
    ):
        clean_key = (api_key or "").strip()
        if not clean_key or clean_key.lower() in ("your_groq_api_key_here", "none", "null"):
            raise ValueError("Invalid or unconfigured Groq API key.")

        self.api_key = clean_key
        self.model = model
        self.timeout = timeout
        self.base_url = base_url

    async def generate_response(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Generate conversational reply and optional tool calls via Groq's OpenAI-compatible API.
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        # Ensure system prompt is present
        formatted_messages: List[Dict[str, Any]] = []
        has_system = any(m.get("role") == "system" for m in messages)
        if not has_system:
            formatted_messages.append({"role": "system", "content": SYSTEM_PROMPT})

        for m in messages:
            role = m.get("role")
            msg_obj: Dict[str, Any] = {"role": role}

            if "content" in m and m["content"] is not None:
                msg_obj["content"] = str(m["content"])
            elif role == "assistant" and "tool_calls" in m:
                msg_obj["content"] = None
            else:
                msg_obj["content"] = ""

            if role == "assistant" and "tool_calls" in m:
                # Format tool calls in OpenAI standard format
                raw_calls = m["tool_calls"]
                formatted_calls = []
                for tc in raw_calls:
                    if "function" in tc:
                        formatted_calls.append(tc)
                    else:
                        formatted_calls.append({
                            "id": tc.get("id", "call_unknown"),
                            "type": "function",
                            "function": {
                                "name": tc.get("name"),
                                "arguments": (
                                    json.dumps(tc.get("arguments", {}))
                                    if isinstance(tc.get("arguments"), dict)
                                    else str(tc.get("arguments", "{}"))
                                ),
                            },
                        })
                msg_obj["tool_calls"] = formatted_calls

            if role == "tool":
                msg_obj["tool_call_id"] = m.get("tool_call_id", m.get("id", "call_unknown"))
                if "name" in m:
                    msg_obj["name"] = m["name"]

            formatted_messages.append(msg_obj)

        logger.info(
            "[DIAGNOSTIC] GroqLLMProvider: Dispatching request to Groq API (model: '%s', messages: %d, tools_offered: %d)",
            self.model,
            len(formatted_messages),
            len(tools or []),
        )

        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": formatted_messages,
            "temperature": 0.6,
        }

        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(self.base_url, headers=headers, json=payload)
                resp.raise_for_status()
                data = resp.json()
        except httpx.HTTPStatusError as http_err:
            status = http_err.response.status_code
            resp_text = http_err.response.text[:250]
            logger.warning("[DIAGNOSTIC] Groq API returned HTTP %s: %s", status, resp_text)
            # Self-healing: if model_not_found on groq, try compatible alternate
            if status == 404 and "model_not_found" in resp_text and self.model != "openai/gpt-oss-120b":
                logger.info(
                    "[DIAGNOSTIC] Model '%s' not accessible; attempting fallback to verified model 'openai/gpt-oss-120b'",
                    self.model,
                )
                payload["model"] = "openai/gpt-oss-120b"
                try:
                    async with httpx.AsyncClient(timeout=self.timeout) as client:
                        resp = await client.post(self.base_url, headers=headers, json=payload)
                        resp.raise_for_status()
                        data = resp.json()
                        self.model = "openai/gpt-oss-120b"
                        logger.info("[DIAGNOSTIC] Fallback to 'openai/gpt-oss-120b' succeeded (HTTP 200)")
                except Exception as retry_err:
                    logger.warning("[DIAGNOSTIC] Fallback to 'openai/gpt-oss-120b' also failed: %s", retry_err)
                    raise RuntimeError(f"Groq API error ({status})") from http_err
            else:
                raise RuntimeError(f"Groq API error ({status})") from http_err
        except httpx.TimeoutException as time_err:
            logger.warning("[DIAGNOSTIC] Groq API request timed out after %.1f seconds", self.timeout)
            raise RuntimeError("Groq API request timed out") from time_err
        except Exception as exc:
            logger.warning("[DIAGNOSTIC] Groq API connection failed: %s", exc)
            raise RuntimeError(f"Groq API network error: {exc}") from exc

        choice = data.get("choices", [{}])[0]
        msg = choice.get("message", {})
        content = msg.get("content") or ""
        tool_calls_raw = msg.get("tool_calls") or []

        parsed_tool_calls: List[Dict[str, Any]] = []
        for tc in tool_calls_raw:
            func = tc.get("function", {})
            fname = func.get("name")
            fargs_raw = func.get("arguments", "{}")
            try:
                fargs = json.loads(fargs_raw) if isinstance(fargs_raw, str) else fargs_raw
            except Exception:
                fargs = {}

            parsed_tool_calls.append({
                "id": tc.get("id", "call_unknown"),
                "name": fname,
                "arguments": fargs,
            })

        return content, parsed_tool_calls
