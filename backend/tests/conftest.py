import copy
from datetime import datetime, timezone
from pathlib import Path
import sys
from typing import Any, AsyncGenerator, Dict, List, Optional
from uuid import UUID, uuid4
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.api.deps import get_db
from app.core.config import Settings, get_settings
from app.db.session import set_db_pool
from app.main import create_app

# Canonical Seed IDs
SFIT_ID = UUID("c0000000-0000-0000-0000-000000000001")
JUDE_DEMO_ID = UUID("c0000000-0000-0000-0000-000000000002")
APEX_DEMO_ID = UUID("c0000000-0000-0000-0000-000000000003")
IITB_ID = UUID("dfa099b3-eae4-4833-869f-b05774cc586c")

PARAM_KEYS = [
    "food", "ragging", "professor_quality", "toilet_quality", "classroom_quality",
    "student_culture", "campus_placements", "womens_safety", "professor_harassment",
    "student_bullying", "party_scene", "alcohol_culture", "college_management",
    "academic_freedom", "freedom_of_expression", "infrastructure", "hostel_quality",
    "alumni_interaction", "drinking_water", "internet", "electricity",
    "transportation", "hospital_access", "hostel_conditions", "complaint_handling",
]


class MockAsyncpgTransaction:
    """Mock asyncpg transaction context manager."""
    def __init__(self, conn: "MockAsyncpgConnection"):
        self.conn = conn
        self._snapshot = None

    async def __aenter__(self):
        # Save snapshot of state for rollback support
        self._snapshot = copy.deepcopy(self.conn.db_state)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            # Rollback to snapshot on exception
            self.conn.db_state.clear()
            self.conn.db_state.update(self._snapshot)
        return False


