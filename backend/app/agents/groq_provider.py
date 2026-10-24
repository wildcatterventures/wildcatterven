import json
import logging
from typing import Any, Dict, List, Tuple
import httpx
from app.agents.base import BaseLLMProvider
from app.core.config import get_settings

logger = logging.getLogger("campus_uncut.agents.groq")


class GroqLLMProvider(BaseLLMProvider):
    """
    Groq-compatible LLM provider implementing OpenAI-standard tool calling.
    Uses free-tier tool-calling models such as llama-3.3-70b-versatile or llama-3.1-8b-instant.
    """

    def __init__(self, api_key: str, model: str = "llama-3.3-70b-versatile", timeout: float = 20.0):
        self.api_key = api_key
        self.model = model
        self.timeout = timeout
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"

    async def generate_response(
        self,
        messages: List[Dict[str, Any]],
        tools: List[Dict[str, Any]],
    ) -> Tuple[str, List[Dict[str, Any]]]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        # Format system prompt with strict guardrails
        system_instruction = {
            "role": "system",
            "content": (
                "You are the Campus Uncut AI Assistant for an unedited student college intelligence platform. "
                "CRITICAL PRINCIPLES & GUARDRAILS:\n"
                "1. You NEVER fabricate scores, ratings, reviews, respondent counts, or transaction statuses.\n"
                "2. When a user asks about a college or ratings, call the appropriate backend tool to retrieve real data.\n"
                "3. College scores start at 100. Official scores and thresholds are calculated exclusively by deterministic backend code.\n"
                "4. All respondent profiles in the current prototype have self-declared, unverified affiliations.\n"
                "5. Unknown colleges require user confirmation before creation.\n"
                "6. If retrieved data is empty or missing, state that clearly instead of guessing."
            ),
        }

        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": [system_instruction] + messages,
            "temperature": 0.2,
        }

        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(self.base_url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()

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

            parsed_tool_calls.append(
                {
                    "id": tc.get("id", "call_unknown"),
                    "name": fname,
                    "arguments": fargs,
                }
            )

        return content, parsed_tool_calls
