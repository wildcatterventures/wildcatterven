import json
import logging
from typing import Any, Dict, List, Optional, Tuple
import httpx
from app.agents.base import BaseLLMProvider

logger = logging.getLogger("campus_uncut.agents.groq")

# System prompt with strict integrity guardrails and conversational tone
SYSTEM_PROMPT = (
    "You are the Campus Uncut Intelligence Assistant for an unedited student college intelligence platform.\n\n"
    "CRITICAL INTEGRITY PRINCIPLES & GUARDRAILS:\n"
    "1. You NEVER fabricate scores, ratings, reviews, respondent counts, or transaction statuses.\n"
    "2. When a user asks about colleges, scores, reviews, or ratings, call the appropriate backend tool to retrieve real platform data.\n"
    "3. Official scores start at 100 and are updated strictly in deterministic 20-submission blocks by the backend engine.\n"
    "4. All respondent profiles in the current system have self-declared, unverified affiliations.\n"
    "5. Adding an unknown college requires explicit user confirmation before creation.\n"
    "6. If retrieved data is empty or missing, state that clearly instead of guessing.\n"
    "7. Speak in a helpful, concise, conversational, and natural tone. Do NOT output raw JSON dumps in your text; explain the retrieved results clearly."
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

        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": formatted_messages,
            "temperature": 0.2,
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
            logger.warning("Groq API returned HTTP %s: %s", status, http_err.response.text[:200])
            raise RuntimeError(f"Groq API error ({status})") from http_err
        except httpx.TimeoutException as time_err:
            logger.warning("Groq API request timed out after %.1f seconds", self.timeout)
            raise RuntimeError("Groq API request timed out") from time_err
        except Exception as exc:
            logger.warning("Groq API connection failed: %s", exc)
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
