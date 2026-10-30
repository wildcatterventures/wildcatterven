import json
import re
from typing import Any, Dict, List, Optional, Tuple
from app.agents.base import BaseLLMProvider
from app.services.safety import evaluate_input_safety


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

                # Rating session progress inquiry
                if "answers" in data or "answered_parameters_count" in data or "session_id" in data:
                    answered = data.get("answered_parameters_count", len(data.get("answers", [])))
                    total = data.get("total_parameters_count", 25)
                    return (
                        f"You are currently answering questions for your rating session ({answered} of {total} completed). "
                        "You can speak your rating from 1 to 10 or say 'No view' for each criterion.",
                        [],
                    )

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

        if last_user_msg:
            safety_eval = evaluate_input_safety(last_user_msg)
            if not safety_eval.is_safe:
                return safety_eval.refusal_message, []

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

        # Intent: Submit Rating Session
        if "submit" in lower_input and any(w in lower_input for w in ["rating", "session", "my rating", "review"]):
            return (
                "Submitting your completed rating session...",
                [{"id": "mock_call_submit", "name": "submit_rating_session", "arguments": {"session_id": "00000000-0000-0000-0000-000000000000"}}],
            )

        # Intent: What question am I answering / Rating Session Progress
        if any(phrase in lower_input for phrase in [
            "what question", "which question", "am i answering", "current question",
            "rating progress", "session progress", "how many answered"
        ]):
            return (
                "Checking your current rating progress and active question...",
                [{"id": "mock_call_get_session", "name": "get_rating_session", "arguments": {"session_id": "00000000-0000-0000-0000-000000000000"}}],
            )

        # Intent: Save Rating Answer
        words_to_num = {
            "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
            "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
        }
        score_val: Optional[int] = None
        is_no_view_val = False

        if "no view" in lower_input or "not applicable" in lower_input or "n/a" in lower_input:
            is_no_view_val = True
        else:
            num_match = re.search(r"\b(10|[1-9]|one|two|three|four|five|six|seven|eight|nine|ten)\b", lower_input)
            if num_match:
                token = num_match.group(1).lower()
                score_val = words_to_num.get(token, int(token) if token.isdigit() else None)

        if ("save" in lower_input or "rate" in lower_input) and (score_val is not None or is_no_view_val):
            # Detect parameter key from input if mentioned
            detected_param = "food"
            param_key_map = {
                "food": "food", "mess": "food", "canteen": "food",
                "ragging": "ragging", "safety": "womens_safety", "women": "womens_safety",
                "prof": "professor_quality", "faculty": "professor_quality",
                "toilet": "toilet_quality", "washroom": "toilet_quality",
                "lab": "classroom_quality", "classroom": "classroom_quality",
                "culture": "student_culture", "placement": "campus_placements", "placements": "campus_placements",
                "hostel": "hostel_quality", "wifi": "internet", "internet": "internet",
                "water": "drinking_water", "electric": "electricity", "transport": "transportation",
            }
            for k, pkey in param_key_map.items():
                if k in lower_input:
                    detected_param = pkey
                    break

            return (
                f"Saving your rating evaluation as {score_val if not is_no_view_val else 'No view'}...",
                [{
                    "id": "mock_call_save_answer",
                    "name": "save_rating_answer",
                    "arguments": {
                        "session_id": "00000000-0000-0000-0000-000000000000",
                        "parameter_key": detected_param,
                        "score": score_val,
                        "is_no_view": is_no_view_val,
                    },
                }],
            )

        # Intent: Start Rating Session
        if any(phrase in lower_input for phrase in ["start rating", "rate my college", "begin rating", "rate a college", "i want to rate"]):
            target_col = "SFIT"
            for key, code in known_colleges.items():
                if key in lower_input:
                    target_col = code
                    break
            return (
                f"Initializing official rating session for {target_col}...",
                [{
                    "id": "mock_call_start_rating",
                    "name": "start_rating_session",
                    "arguments": {
                        "college_id": "c0000000-0000-0000-0000-000000000001",
                        "college_name_or_id": target_col,
                        "affiliation": "current_student",
                        "respondent_name": "Student Respondent",
                    },
                }],
            )

        # Intent: Parameter Ratings / Placement / Hostel Specific Ratings
        if any(phrase in lower_input for phrase in [
            "placements at", "placements for", "hostel rating", "hostel at", "how do students rate placements",
            "show me the hostel", "hostels at", "food rating", "safety at"
        ]):
            target_col = "VJTI" if "vjti" in lower_input else "SFIT"
            for key, code in known_colleges.items():
                if key in lower_input:
                    target_col = code
                    break

            param_filter = []
            if "placement" in lower_input:
                param_filter.append("campus_placements")
            if "hostel" in lower_input:
                param_filter.append("hostel_quality")
            if "food" in lower_input:
                param_filter.append("food")
            if "safety" in lower_input:
                param_filter.append("womens_safety")

            return (
                f"Retrieving parameter ratings for {target_col}...",
                [{
                    "id": "mock_call_param_ratings",
                    "name": "get_parameter_ratings",
                    "arguments": {
                        "college_id": "c0000000-0000-0000-0000-000000000001" if target_col == "SFIT" else "c0000000-0000-0000-0000-000000000004",
                        "college_name_or_id": target_col,
                        "parameter_keys": param_filter if param_filter else None,
                    },
                }],
            )

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

        if "add a college" in lower_input or "add college" in lower_input or "not listed" in lower_input or "unlisted" in lower_input:
            confirmed = "confirm" in lower_input or "yes" in lower_input
            return (
                "Please confirm the details of the unlisted college you would like to add.",
                [{
                    "id": "mock_call_create_college",
                    "name": "create_unknown_college",
                    "arguments": {
                        "name": "Unlisted Polytechnic Institute",
                        "city": "Mumbai",
                        "state": "Maharashtra",
                        "confirmed": confirmed,
                    },
                }],
            )

        # Default conversational assistance
        return (
            "Welcome to Campus Uncut! College life, without the editing.\n\n"
            "You can ask me to:\n"
            "• Search for any institution (e.g., 'Search for SFIT' or 'Colleges in Mumbai')\n"
            "• Look up verified scores (e.g., 'What is the score of SFIT?')\n"
            "• Check parameter ratings (e.g., 'Show me the hostel rating' or 'Placements at VJTI')\n"
            "• Start rating your campus (e.g., 'Start rating my college')\n"
            "• Check active rating question (e.g., 'What question am I answering?')\n"
            "• Save or submit ratings by voice (e.g., 'Save my rating as eight' or 'Submit my rating')\n"
            "• Add an unlisted college (e.g., 'Add XYZ College in Nashik, Maharashtra')",
            [],
        )
