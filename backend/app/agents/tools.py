from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4
import asyncpg
from fastapi import HTTPException
from app.schemas.college import CreateCollegeRequest
from app.schemas.rating import (
    CreateRespondentRequest,
    SaveAnswerRequest,
)
from app.services.colleges import (
    create_college,
    get_college_by_id,
    get_college_by_name_or_id,
    get_college_ratings,
    search_colleges,
)
from app.services.ratings import (
    create_rating_session,
    get_active_parameters,
    get_rating_session_detail,
    save_rating_answer,
)
from app.services.respondents import create_or_update_respondent
from app.services.scoring import submit_rating_session

# Canonical declarations of the 9 approved tools for LLM tool calling
APPROVED_TOOLS_SPEC: List[Dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "search_colleges",
            "description": "Search colleges by name, city, state, or short code. Returns list of matches with scores and response counts.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "College name, location, or acronym to search for.",
                    },
                    "demo": {
                        "type": "boolean",
                        "description": "Set to true to include simulated demo colleges; default false.",
                        "default": False,
                    },
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_college_summary",
            "description": "Get official score, respondent breakdown, and verification disclaimer for a specific college.",
            "parameters": {
                "type": "object",
                "properties": {
                    "college_name_or_id": {
                        "type": "string",
                        "description": "College UUID, short code, or full/partial name.",
                    },
                },
                "required": ["college_name_or_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_parameter_ratings",
            "description": "Retrieve average rating scores, response counts, and score distributions for specific parameters of a college.",
            "parameters": {
                "type": "object",
                "properties": {
                    "college_id": {
                        "type": "string",
                        "description": "UUID of the college.",
                    },
                    "parameter_keys": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Optional list of parameter keys (e.g., ['food', 'hostel_quality']). If omitted, all parameters are returned.",
                    },
                },
                "required": ["college_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_active_parameters",
            "description": "Retrieve all 25 active rating parameters and their conversational question prompts.",
            "parameters": {
                "type": "object",
                "properties": {},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_unknown_college",
            "description": "Add a new, unlisted college to Campus Uncut. Requires explicit user confirmation of name, city, and state.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Official college name.",
                    },
                    "city": {
                        "type": "string",
                        "description": "City where campus is located.",
                    },
                    "state": {
                        "type": "string",
                        "description": "State or region.",
                    },
                    "confirmed": {
                        "type": "boolean",
                        "description": "Must be TRUE only after user has explicitly confirmed the name, city, and state.",
                    },
                },
                "required": ["name", "city", "state", "confirmed"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "start_rating_session",
            "description": "Initialize a rating session for a respondent to rate their declared college.",
            "parameters": {
                "type": "object",
                "properties": {
                    "college_id": {
                        "type": "string",
                        "description": "UUID of the college to rate.",
                    },
                    "respondent_client_uuid": {
                        "type": "string",
                        "description": "Client UUID from user session.",
                    },
                    "affiliation": {
                        "type": "string",
                        "enum": ["current_student", "alumnus"],
                        "description": "Self-declared affiliation.",
                    },
                    "respondent_name": {
                        "type": "string",
                        "description": "Optional display name.",
                    },
                    "college_email": {
                        "type": "string",
                        "description": "Official institutional email ID (e.g. user@sfit.ac.in). Must match declared college domain.",
                    },
                },
                "required": ["college_id", "respondent_client_uuid", "affiliation"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_rating_session",
            "description": "Check progress, answered questions, and missing parameters of an ongoing rating session.",
            "parameters": {
                "type": "object",
                "properties": {
                    "session_id": {
                        "type": "string",
                        "description": "UUID of the rating session.",
                    },
                },
                "required": ["session_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "save_rating_answer",
            "description": "Save or update a rating answer for a specific parameter (score 1-10 or No view).",
            "parameters": {
                "type": "object",
                "properties": {
                    "session_id": {
                        "type": "string",
                        "description": "UUID of the rating session.",
                    },
                    "parameter_key": {
                        "type": "string",
                        "description": "Key of the parameter (e.g., 'food', 'ragging').",
                    },
                    "score": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 10,
                        "description": "Integer rating between 1 and 10; omit if is_no_view is true.",
                    },
                    "is_no_view": {
                        "type": "boolean",
                        "description": "Set to true if respondent has No view / no experience on this parameter.",
                        "default": False,
                    },
                },
                "required": ["session_id", "parameter_key"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "submit_rating_session",
            "description": "Submit a completed rating session. Atomically validates all 25 answers and updates college score.",
            "parameters": {
                "type": "object",
                "properties": {
                    "session_id": {
                        "type": "string",
                        "description": "UUID of the rating session to submit.",
                    },
                },
                "required": ["session_id"],
            },
        },
    },
]


async def execute_tool(
    conn: asyncpg.Connection,
    tool_name: str,
    arguments: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Safely execute an approved backend tool.
    Never executes raw SQL; strictly routes through validated domain services.
    """
    try:
        if tool_name == "search_colleges":
            query = arguments.get("query", "")
            demo = bool(arguments.get("demo", False))
            results = await search_colleges(conn, query=query, include_demo=demo)
            return {
                "count": len(results),
                "colleges": [r.model_dump(mode="json") for r in results],
            }

        elif tool_name == "get_college_summary":
            ident = arguments.get("college_name_or_id", "").strip()
            if not ident:
                return {"error": "Missing college_name_or_id parameter."}
            college = await get_college_by_name_or_id(conn, ident)
            if not college:
                return {"found": False, "message": f"No college found matching '{ident}'."}
            return {
                "found": True,
                "college": college.model_dump(mode="json"),
                "affiliation_notice": "Affiliation of all student and alumni respondents is self-declared and unverified.",
            }

        elif tool_name == "get_parameter_ratings":
            col_id_raw = arguments.get("college_id") or arguments.get("college_name_or_id")
            if not col_id_raw:
                return {"error": "Missing college_id parameter."}
            try:
                college_id = UUID(str(col_id_raw))
            except ValueError:
                col = await get_college_by_name_or_id(conn, str(col_id_raw))
                if not col:
                    return {"found": False, "message": f"College '{col_id_raw}' not found."}
                college_id = col.college_id

            param_keys = arguments.get("parameter_keys")
            report = await get_college_ratings(conn, college_id, parameter_keys=param_keys)
            if not report:
                return {"found": False, "message": f"College {college_id} not found."}
            return report.model_dump(mode="json")

        elif tool_name == "get_active_parameters":
            params = await get_active_parameters(conn)
            # Serialize UUIDs in dicts
            return {
                "total_parameters": len(params),
                "parameters": [{k: str(v) if isinstance(v, UUID) else v for k, v in p.items()} for p in params],
            }

        elif tool_name == "create_unknown_college":
            name = arguments.get("name", "").strip()
            city = arguments.get("city", "").strip()
            state = arguments.get("state", "").strip()
            confirmed = bool(arguments.get("confirmed", False))

            if not name or not city or not state:
                return {
                    "error": "College name, city, and state are all required to add an unknown college.",
                }

            if not confirmed:
                return {
                    "status": "confirmation_required",
                    "message": f"Please confirm adding '{name}' located in {city}, {state} to Campus Uncut. Scores will start at 100 with zero ratings.",
                    "details": {"name": name, "city": city, "state": state},
                }

            # Confirmed: execute creation
            req = CreateCollegeRequest(name=name, city=city, state=state)
            created = await create_college(conn, req)
            return {
                "status": "created",
                "college": created.model_dump(mode="json"),
                "notice": "College created with initial score 100. Ratings are not available yet.",
            }

        elif tool_name == "start_rating_session":
            col_id_raw = arguments.get("college_id") or arguments.get("college_name_or_id")
            if not col_id_raw:
                return {"error": "Missing college_id or college_name_or_id."}
            try:
                col_id = UUID(str(col_id_raw))
            except ValueError:
                col = await get_college_by_name_or_id(conn, str(col_id_raw))
                if not col:
                    return {"found": False, "message": f"College '{col_id_raw}' not found."}
                col_id = col.college_id

            client_uuid_raw = arguments.get("respondent_client_uuid")
            try:
                client_uuid = UUID(str(client_uuid_raw)) if client_uuid_raw else uuid4()
            except ValueError:
                client_uuid = uuid4()

            affiliation = str(arguments.get("affiliation", "current_student")).strip()
            if affiliation not in ("current_student", "alumnus"):
                affiliation = "current_student"

            name = arguments.get("respondent_name")
            college_email = arguments.get("college_email") or arguments.get("respondent_college_email")

            # 1. Upsert respondent
            resp_req = CreateRespondentRequest(
                client_uuid=client_uuid,
                declared_college_id=col_id,
                affiliation=affiliation,
                display_name=name,
                college_email=college_email,
            )
            respondent = await create_or_update_respondent(conn, resp_req)

            # 2. Create session
            session = await create_rating_session(conn, col_id, respondent.id)
            return {
                "status": "session_active",
                "session": session.model_dump(mode="json"),
                "respondent": respondent.model_dump(mode="json"),
            }

        elif tool_name == "get_rating_session":
            session_id = UUID(str(arguments["session_id"]))
            detail = await get_rating_session_detail(conn, session_id)
            return detail.model_dump(mode="json")

        elif tool_name == "save_rating_answer":
            session_id = UUID(str(arguments["session_id"]))
            param_key = str(arguments["parameter_key"]).strip()
            score_raw = arguments.get("score")
            score = None
            if score_raw is not None:
                try:
                    score = int(score_raw)
                except (ValueError, TypeError):
                    score = None
            is_no_view = bool(arguments.get("is_no_view", False))

            # Look up parameter_id from key
            param_row = await conn.fetchrow(
                "SELECT id, name FROM parameters WHERE (key = $1 OR LOWER(name) = LOWER($1)) AND is_active = TRUE;",
                param_key,
            )
            if not param_row:
                return {"error": f"Active parameter '{param_key}' not found."}

            save_req = SaveAnswerRequest(score=score, is_no_view=is_no_view)
            saved = await save_rating_answer(conn, session_id, param_row["id"], save_req)
            return {
                "status": "saved",
                "parameter_key": param_key,
                "parameter_name": param_row["name"],
                "answer": saved.model_dump(mode="json"),
            }

        elif tool_name == "submit_rating_session":
            session_id = UUID(str(arguments["session_id"]))
            result = await submit_rating_session(conn, session_id)
            return result.model_dump(mode="json")

        else:
            return {"error": f"Unknown tool '{tool_name}'."}

    except HTTPException as http_exc:
        return {"error": True, "status_code": http_exc.status_code, "detail": http_exc.detail}
    except Exception as exc:
        return {"error": True, "detail": str(exc)}
