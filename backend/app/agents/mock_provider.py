import json
import re
from typing import Any, Dict, List, Optional, Tuple
from app.agents.base import BaseLLMProvider


class MockLLMProvider(BaseLLMProvider):
    """
    Deterministic rule-based mock provider.
    Enables offline development and test execution without API keys or network dependencies.
    Accurately orchestrates approved backend tools and generates natural-language synthesis without raw JSON.
    """

    async def generate_response(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> Tuple[str, List[Dict[str, Any]]]:
        # 1. Synthesize natural language answer if previous message was tool result
        last_msg = messages[-1] if messages else {}
        if last_msg.get("role") == "tool":
            raw_content = last_msg.get("content", "{}")
            try:
                data = json.loads(raw_content) if isinstance(raw_content, str) else raw_content
            except Exception:
                data = {}

            # Natural synthesis based on tool results
            if isinstance(data, dict):
                # Search colleges result
                if "colleges" in data and isinstance(data["colleges"], list):
                    cols = data["colleges"]
                    if not cols:
                        return (
                            "I searched the institutional registry, but no matching colleges were found. "
                            "You can try searching by city or add an unlisted college using the 'Add Unlisted College' button.",
                            [],
                        )
                    col_names = ", ".join(f"{c.get('name')} ({c.get('city')})" for c in cols[:3])
                    return (
                        f"I found {len(cols)} institutional record{'s' if len(cols) != 1 else ''} in our directory, including {col_names}. "
                        "Explore the full details and verified scores in the cards below.",
                        [],
                    )

                # College summary result
                if "college" in data and isinstance(data["college"], dict):
                    col = data["college"]
                    name = col.get("name", "College")
                    city = col.get("city", "")
                    state = col.get("state", "")
                    score = col.get("current_score", 100)
                    total = col.get("total_submitted_sessions", 0)

                    status_msg = (
                        f"It currently has {total} verified student/alumni review{'s' if total != 1 else ''}."
                        if total > 0
                        else "It is currently awaiting its first 20 qualifying reviews to adjust from the clean base of 100."
                    )
                    return (
                        f"{name} ({city}, {state}) currently has an official platform score of {score}. {status_msg}",
                        [],
                    )

                # Parameter ratings report
                if "parameters" in data and isinstance(data["parameters"], list):
                    col_name = data.get("college_name", "the campus")
                    score = data.get("current_score", 100)
                    return (
                        f"Here is the parameter-level breakdown for {col_name} (Base Score: {score}). "
                        "Ratings reflect authenticated student experiences across campus living, safety, academics, and governance.",
                        [],
                    )

                # Confirmation required for unknown college
                if data.get("status") == "confirmation_required":
                    details = data.get("details", {})
                    name = details.get("name", "the institution")
                    city = details.get("city", "")
                    state = details.get("state", "")
                    return (
                        f"To protect registry integrity, please confirm adding {name} located in {city}, {state}. "
                        "Once confirmed, it will be added with a baseline score of 100 awaiting student ratings.",
                        [],
                    )

                # Successfully created unknown college
                if data.get("status") == "created":
                    col = data.get("college", {})
                    name = col.get("name", "The college")
                    return (
                        f"{name} has been successfully registered on Campus Uncut! "
                        "It has been initialized with a clean baseline score of 100 and is now open for student ratings.",
                        [],
                    )

                # Rating session started
                if data.get("status") == "session_active":
                    return (
                        "Your rating session has been initialized. You can now evaluate the college across each of the 25 official parameters.",
                        [],
                    )

                # Rating answer saved
                if data.get("status") == "saved":
                    pname = data.get("parameter_name", "parameter")
                    return f"Your evaluation for {pname} has been saved.", []

                # Rating session submitted
                if "new_score" in data:
                    score = data.get("new_score")
                    return f"Thank you! Your rating session has been submitted. The college score is now {score}.", []

            return "Retrieved official platform records. Check the summary card below for details.", []

        # 2. Extract last user message to understand intent
        last_user_msg = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                last_user_msg = m.get("content", "").strip()
                break

        lower_input = last_user_msg.lower()

        # Check for specific college keywords
        known_colleges = {
            "sfit": "SFIT",
            "francis": "SFIT",
            "vjti": "VJTI",
            "jijabai": "VJTI",
            "coep": "COEP",
            "iit bombay": "IITB",
            "iitb": "IITB",
            "spit": "SPIT",
            "sardar patel": "SPIT",
            "vidyalankar": "VIT-MUM",
            "pict": "PICT",
            "walchand": "WCE",
            "wce": "WCE",
        }

        # Intent 1: Search Colleges
        search_match = re.search(
            r"(?:search|find|look up|show me|explore|colleges in)\s+(?:for\s+)?(?:colleges?\s+(?:in\s+)?)?(.+)",
            lower_input,
        )
        if ("search" in lower_input or "find" in lower_input or "colleges in" in lower_input or "show me" in lower_input) and search_match:
            query = search_match.group(1).strip()
            query = re.sub(r"^(colleges?|for|all)\s+", "", query).strip()
            if not query:
                query = "Mumbai"
            return (
                f"Searching the platform directory for '{query}'...",
                [{"id": "mock_call_search", "name": "search_colleges", "arguments": {"query": query}}],
            )

        # Intent 2: Specific College Ratings / Score / Placements
        if any(w in lower_input for w in ["rating", "ratings", "score", "reviews", "placement", "placements", "hostel", "food", "safety"]):
            for key, code in known_colleges.items():
                if key in lower_input:
                    return (
                        f"Retrieving official scores and parameter breakdown for {code}...",
                        [{"id": "mock_call_summary", "name": "get_college_summary", "arguments": {"college_name_or_id": code}}],
                    )

        # Direct college name mention
        for key, code in known_colleges.items():
            if lower_input == key or lower_input == f"search {key}" or lower_input == f"{key} score":
                return (
                    f"Retrieving profile for {code}...",
                    [{"id": "mock_call_summary", "name": "get_college_summary", "arguments": {"college_name_or_id": code}}],
                )

        # Intent 3: Active Parameters / Question Bank
        if any(w in lower_input for w in ["parameters", "questions", "question bank", "criteria", "categories"]):
            return (
                "Retrieving the 25 official rating parameters from the database...",
                [{"id": "mock_call_params", "name": "get_active_parameters", "arguments": {}}],
            )

        # Intent 4: Unknown College Creation
        add_match = re.search(
            r"(?:add|create|register)\s+(?:college\s+)?(.+?)\s+in\s+([^,]+)(?:,\s*|\s+in\s+)(.+)",
            last_user_msg,
            re.IGNORECASE,
        )
        if add_match:
            c_name = add_match.group(1).strip()
            c_city = add_match.group(2).strip()
            c_state = add_match.group(3).strip()
            confirmed = "confirm" in lower_input or "yes" in lower_input
            return (
                f"Processing unlisted college registration for '{c_name}' in {c_city}, {c_state}...",
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

        # Default conversational assistance
        return (
            "Welcome to Campus Uncut! College life, without the editing.\n\n"
            "You can ask me to:\n"
            "• Search for any institution (e.g., 'Search for SFIT' or 'Colleges in Pune')\n"
            "• Look up verified scores (e.g., 'What is the score of COEP?')\n"
            "• Check parameter ratings (e.g., 'How are hostels rated at VJTI?')\n"
            "• Explore rating criteria (e.g., 'List all 25 parameters')\n"
            "• Add an unlisted college (e.g., 'Add XYZ College in Nashik, Maharashtra')",
            [],
        )
