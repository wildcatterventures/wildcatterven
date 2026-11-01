import re
from typing import Any, List, Optional
from uuid import UUID
import asyncpg
from fastapi import HTTPException, status
from app.schemas.college import (
    CollegeDetail,
    CollegeRatingReport,
    CollegeSummary,
    CreateCollegeRequest,
    ParameterDistribution,
    ParameterRating,
)
from app.services.analytics import log_search_event


def generate_short_code(name: str, city: str) -> str:
    """Generate a clean, uppercase alphanumeric short code from college name and city."""
    words = [w for w in re.split(r"\W+", name) if w]
    initials = "".join(w[0] for w in words[:4]).upper()
    if len(initials) < 2:
        initials = re.sub(r"\W+", "", name)[:4].upper()

    clean_city = re.sub(r"\W+", "", city)[:3].upper()
    return f"{initials}-{clean_city}"


async def search_colleges(
    conn: asyncpg.Connection,
    query: Optional[str] = None,
    include_demo: bool = False,
    visitor_session_id: Optional[UUID] = None,
    input_mode: str = "text",
) -> List[CollegeSummary]:
    """Search colleges with optional query filter, demo data toggle, and non-blocking event logging."""
    where_clauses: list[str] = []
    params: list[Any] = []

    if not include_demo:
        where_clauses.append("is_demo = FALSE")

    if query and query.strip():
        param_idx = len(params) + 1
        pattern = f"%{query.strip()}%"
        where_clauses.append(
            f"(name ILIKE ${param_idx} OR short_code ILIKE ${param_idx} "
            f"OR city ILIKE ${param_idx} OR state ILIKE ${param_idx})"
        )
        params.append(pattern)

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
    sql = f"""
        SELECT 
            college_id, name, short_code, city, state, is_demo,
            current_score, total_submitted_sessions,
            current_student_submissions, alumni_submissions, email_domains, created_at,
            category, student_experience_average
        FROM v_college_summary
        {where_sql}
        ORDER BY is_demo ASC, name ASC;
    """
    rows = await conn.fetch(sql, *params)
    results = [CollegeSummary(**dict(r)) for r in rows]

    # Non-blocking search event logging for eligible search queries
    if query and query.strip():
        first_match_id = results[0].college_id if results else None
        await log_search_event(
            conn=conn,
            query=query,
            visitor_session_id=visitor_session_id,
            resolved_college_id=first_match_id,
            input_mode=input_mode,
        )

    return results


async def get_college_by_id(
    conn: asyncpg.Connection,
    college_id: UUID,
) -> Optional[CollegeDetail]:
    """Retrieve full college profile and score state by UUID."""
    sql = """
        SELECT 
            college_id, name, short_code, city, state, is_demo,
            current_score, total_qualifying_low, total_qualifying_neutral,
            total_qualifying_high, last_event_at, total_submitted_sessions,
            current_student_submissions, alumni_submissions, email_domains, created_at,
            category, student_experience_average
        FROM v_college_summary
        WHERE college_id = $1;
    """
    row = await conn.fetchrow(sql, college_id)
    if not row:
        return None
    return CollegeDetail(**dict(row))


async def get_college_by_name_or_id(
    conn: asyncpg.Connection,
    identifier: str,
) -> Optional[CollegeDetail]:
    """Find college by UUID, short_code, exact normalized name, or partial match."""
    cleaned = identifier.strip()

    # 1. Check if it's a UUID
    try:
        val_uuid = UUID(cleaned)
        college = await get_college_by_id(conn, val_uuid)
        if college:
            return college
    except (ValueError, AttributeError):
        pass

    # 2. Check exact short_code (case-insensitive)
    row = await conn.fetchrow(
        "SELECT college_id FROM v_college_summary WHERE UPPER(short_code) = UPPER($1) LIMIT 1;",
        cleaned,
    )
    if row:
        return await get_college_by_id(conn, row["college_id"])

    # 3. Check exact name (normalized)
    row = await conn.fetchrow(
        "SELECT college_id FROM v_college_summary WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) LIMIT 1;",
        cleaned,
    )
    if row:
        return await get_college_by_id(conn, row["college_id"])

    # 4. Partial name match
    row = await conn.fetchrow(
        "SELECT college_id FROM v_college_summary WHERE name ILIKE $1 ORDER BY is_demo ASC LIMIT 1;",
        f"%{cleaned}%",
    )
    if row:
        return await get_college_by_id(conn, row["college_id"])

    return None


