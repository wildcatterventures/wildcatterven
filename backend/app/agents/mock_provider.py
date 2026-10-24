import re
from typing import Any, Dict, List, Tuple
from app.agents.base import BaseLLMProvider


class MockLLMProvider(BaseLLMProvider):
    """
    Deterministic rule-based mock provider.
    Enables offline development and test execution without API keys or network dependencies.
    Accurately orchestrates approved backend tools without fabricating any score data.
    """

    async def generate_response(
        self,
        messages: List[Dict[str, Any]],
        tools: List[Dict[str, Any]],
    ) -> Tuple[str, List[Dict[str, Any]]]:
        # Extract last user message
        last_user_msg = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                last_user_msg = m.get("content", "").strip()
                break

        # Check if previous message was tool execution result
        last_msg = messages[-1] if messages else {}
        if last_msg.get("role") == "tool":
            # Synthesize answer from tool output
            tool_content = str(last_msg.get("content", ""))
            return (
                f"Based on retrieved platform records:\n\n{tool_content}",
                [],
            )

        lower_input = last_user_msg.lower()

        # 1. Search Colleges Intent
        # Patterns like: "search sfit", "find colleges in mumbai", "search colleges", "look up apex"
        search_match = re.search(r"(?:search|find|look up|show me)\s+(?:for\s+)?(?:colleges?\s+(?:in\s+)?)?(.+)", lower_input)
        if ("search" in lower_input or "find" in lower_input or "colleges" in lower_input) and search_match:
            query = search_match.group(1).strip()
            # Clean common filler words
            query = re.sub(r"^(colleges?|for|all)\s+", "", query).strip()
            if not query:
                query = "SFIT"
            return (
                f"Searching the platform directory for '{query}'...",
                [
                    {
                        "id": "mock_call_search",
                        "name": "search_colleges",
                        "arguments": {"query": query, "demo": True},
                    }
                ],
            )

        # 2. Parameter Ratings Intent
        # Patterns like: "ratings at SFIT", "food rating", "hostel ratings"
        if any(w in lower_input for w in ["rating", "ratings", "score", "reviews", "feedback"]):
            # Check for known college mentions or identifiers
            if "sfit" in lower_input:
                return (
                    "Retrieving verified ratings and parameter breakdown for St. Francis Institute of Technology (SFIT)...",
                    [
                        {
                            "id": "mock_call_summary",
                            "name": "get_college_summary",
                            "arguments": {"college_name_or_id": "SFIT"},
                        }
                    ],
                )
            elif "jude" in lower_input:
                return (
                    "Retrieving ratings for St. Jude Institute of Technology (Demo)...",
                    [
                        {
                            "id": "mock_call_summary",
                            "name": "get_college_summary",
                            "arguments": {"college_name_or_id": "JUDE-DEMO"},
                        }
                    ],
                )
            elif "apex" in lower_input:
                return (
                    "Retrieving ratings for Apex Technical Academy (Demo)...",
                    [
                        {
                            "id": "mock_call_summary",
                            "name": "get_college_summary",
                            "arguments": {"college_name_or_id": "APEX-DEMO"},
                        }
                    ],
                )

        # 3. Active Parameters / Question Bank Intent
        if any(w in lower_input for w in ["parameters", "questions", "question bank", "criteria", "categories"]):
            return (
                "Retrieving the 25 official rating parameters from the database...",
                [
                    {
                        "id": "mock_call_params",
                        "name": "get_active_parameters",
                        "arguments": {},
                    }
                ],
            )

        # 4. Unknown College Creation Intent
        # E.g. "add college National Institute of Design in Ahmedabad, Gujarat"
        add_match = re.search(
            r"(?:add|create)\s+(?:college\s+)?(.+?)\s+in\s+([^,]+)(?:,\s*|\s+in\s+)(.+)",
            last_user_msg,
            re.IGNORECASE,
        )
        if add_match:
            c_name = add_match.group(1).strip()
            c_city = add_match.group(2).strip()
            c_state = add_match.group(3).strip()
            confirmed = "confirm" in lower_input or "yes" in lower_input
            return (
                f"Processing unknown college creation for '{c_name}' in {c_city}, {c_state}...",
                [
                    {
                        "id": "mock_call_create_college",
                        "name": "create_unknown_college",
                        "arguments": {
                            "name": c_name,
                            "city": c_city,
                            "state": c_state,
                            "confirmed": confirmed,
                        },
                    }
                ],
            )

        # 5. Rating submission intent
        if "submit" in lower_input and "rating" in lower_input:
            # Check if session_id is in input or messages
            session_match = re.search(r"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})", last_user_msg, re.I)
            if session_match:
                return (
                    "Submitting your rating session to the scoring engine...",
                    [
                        {
                            "id": "mock_call_submit",
                            "name": "submit_rating_session",
                            "arguments": {"session_id": session_match.group(1)},
                        }
                    ],
                )

        # Default fallback guidance
        return (
            "Welcome to Campus Uncut! College life, without the editing.\n\n"
            "You can ask me to:\n"
            "• Search for any college (e.g., 'Search for SFIT' or 'Colleges in Mumbai')\n"
            "• View parameter ratings (e.g., 'What are the ratings at SFIT?')\n"
            "• Check the question bank (e.g., 'List rating parameters')\n"
            "• Add an unlisted college (e.g., 'Add XYZ College in Pune, Maharashtra')",
            [],
        )
