from typing import List, Optional
from uuid import UUID
import asyncpg
from fastapi import HTTPException, status
from app.schemas.rating import (
    RatingAnswerResponse,
    RatingSessionDetail,
    RatingSessionResponse,
    SaveAnswerRequest,
)


async def get_active_parameters(conn: asyncpg.Connection) -> List[dict]:
    """Retrieve all active rating parameters ordered by display order."""
    sql = """
        SELECT id, key, name, category, description, display_order
        FROM parameters
        WHERE is_active = TRUE
        ORDER BY display_order ASC;
    """
    rows = await conn.fetch(sql)
    return [dict(r) for r in rows]


async def create_rating_session(
    conn: asyncpg.Connection,
    college_id: UUID,
    respondent_id: UUID,
) -> RatingSessionResponse:
    """
    Initialize a rating session for an unverified respondent.
    Validates declared college match and blocks duplicate submitted sessions.
    """
    # 1. Fetch college
    college = await conn.fetchrow(
        "SELECT id, is_demo FROM colleges WHERE id = $1;",
        college_id,
    )
    if not college:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"College {college_id} not found.",
        )

    # 2. Fetch respondent
    respondent = await conn.fetchrow(
        "SELECT id, declared_college_id, affiliation, college_email FROM people WHERE id = $1;",
        respondent_id,
    )
    if not respondent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Respondent profile {respondent_id} not found.",
        )

    # 3. Verify respondent declared college matches target college
    if respondent["declared_college_id"] != college_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Respondent's declared college does not match this college.",
        )

    # 3b. Double-check college email domain affinity if set
    if respondent["college_email"]:
        from app.services.email_validation import validate_college_email_affinity
        await validate_college_email_affinity(conn, respondent["college_email"], college_id)


    # 4. Check if respondent already has a submitted session for this college
    submitted_exists = await conn.fetchval(
        """
        SELECT id FROM rating_sessions
        WHERE college_id = $1 AND respondent_id = $2 AND status = 'submitted'
        LIMIT 1;
        """,
        college_id,
        respondent_id,
    )
    if submitted_exists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A rating session has already been submitted for this college from this profile.",
        )

    # 5. Check if an in_progress session already exists; if so, resume it
    in_progress = await conn.fetchrow(
        """
        SELECT id, college_id, respondent_id, respondent_role, status, is_demo,
               calculated_overall_rating, started_at, submitted_at
        FROM rating_sessions
        WHERE college_id = $1 AND respondent_id = $2 AND status = 'in_progress'
        ORDER BY started_at DESC
        LIMIT 1;
        """,
        college_id,
        respondent_id,
    )
    if in_progress:
        return RatingSessionResponse(**dict(in_progress))

    # 6. Insert new session
    row = await conn.fetchrow(
        """
        INSERT INTO rating_sessions (
            college_id, respondent_id, respondent_role, status, is_demo
        )
        VALUES ($1, $2, $3, 'in_progress', $4)
        RETURNING id, college_id, respondent_id, respondent_role, status, is_demo,
                  calculated_overall_rating, started_at, submitted_at;
        """,
        college_id,
        respondent_id,
        respondent["affiliation"],
        college["is_demo"],
    )
    return RatingSessionResponse(**dict(row))


async def get_rating_session_detail(
    conn: asyncpg.Connection,
    session_id: UUID,
) -> RatingSessionDetail:
    """Retrieve rating session details, all saved answers, and completeness."""
    session_row = await conn.fetchrow(
        """
        SELECT id, college_id, respondent_id, respondent_role, status, is_demo,
               calculated_overall_rating, started_at, submitted_at
        FROM rating_sessions
        WHERE id = $1;
        """,
        session_id,
    )
    if not session_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rating session {session_id} not found.",
        )

    active_params = await conn.fetch(
        "SELECT id FROM parameters WHERE is_active = TRUE ORDER BY display_order ASC;"
    )
    total_active = len(active_params)
    active_param_ids = [r["id"] for r in active_params]

    answer_rows = await conn.fetch(
        """
        SELECT id, session_id, parameter_id, score, is_no_view, updated_at
        FROM rating_answers
        WHERE session_id = $1;
        """,
        session_id,
    )
    answers = [RatingAnswerResponse(**dict(r)) for r in answer_rows]
    answered_ids = {a.parameter_id for a in answers}

    missing_ids = [pid for pid in active_param_ids if pid not in answered_ids]

    return RatingSessionDetail(
        id=session_row["id"],
        college_id=session_row["college_id"],
        respondent_id=session_row["respondent_id"],
        respondent_role=session_row["respondent_role"],
        status=session_row["status"],
        is_demo=session_row["is_demo"],
        calculated_overall_rating=session_row["calculated_overall_rating"],
        started_at=session_row["started_at"],
        submitted_at=session_row["submitted_at"],
        answers=answers,
        total_active_parameters=total_active,
        answered_count=len(answers),
        missing_parameter_ids=missing_ids,
        is_complete=(len(missing_ids) == 0 and total_active > 0),
    )


async def save_rating_answer(
    conn: asyncpg.Connection,
    session_id: UUID,
    parameter_id: UUID,
    req: SaveAnswerRequest,
) -> RatingAnswerResponse:
    """Save or correct an individual parameter answer within an in_progress session."""
    session_row = await conn.fetchrow(
        "SELECT id, status FROM rating_sessions WHERE id = $1;",
        session_id,
    )
    if not session_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rating session {session_id} not found.",
        )

    if session_row["status"] != "in_progress":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot edit answers for session with status '{session_row['status']}'.",
        )

    # Check parameter exists and is active
    param_row = await conn.fetchrow(
        "SELECT id FROM parameters WHERE id = $1 AND is_active = TRUE;",
        parameter_id,
    )
    if not param_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Active parameter {parameter_id} not found.",
        )

    # Upsert answer
    try:
        row = await conn.fetchrow(
            """
            INSERT INTO rating_answers (session_id, parameter_id, score, is_no_view, updated_at)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (session_id, parameter_id) DO UPDATE SET
                score = EXCLUDED.score,
                is_no_view = EXCLUDED.is_no_view,
                updated_at = NOW()
            RETURNING id, session_id, parameter_id, score, is_no_view, updated_at;
            """,
            session_id,
            parameter_id,
            req.score,
            req.is_no_view,
        )
    except asyncpg.CheckViolationError as exc:
        raise HTTPException(
            status_code=422,
            detail="Invalid answer: either numeric score (1-10) or explicit is_no_view=true is required.",
        ) from exc

    return RatingAnswerResponse(**dict(row))