async def get_college_ratings(
    conn: asyncpg.Connection,
    college_id: UUID,
    parameter_keys: Optional[List[str]] = None,
) -> Optional[CollegeRatingReport]:
    """Retrieve full rating report with all parameter statistics and distributions."""
    college = await get_college_by_id(conn, college_id)
    if not college:
        return None

    # Fetch active parameters from question bank / parameters table
    params_sql = """
        SELECT id, key, name, category, display_order
        FROM parameters
        WHERE is_active = TRUE
        ORDER BY display_order ASC;
    """
    active_params = await conn.fetch(params_sql)

    # Fetch stats from view
    stats_sql = """
        SELECT 
            parameter_id, parameter_key, parameter_name, parameter_category,
            display_order, numeric_response_count, no_view_count, average_score
        FROM v_college_parameter_stats
        WHERE college_id = $1;
    """
    stats_rows = await conn.fetch(stats_sql, college_id)
    stats_by_id = {r["parameter_id"]: dict(r) for r in stats_rows}

    # Fetch distributions from view
    dist_sql = """
        SELECT parameter_id, rating_score, frequency
        FROM v_college_parameter_distributions
        WHERE college_id = $1;
    """
    dist_rows = await conn.fetch(dist_sql, college_id)
    dist_by_param: dict[UUID, list[ParameterDistribution]] = {}
    for d in dist_rows:
        pid = d["parameter_id"]
        dist_by_param.setdefault(pid, []).append(
            ParameterDistribution(
                rating_score=d["rating_score"],
                frequency=d["frequency"],
            )
        )

    # Assemble parameter reports (ensuring all 25 active parameters appear)
    parameter_ratings: List[ParameterRating] = []
    for p in active_params:
        pid = p["id"]
        pkey = p["key"]

        # If parameter_keys filter was specified, skip non-matching
        if parameter_keys and pkey not in parameter_keys:
            continue

        if pid in stats_by_id:
            s = stats_by_id[pid]
            avg = float(s["average_score"]) if s["average_score"] is not None else None
            num_cnt = int(s["numeric_response_count"])
            no_cnt = int(s["no_view_count"])
        else:
            avg = None
            num_cnt = 0
            no_cnt = 0

        dists = dist_by_param.get(pid, [])
        # Sort distributions by score 1..10
        dists.sort(key=lambda x: x.rating_score)

        parameter_ratings.append(
            ParameterRating(
                parameter_id=pid,
                parameter_key=pkey,
                parameter_name=p["name"],
                parameter_category=p["category"],
                display_order=p["display_order"],
                numeric_response_count=num_cnt,
                no_view_count=no_cnt,
                average_score=avg,
                distributions=dists,
            )
        )

    return CollegeRatingReport(
        college_id=college.college_id,
        name=college.name,
        short_code=college.short_code,
        is_demo=college.is_demo,
        current_score=college.current_score,
        total_submitted_sessions=college.total_submitted_sessions,
        current_student_submissions=college.current_student_submissions,
        alumni_submissions=college.alumni_submissions,
        parameters=parameter_ratings,
        category=college.category,
        student_experience_average=college.student_experience_average,
    )


async def create_college(
    conn: asyncpg.Connection,
    req: CreateCollegeRequest,
) -> CollegeDetail:
    """Create a new unknown college with score initialized to 100 and zero ratings."""
    # Check normalized duplicate
    dup_row = await conn.fetchrow(
        """
        SELECT id, name, city, state 
        FROM colleges 
        WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) 
          AND LOWER(TRIM(city)) = LOWER(TRIM($2)) 
          AND LOWER(TRIM(state)) = LOWER(TRIM($3))
        LIMIT 1;
        """,
        req.name,
        req.city,
        req.state,
    )
    if dup_row:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"College '{req.name}' in {req.city}, {req.state} already exists (ID: {dup_row['id']}).",
        )

    # Determine unique short code
    base_code = req.short_code.strip().upper() if req.short_code else generate_short_code(req.name, req.city)
    short_code = base_code
    suffix = 1

    while True:
        exists = await conn.fetchval(
            "SELECT 1 FROM colleges WHERE UPPER(short_code) = UPPER($1);",
            short_code,
        )
        if not exists:
            break
        suffix += 1
        short_code = f"{base_code}-{suffix}"

    clean_email_domains = req.email_domains.strip().lower() if req.email_domains else None

    try:
        new_id = await conn.fetchval(
            """
            INSERT INTO colleges (name, short_code, city, state, is_demo, email_domains)
            VALUES ($1, $2, $3, $4, FALSE, $5)
            RETURNING id;
            """,
            req.name,
            short_code,
            req.city,
            req.state,
            clean_email_domains,
        )
    except asyncpg.UniqueViolationError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A college with matching normalized name and location or short code already exists.",
        ) from exc

    # Database trigger fn_init_college_score_state automatically inserted college_score_state row
    created_college = await get_college_by_id(conn, new_id)
    if not created_college:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve newly created college.",
        )
    return created_college
