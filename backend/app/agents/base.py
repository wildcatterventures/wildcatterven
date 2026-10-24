from abc import ABC, abstractmethod
from typing import Any, Dict, List, Tuple


class BaseLLMProvider(ABC):
    """Abstract interface for tool-calling language model providers."""

    @abstractmethod
    async def generate_response(
        self,
        messages: List[Dict[str, Any]],
        tools: List[Dict[str, Any]],
    ) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Generate assistant response and optional tool calls.
        Returns:
            Tuple of (assistant_reply_text, list_of_tool_call_dicts)
            where each tool call dict contains {"id": str, "name": str, "arguments": dict}
        """
        pass