class MockAsyncpgConnection:
    """In-memory mock connection simulating PostgreSQL and asyncpg for tests."""

    def __init__(self, db_state: Dict[str, Any]):
        self.db_state = db_state

    def transaction(self) -> MockAsyncpgTransaction:
        return MockAsyncpgTransaction(self)

    async def fetch(self, query: str, *args) -> List[Dict[str, Any]]:
        q = query.strip()
        # parameters list
        if "FROM parameters" in q:
            params = [copy.deepcopy(p) for p in self.db_state["parameters"]]
            if "WHERE is_active = TRUE" in q:
                params = [p for p in params if p.get("is_active", True)]
            params.sort(key=lambda x: x.get("display_order", 0))
            return params

        # colleges with registered email_domains
        if "FROM colleges WHERE email_domains IS NOT NULL" in q:
            return [copy.deepcopy(c) for c in self.db_state["colleges"].values() if c.get("email_domains")]

        # v_college_summary listing
        if "FROM v_college_summary" in q:
            colleges = list(self.db_state["colleges"].values())
            res = []
            for c in colleges:
                cid = c["id"]
                score_state = self.db_state["college_score_state"].get(cid, {})
                sessions = [
                    s for s in self.db_state["rating_sessions"].values()
                    if s["college_id"] == cid and s["status"] == "submitted"
                ]
                cur_student_cnt = len([s for s in sessions if s.get("respondent_role") == "current_student"])
                alumni_cnt = len([s for s in sessions if s.get("respondent_role") == "alumnus"])

                item = {
                    "college_id": cid,
                    "name": c["name"],
                    "short_code": c["short_code"],
                    "city": c["city"],
                    "state": c["state"],
                    "is_demo": c["is_demo"],
                    "current_score": score_state.get("current_score", 100),
                    "total_qualifying_low": score_state.get("total_qualifying_low", 0),
                    "total_qualifying_neutral": score_state.get("total_qualifying_neutral", 0),
                    "total_qualifying_high": score_state.get("total_qualifying_high", 0),
                    "last_event_at": score_state.get("last_event_at"),
                    "total_submitted_sessions": len(sessions),
                    "current_student_submissions": cur_student_cnt,
                    "alumni_submissions": alumni_cnt,
                    "email_domains": c.get("email_domains"),
                    "created_at": c["created_at"],
                }
                res.append(item)

            if "is_demo = FALSE" in q:
                res = [r for r in res if not r["is_demo"]]

            if len(args) > 0 and isinstance(args[0], str) and args[0].startswith("%"):
                search_term = args[0].strip("%").lower()
                res = [
                    r for r in res
                    if search_term in r["name"].lower()
                    or search_term in r["short_code"].lower()
                    or search_term in r["city"].lower()
                    or search_term in r["state"].lower()
                ]
            return res

        # v_college_parameter_stats
        if "FROM v_college_parameter_stats" in q:
            cid = args[0]
            answers = [
                a for a in self.db_state["rating_answers"].values()
                if self.db_state["rating_sessions"].get(a["session_id"], {}).get("college_id") == cid
                and self.db_state["rating_sessions"].get(a["session_id"], {}).get("status") == "submitted"
            ]
            res = []
            for p in self.db_state["parameters"]:
                pid = p["id"]
                p_answers = [a for a in answers if a["parameter_id"] == pid]
                num_scores = [a["score"] for a in p_answers if not a["is_no_view"] and a["score"] is not None]
                no_view_cnt = len([a for a in p_answers if a["is_no_view"]])
                avg = (sum(num_scores) / len(num_scores)) if num_scores else None

                if p_answers:
                    res.append({
                        "parameter_id": pid,
                        "parameter_key": p["key"],
                        "parameter_name": p["name"],
                        "parameter_category": p["category"],
                        "display_order": p["display_order"],
                        "numeric_response_count": len(num_scores),
                        "no_view_count": no_view_cnt,
                        "average_score": round(avg, 2) if avg is not None else None,
                    })
            return res

        # v_college_parameter_distributions
        if "FROM v_college_parameter_distributions" in q:
            cid = args[0]
            answers = [
                a for a in self.db_state["rating_answers"].values()
                if self.db_state["rating_sessions"].get(a["session_id"], {}).get("college_id") == cid
                and self.db_state["rating_sessions"].get(a["session_id"], {}).get("status") == "submitted"
                and a["score"] is not None
            ]
            counts = {}
            for a in answers:
                pid = a["parameter_id"]
                score = a["score"]
                counts[(pid, score)] = counts.get((pid, score), 0) + 1

            return [
                {"parameter_id": pid, "rating_score": score, "frequency": count}
                for (pid, score), count in counts.items()
            ]

        # rating_answers for session
        if "FROM rating_answers" in q and "WHERE session_id = $1" in q:
            sid = args[0]
            return [
                copy.deepcopy(a) for a in self.db_state["rating_answers"].values()
                if a["session_id"] == sid
            ]

        return []

    async def fetchrow(self, query: str, *args) -> Optional[Dict[str, Any]]:
        q = query.strip()

        # SELECT from colleges for duplicate normalized check
        if "FROM colleges" in q and "LOWER(TRIM(name))" in q:
            name, city, state = args[0], args[1], args[2]
            for c in self.db_state["colleges"].values():
                if (
                    c["name"].strip().lower() == name.strip().lower()
                    and c["city"].strip().lower() == city.strip().lower()
                    and c["state"].strip().lower() == state.strip().lower()
                ):
                    return copy.deepcopy(c)
            return None

        # v_college_summary by college_id
        if "FROM v_college_summary" in q and "WHERE college_id = $1" in q:
            cid = args[0]
            c = self.db_state["colleges"].get(cid)
            if not c:
                return None
            score_state = self.db_state["college_score_state"].get(cid, {})
            sessions = [
                s for s in self.db_state["rating_sessions"].values()
                if s["college_id"] == cid and s["status"] == "submitted"
            ]
            return {
                "college_id": cid,
                "name": c["name"],
                "short_code": c["short_code"],
                "city": c["city"],
                "state": c["state"],
                "is_demo": c["is_demo"],
                "current_score": score_state.get("current_score", 100),
                "total_qualifying_low": score_state.get("total_qualifying_low", 0),
                "total_qualifying_neutral": score_state.get("total_qualifying_neutral", 0),
                "total_qualifying_high": score_state.get("total_qualifying_high", 0),
                "last_event_at": score_state.get("last_event_at"),
                "total_submitted_sessions": len(sessions),
                "current_student_submissions": len([s for s in sessions if s.get("respondent_role") == "current_student"]),
                "alumni_submissions": len([s for s in sessions if s.get("respondent_role") == "alumnus"]),
                "email_domains": c.get("email_domains"),
                "created_at": c["created_at"],
            }

        # v_college_summary by short_code
        if "FROM v_college_summary" in q and "UPPER(short_code)" in q:
            code = args[0].strip().upper()
            for c in self.db_state["colleges"].values():
                if c["short_code"].upper() == code:
                    return await self.fetchrow("FROM v_college_summary WHERE college_id = $1", c["id"])
            return None

        # v_college_summary by exact name
        if "FROM v_college_summary" in q and "LOWER(TRIM(name))" in q:
            name = args[0].strip().lower()
            for c in self.db_state["colleges"].values():
                if c["name"].strip().lower() == name:
                    return await self.fetchrow("FROM v_college_summary WHERE college_id = $1", c["id"])
            return None

        # v_college_summary by partial name ILIKE
        if "FROM v_college_summary" in q and "name ILIKE $1" in q:
            pattern = args[0].strip("%").lower()
            for c in self.db_state["colleges"].values():
                if pattern in c["name"].lower():
                    return await self.fetchrow("FROM v_college_summary WHERE college_id = $1", c["id"])
            return None

        # colleges by id
        if "FROM colleges" in q and "WHERE id = $1" in q:
            cid = args[0]
            c = self.db_state["colleges"].get(cid)
            return copy.deepcopy(c) if c else None

        # people by id
        if "FROM people" in q and "WHERE id = $1" in q:
            pid = args[0]
            p = self.db_state["people"].get(pid)
            return copy.deepcopy(p) if p else None

        # people by client_uuid
        if "FROM people" in q and "WHERE client_uuid = $1" in q:
            cuuid = args[0]
            for p in self.db_state["people"].values():
                if p["client_uuid"] == cuuid:
                    return copy.deepcopy(p)
            return None

        # update people
        if "UPDATE people" in q:
            pid = args[0]
            declared_id = args[1]
            affil = args[2]
            disp_name = args[3]
            email = args[4] if len(args) > 4 else None
            p = self.db_state["people"].get(pid)
            if p:
                p["declared_college_id"] = declared_id
                p["affiliation"] = affil
                p["display_name"] = disp_name
                if email is not None or "college_email" not in p:
                    p["college_email"] = email
                return copy.deepcopy(p)

        # insert people
        if "INSERT INTO people" in q:
            new_id = uuid4()
            cuuid = args[0]
            disp_name = args[1]
            declared_id = args[2]
            affil = args[3]
            email = args[4] if len(args) > 4 else None
            row = {
                "id": new_id,
                "client_uuid": cuuid,
                "display_name": disp_name,
                "declared_college_id": declared_id,
                "affiliation": affil,
                "college_email": email,
                "is_verified": False,
                "created_at": datetime.now(timezone.utc),
            }
            self.db_state["people"][new_id] = row
            return copy.deepcopy(row)

        # rating_sessions by id
        if "FROM rating_sessions" in q and "WHERE id = $1" in q:
            sid = args[0]
            s = self.db_state["rating_sessions"].get(sid)
            return copy.deepcopy(s) if s else None

        # in_progress rating_sessions
        if "FROM rating_sessions" in q and "status = 'in_progress'" in q:
            cid, rid = args[0], args[1]
            for s in self.db_state["rating_sessions"].values():
                if s["college_id"] == cid and s["respondent_id"] == rid and s["status"] == "in_progress":
                    return copy.deepcopy(s)
            return None

        # insert rating_sessions
        if "INSERT INTO rating_sessions" in q:
            new_id = uuid4()
            cid, rid, role, is_demo = args[0], args[1], args[2], args[3]
            row = {
                "id": new_id,
                "college_id": cid,
                "respondent_id": rid,
                "respondent_role": role,
                "status": "in_progress",
                "is_demo": is_demo,
                "calculated_overall_rating": None,
                "started_at": datetime.now(timezone.utc),
                "submitted_at": None,
            }
            self.db_state["rating_sessions"][new_id] = row
            return copy.deepcopy(row)

        # update rating_sessions (submit)
        if "UPDATE rating_sessions" in q and "SET status = 'submitted'" in q:
            sid, mean = args[0], args[1]
            s = self.db_state["rating_sessions"].get(sid)
            if s:
                s["status"] = "submitted"
                s["calculated_overall_rating"] = mean
                s["submitted_at"] = datetime.now(timezone.utc)
                return {"submitted_at": s["submitted_at"]}

        # parameters by id and is_active
        if "FROM parameters WHERE id = $1" in q:
            pid = args[0]
            for p in self.db_state["parameters"]:
                if p["id"] == pid and p.get("is_active", True):
                    return copy.deepcopy(p)
            return None

        # parameters by key
        if "FROM parameters WHERE key = $1" in q:
            pkey = args[0]
            for p in self.db_state["parameters"]:
                if p["key"] == pkey and p.get("is_active", True):
                    return copy.deepcopy(p)
            return None

        # upsert rating_answers
        if "INSERT INTO rating_answers" in q:
            sid, pid, score, is_no_view = args[0], args[1], args[2], args[3]
            key = (sid, pid)
            existing = self.db_state["rating_answers"].get(key)
            if existing:
                existing["score"] = score
                existing["is_no_view"] = is_no_view
                existing["updated_at"] = datetime.now(timezone.utc)
                return copy.deepcopy(existing)
            else:
                new_ans = {
                    "id": uuid4(),
                    "session_id": sid,
                    "parameter_id": pid,
                    "score": score,
                    "is_no_view": is_no_view,
                    "updated_at": datetime.now(timezone.utc),
                }
                self.db_state["rating_answers"][key] = new_ans
                return copy.deepcopy(new_ans)

        # college_score_state by college_id
        if "FROM college_score_state WHERE college_id = $1" in q:
            cid = args[0]
            cs = self.db_state["college_score_state"].get(cid)
            return copy.deepcopy(cs) if cs else None

        return None

    async def fetchval(self, query: str, *args) -> Any:
        q = query.strip()

        # SELECT 1
        if q == "SELECT 1":
            return 1

        # Check college exists
        if "SELECT 1 FROM colleges WHERE id = $1" in q:
            cid = args[0]
            return 1 if cid in self.db_state["colleges"] else None

        # Check short code exists
        if "SELECT 1 FROM colleges WHERE UPPER(short_code)" in q:
            code = args[0].strip().upper()
            for c in self.db_state["colleges"].values():
                if c["short_code"].upper() == code:
                    return 1
            return None

        # Check people has submitted session
        if "SELECT 1 FROM rating_sessions WHERE respondent_id = $1 AND status = 'submitted'" in q:
            rid = args[0]
            for s in self.db_state["rating_sessions"].values():
                if s["respondent_id"] == rid and s["status"] == "submitted":
                    return 1
            return None

        # Check submitted session exists for respondent and college
        if "SELECT id FROM rating_sessions" in q and "status = 'submitted'" in q:
            cid, rid = args[0], args[1]
            exclude_id = args[2] if len(args) > 2 else None
            for s in self.db_state["rating_sessions"].values():
                if s["college_id"] == cid and s["respondent_id"] == rid and s["status"] == "submitted":
                    if exclude_id and s["id"] == exclude_id:
                        continue
                    return s["id"]
            return None

        # Insert college returning id
        if "INSERT INTO colleges" in q:
            name, short_code, city, state = args[0], args[1], args[2], args[3]
            new_id = uuid4()
            c = {
                "id": new_id,
                "name": name,
                "short_code": short_code,
                "city": city,
                "state": state,
                "is_demo": False,
                "created_at": datetime.now(timezone.utc),
            }
            self.db_state["colleges"][new_id] = c
            # Trigger logic: auto initialize college_score_state
            self.db_state["college_score_state"][new_id] = {
                "college_id": new_id,
                "current_score": 100,
                "total_qualifying_low": 0,
                "total_qualifying_neutral": 0,
                "total_qualifying_high": 0,
                "last_event_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
            return new_id

        # Insert score_contributions returning id
        if "INSERT INTO score_contributions" in q:
            cid, rid, sid, mean, cat = args[0], args[1], args[2], args[3], args[4]
            # Enforce unique (college_id, respondent_id)
            for sc in self.db_state["score_contributions"].values():
                if sc["college_id"] == cid and sc["respondent_id"] == rid:
                    return None  # ON CONFLICT DO NOTHING
            sc_id = uuid4()
            self.db_state["score_contributions"][sc_id] = {
                "id": sc_id,
                "college_id": cid,
                "respondent_id": rid,
                "session_id": sid,
                "unrounded_rating": mean,
                "category": cat,
                "created_at": datetime.now(timezone.utc),
            }
            return sc_id

        # Insert score_events returning id
        if "INSERT INTO score_events" in q:
            cid, cat, blk, delta, sb, sa, sid = args[0], args[1], args[2], args[3], args[4], args[5], args[6]
            for ev in self.db_state["score_events"].values():
                if ev["college_id"] == cid and ev["category"] == cat and ev["block_number"] == blk:
                    return None  # ON CONFLICT DO NOTHING
            ev_id = uuid4()
            self.db_state["score_events"][ev_id] = {
                "id": ev_id,
                "college_id": cid,
                "category": cat,
                "block_number": blk,
                "score_delta": delta,
                "score_before": sb,
                "score_after": sa,
                "triggered_by_session_id": sid,
                "created_at": datetime.now(timezone.utc),
            }
            return ev_id

        return None

    async def execute(self, query: str, *args) -> None:
        q = query.strip()
        # UPDATE college_score_state counters
        if "UPDATE college_score_state" in q and "SET total_qualifying_" in q:
            cid = args[0]
            cs = self.db_state["college_score_state"].get(cid)
            if cs:
                if "total_qualifying_low = total_qualifying_low + 1" in q:
                    cs["total_qualifying_low"] += 1
                elif "total_qualifying_neutral = total_qualifying_neutral + 1" in q:
                    cs["total_qualifying_neutral"] += 1
                elif "total_qualifying_high = total_qualifying_high + 1" in q:
                    cs["total_qualifying_high"] += 1
                cs["updated_at"] = datetime.now(timezone.utc)

        # UPDATE college_score_state score
        if "UPDATE college_score_state" in q and "SET current_score = $2" in q:
            cid, new_score = args[0], args[1]
            cs = self.db_state["college_score_state"].get(cid)
            if cs:
                cs["current_score"] = new_score
                cs["last_event_at"] = datetime.now(timezone.utc)
                cs["updated_at"] = datetime.now(timezone.utc)


class MockAsyncpgPool:
    """Mock connection pool providing MockAsyncpgConnection instances."""
    def __init__(self, db_state: Dict[str, Any]):
        self.db_state = db_state

    def acquire(self):
        class _AcquireContext:
            def __init__(self, db_state):
                self.conn = MockAsyncpgConnection(db_state)

            async def __aenter__(self):
                return self.conn

            async def __aexit__(self, exc_type, exc_val, exc_tb):
                pass

        return _AcquireContext(self.db_state)

    async def close(self):
        pass


def build_seeded_db_state() -> Dict[str, Any]:
    """Build in-memory representation of database seeded with migration 001-003 data."""
    now = datetime.now(timezone.utc)

    # 1. Seed Parameters
    parameters = []
    for idx, key in enumerate(PARAM_KEYS, 1):
        pid = UUID(f"a0000000-0000-0000-0000-{idx:012d}")
        parameters.append({
            "id": pid,
            "key": key,
            "name": key.replace("_", " ").title(),
            "category": "Academics" if idx <= 6 else ("Campus Safety" if idx <= 12 else "Campus Living"),
            "description": f"Description for {key}",
            "display_order": idx,
            "is_active": True,
        })

    # 2. Seed Colleges
    colleges = {
        SFIT_ID: {
            "id": SFIT_ID,
            "name": "St. Francis Institute of Technology",
            "short_code": "SFIT",
            "city": "Mumbai",
            "state": "Maharashtra",
            "is_demo": False,
            "email_domains": "sfit.ac.in",
            "created_at": now,
        },
        IITB_ID: {
            "id": IITB_ID,
            "name": "Indian Institute of Technology Bombay",
            "short_code": "IITB",
            "city": "Mumbai",
            "state": "Maharashtra",
            "is_demo": False,
            "email_domains": "iitb.ac.in",
            "created_at": now,
        },
        JUDE_DEMO_ID: {
            "id": JUDE_DEMO_ID,
            "name": "St. Jude Institute of Technology (Demo)",
            "short_code": "JUDE-DEMO",
            "city": "Bhopal",
            "state": "Madhya Pradesh",
            "is_demo": True,
            "email_domains": "stjude.edu,demo.stjude.edu",
            "created_at": now,
        },
        APEX_DEMO_ID: {
            "id": APEX_DEMO_ID,
            "name": "Apex Technical Academy (Demo)",
            "short_code": "APEX-DEMO",
            "city": "Coimbatore",
            "state": "Tamil Nadu",
            "is_demo": True,
            "email_domains": "apex.edu,demo.apex.edu",
            "created_at": now,
        },
    }

    # 3. Score States
    college_score_state = {
        SFIT_ID: {
            "college_id": SFIT_ID,
            "current_score": 100,
            "total_qualifying_low": 0,
            "total_qualifying_neutral": 0,
            "total_qualifying_high": 0,
            "last_event_at": now,
            "updated_at": now,
        },
        JUDE_DEMO_ID: {
            "college_id": JUDE_DEMO_ID,
            "current_score": 100,
            "total_qualifying_low": 19,
            "total_qualifying_neutral": 0,
            "total_qualifying_high": 0,
            "last_event_at": now,
            "updated_at": now,
        },
        APEX_DEMO_ID: {
            "college_id": APEX_DEMO_ID,
            "current_score": 100,
            "total_qualifying_low": 0,
            "total_qualifying_neutral": 0,
            "total_qualifying_high": 19,
            "last_event_at": now,
            "updated_at": now,
        },
    }

    people = {}
    rating_sessions = {}
    rating_answers = {}
    score_contributions = {}
    score_events = {}

    # Seed 19 low respondents & sessions for St. Jude Demo
    for s in range(1, 20):
        resp_id = UUID(f"d1000000-0000-0000-0000-{s:012d}")
        client_uuid = UUID(f"b1000000-0000-0000-0000-{s:012d}")
        people[resp_id] = {
            "id": resp_id,
            "client_uuid": client_uuid,
            "display_name": f"Demo Student {s}",
            "declared_college_id": JUDE_DEMO_ID,
            "affiliation": "current_student" if s % 2 == 1 else "alumnus",
            "is_verified": False,
            "created_at": now,
        }
        sess_id = UUID(f"e1000000-0000-0000-0000-{s:012d}")
        rating_sessions[sess_id] = {
            "id": sess_id,
            "college_id": JUDE_DEMO_ID,
            "respondent_id": resp_id,
            "respondent_role": "current_student" if s % 2 == 1 else "alumnus",
            "status": "submitted",
            "is_demo": True,
            "calculated_overall_rating": 2.5,
            "started_at": now,
            "submitted_at": now,
        }
        sc_id = UUID(f"f1000000-0000-0000-0000-{s:012d}")
        score_contributions[sc_id] = {
            "id": sc_id,
            "college_id": JUDE_DEMO_ID,
            "respondent_id": resp_id,
            "session_id": sess_id,
            "unrounded_rating": 2.5,
            "category": "low",
            "created_at": now,
        }
        for p in parameters:
            ans_id = uuid4()
            rating_answers[(sess_id, p["id"])] = {
                "id": ans_id,
                "session_id": sess_id,
                "parameter_id": p["id"],
                "score": 2 if s % 2 == 1 else 3,
                "is_no_view": False,
                "updated_at": now,
            }

    # Seed 19 high respondents & sessions for Apex Demo
    for s in range(1, 20):
        resp_id = UUID(f"d2000000-0000-0000-0000-{s:012d}")
        client_uuid = UUID(f"b2000000-0000-0000-0000-{s:012d}")
        people[resp_id] = {
            "id": resp_id,
            "client_uuid": client_uuid,
            "display_name": f"Demo Scholar {s}",
            "declared_college_id": APEX_DEMO_ID,
            "affiliation": "current_student" if s % 2 == 1 else "alumnus",
            "is_verified": False,
            "created_at": now,
        }
        sess_id = UUID(f"e2000000-0000-0000-0000-{s:012d}")
        rating_sessions[sess_id] = {
            "id": sess_id,
            "college_id": APEX_DEMO_ID,
            "respondent_id": resp_id,
            "respondent_role": "current_student" if s % 2 == 1 else "alumnus",
            "status": "submitted",
            "is_demo": True,
            "calculated_overall_rating": 8.5,
            "started_at": now,
            "submitted_at": now,
        }
        sc_id = UUID(f"f2000000-0000-0000-0000-{s:012d}")
        score_contributions[sc_id] = {
            "id": sc_id,
            "college_id": APEX_DEMO_ID,
            "respondent_id": resp_id,
            "session_id": sess_id,
            "unrounded_rating": 8.5,
            "category": "high",
            "created_at": now,
        }
        for p in parameters:
            ans_id = uuid4()
            rating_answers[(sess_id, p["id"])] = {
                "id": ans_id,
                "session_id": sess_id,
                "parameter_id": p["id"],
                "score": 8 if s % 2 == 1 else 9,
                "is_no_view": False,
                "updated_at": now,
            }

    return {
        "parameters": parameters,
        "colleges": colleges,
        "college_score_state": college_score_state,
        "people": people,
        "rating_sessions": rating_sessions,
        "rating_answers": rating_answers,
        "score_contributions": score_contributions,
        "score_events": score_events,
    }


@pytest.fixture
def mock_db_state() -> Dict[str, Any]:
    """Provide a fresh copy of the seeded database state for each test."""
    return build_seeded_db_state()


@pytest.fixture
def mock_conn(mock_db_state: Dict[str, Any]) -> MockAsyncpgConnection:
    """Provide a mock asyncpg connection bound to the test db state."""
    return MockAsyncpgConnection(mock_db_state)


@pytest_asyncio.fixture
async def client(mock_db_state: Dict[str, Any], monkeypatch: pytest.MonkeyPatch) -> AsyncGenerator[AsyncClient, None]:
    """HTTP client testing against FastAPI application with mocked database pool and deterministic mock LLM."""
    monkeypatch.setenv("LLM_PROVIDER", "mock")
    get_settings.cache_clear()
    pool = MockAsyncpgPool(mock_db_state)
    set_db_pool(pool)

    app = create_app()

    async def override_get_db() -> AsyncGenerator[MockAsyncpgConnection, None]:
        async with pool.acquire() as conn:
            yield conn

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

    set_db_pool(None)
    app.dependency_overrides.clear()
    get_settings.cache_clear()

