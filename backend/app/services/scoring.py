from datetime import datetime
from typing import List, Optional, Tuple
from uuid import UUID
import asyncpg
from fastapi import HTTPException, status
from app.core.constants import (
    BASE_SCORE,
    CATEGORY_HIGH,
    CATEGORY_LOW,
    CATEGORY_NEUTRAL,
    HIGH_THRESHOLD,
    LOW_THRESHOLD,
    SCORE_BLOCK_SIZE,
    SCORE_DELTA_HIGH,
    SCORE_DELTA_LOW,
)
from app.schemas.rating import SubmitSessionResult


def calculate_arithmetic_mean(
    scores: List[Optional[int]],
    is_no_views: List[bool],
) -> Optional[float]:
    """
    Calculate arithmetic mean of numeric parameter answers.
    Excludes 'No view' answers from numerator and denominator.
    Returns None if all answers are 'No view' or no numeric answers exist.
    """
    numeric_scores = [
        s for s, no_view in zip(scores, is_no_views)
        if not no_view and s is not None
    ]
    if not numeric_scores:
        return None
    return sum(numeric_scores) / len(numeric_scores)


def classify_category(unrounded_mean: Optional[float]) -> Optional[str]:
    """
    Classify session into 'low', 'neutral', or 'high' using exact unrounded mean.
    - mean < 4.0 -> low
    - 4.0 <= mean < 8.0 -> neutral
    - mean >= 8.0 -> high
    """
    if unrounded_mean is None:
        return None
    if unrounded_mean < LOW_THRESHOLD:
        return CATEGORY_LOW
    if unrounded_mean < HIGH_THRESHOLD:
        return CATEGORY_NEUTRAL
    return CATEGORY_HIGH


def check_threshold_crossing(
    category: str,
    old_count: int,
    new_count: int,
) -> Tuple[bool, Optional[int], Optional[int]]:
    """
    Determine if new contribution completed a new block of 20.
    Returns (has_crossed, block_number, score_delta).
    Neutral contributions never cross thresholds.
    """
    if category not in (CATEGORY_LOW, CATEGORY_HIGH):
        return False, None, None

    old_block = old_count // SCORE_BLOCK_SIZE
    new_block = new_count // SCORE_BLOCK_SIZE

    if new_block > old_block and new_block > 0:
        delta = SCORE_DELTA_LOW if category == CATEGORY_LOW else SCORE_DELTA_HIGH
        return True, new_block, delta

    return False, None, None


async def submit_rating_session(
    conn: asyncpg.Connection,
    session_id: UUID,
) -> SubmitSessionResult:
    """
    Execute atomic submission in a single PostgreSQL transaction.
    1. Lock session row with SELECT ... FOR UPDATE.
    2. Validate session is in_progress.
    3. Validate respondent and declared college relationship.
    4. Check for duplicate submitted session for respondent and college.
    5. Load and validate all active parameter answers (must answer all 25).
    6. Compute unrounded arithmetic mean and category.
    7. Update session to 'submitted'.
    8. Insert qualifying score contribution (respecting unique constraint).
    9. Update score counters and trigger +/- 1 threshold event if block completed.
    """
    async with conn.transaction():
        # 1. Lock rating session
        session_row = await conn.fetchrow(
            """
            SELECT id, college_id, respondent_id, respondent_role, status, is_demo
            FROM rating_sessions
            WHERE id = $1
            FOR UPDATE;
            """,
            session_id,
        )
        if not session_row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Rating session {session_id} not found.",
            )

        # 2. Validate session status
        if session_row["status"] != "in_progress":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Rating session is already {session_row['status']}.",
            )

        college_id = session_row["college_id"]
        respondent_id = session_row["respondent_id"]

        # 3. Validate respondent profile & college relationship
        respondent = await conn.fetchrow(
            "SELECT id, declared_college_id, affiliation FROM people WHERE id = $1;",
            respondent_id,
        )
        if not respondent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Respondent profile {respondent_id} not found.",
            )

        if respondent["declared_college_id"] != college_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: Respondent's declared college does not match this rating session's college.",
            )

        # 4. Check for duplicate submitted session for this respondent and college
        dup_submitted = await conn.fetchval(
            """
            SELECT id FROM rating_sessions
            WHERE college_id = $1 AND respondent_id = $2 AND status = 'submitted' AND id != $3
            LIMIT 1;
            """,
            college_id,
            respondent_id,
            session_id,
        )
        if dup_submitted:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A rating session has already been submitted for this college from this profile.",
            )

        # 5. Load and validate all current active-parameter answers
        active_params = await conn.fetch(
            "SELECT id, key FROM parameters WHERE is_active = TRUE ORDER BY display_order ASC;"
        )
        if not active_params:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No active parameters found in database.",
            )

        active_param_ids = {r["id"] for r in active_params}
        answer_rows = await conn.fetch(
            """
            SELECT parameter_id, score, is_no_view
            FROM rating_answers
            WHERE session_id = $1;
            """,
            session_id,
        )

        answered_map = {r["parameter_id"]: r for r in answer_rows}
        missing_ids = [str(pid) for pid in active_param_ids if pid not in answered_map]

        if missing_ids:
            raise HTTPException(
                status_code=422,
                detail={
                    "message": f"Incomplete session: missing answers for {len(missing_ids)} parameters.",
                    "missing_parameter_ids": missing_ids,
                },
            )

        # Validate answers content
        scores: List[Optional[int]] = []
        no_views: List[bool] = []
        for r in answer_rows:
            is_nv = bool(r["is_no_view"])
            sc = r["score"]
            if is_nv and sc is not None:
                raise HTTPException(
                    status_code=422,
                    detail="Invalid answer: No view cannot have a numeric score.",
                )
            if not is_nv and (sc is None or sc < 1 or sc > 10):
                raise HTTPException(
                    status_code=422,
                    detail="Invalid answer: score must be an integer between 1 and 10.",
                )
            scores.append(sc)
            no_views.append(is_nv)

        # 6. Calculate unrounded arithmetic mean and category
        mean = calculate_arithmetic_mean(scores, no_views)
        category = classify_category(mean)

        # 7. Mark session submitted
        try:
            submitted_row = await conn.fetchrow(
                """
                UPDATE rating_sessions
                SET status = 'submitted',
                    calculated_overall_rating = $2,
                    submitted_at = NOW()
                WHERE id = $1
                RETURNING submitted_at;
                """,
                session_id,
                mean,
            )
        except asyncpg.UniqueViolationError as exc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Duplicate submission blocked by database constraint: a submitted rating already exists.",
            ) from exc

        submitted_at: datetime = submitted_row["submitted_at"]

        # Fetch current college score state
        state_row = await conn.fetchrow(
            """
            SELECT current_score, total_qualifying_low, total_qualifying_neutral, total_qualifying_high
            FROM college_score_state
            WHERE college_id = $1
            FOR UPDATE;
            """,
            college_id,
        )
        if not state_row:
            # Fallback initialization if trigger was bypassed
            await conn.execute(
                """
                INSERT INTO college_score_state (college_id, current_score, total_qualifying_low, total_qualifying_neutral, total_qualifying_high)
                VALUES ($1, 100, 0, 0, 0)
                ON CONFLICT (college_id) DO NOTHING;
                """,
                college_id,
            )
            state_row = await conn.fetchrow(
                "SELECT current_score, total_qualifying_low, total_qualifying_neutral, total_qualifying_high FROM college_score_state WHERE college_id = $1 FOR UPDATE;",
                college_id,
            )

        current_score = state_row["current_score"]
        score_before = current_score
        score_after = current_score
        score_contribution_inserted = False
        block_triggered: Optional[int] = None
        score_delta: Optional[int] = None

        # 8. All-No-View check
        if mean is None or category is None:
            # All-No-view session: submitted, but creates no score contribution and alters no score
            return SubmitSessionResult(
                session_id=session_id,
                college_id=college_id,
                status="submitted",
                unrounded_overall_rating=None,
                category=None,
                score_contribution_inserted=False,
                threshold_block_triggered=None,
                score_delta=None,
                score_before=score_before,
                score_after=score_after,
                submitted_at=submitted_at,
                message="Session submitted. Because all parameters were marked No view, no college score adjustment was applied.",
            )

        # 9. Insert score contribution
        contrib_id = await conn.fetchval(
            """
            INSERT INTO score_contributions (
                college_id, respondent_id, session_id, unrounded_rating, category
            )
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (college_id, respondent_id) DO NOTHING
            RETURNING id;
            """,
            college_id,
            respondent_id,
            session_id,
            mean,
            category,
        )

        if contrib_id is not None:
            score_contribution_inserted = True

            # Determine counter column to update
            if category == CATEGORY_LOW:
                old_count = state_row["total_qualifying_low"]
                counter_col = "total_qualifying_low"
            elif category == CATEGORY_NEUTRAL:
                old_count = state_row["total_qualifying_neutral"]
                counter_col = "total_qualifying_neutral"
            else:
                old_count = state_row["total_qualifying_high"]
                counter_col = "total_qualifying_high"

            new_count = old_count + 1

            # Update the qualifying counter
            await conn.execute(
                f"""
                UPDATE college_score_state
                SET {counter_col} = {counter_col} + 1,
                    updated_at = NOW()
                WHERE college_id = $1;
                """,
                college_id,
            )

            # Check threshold block crossing
            crossed, blk_num, delta = check_threshold_crossing(category, old_count, new_count)

            if crossed and blk_num is not None and delta is not None:
                new_score = current_score + delta
                event_id = await conn.fetchval(
                    """
                    INSERT INTO score_events (
                        college_id, category, block_number, score_delta,
                        score_before, score_after, triggered_by_session_id
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (college_id, category, block_number) DO NOTHING
                    RETURNING id;
                    """,
                    college_id,
                    category,
                    blk_num,
                    delta,
                    current_score,
                    new_score,
                    session_id,
                )

                if event_id is not None:
                    # Update official score in college_score_state
                    await conn.execute(
                        """
                        UPDATE college_score_state
                        SET current_score = $2,
                            last_event_at = NOW(),
                            updated_at = NOW()
                        WHERE college_id = $1;
                        """,
                        college_id,
                        new_score,
                    )
                    score_after = new_score
                    block_triggered = blk_num
                    score_delta = delta

        return SubmitSessionResult(
            session_id=session_id,
            college_id=college_id,
            status="submitted",
            unrounded_overall_rating=round(mean, 3) if mean is not None else None,
            category=category,
            score_contribution_inserted=score_contribution_inserted,
            threshold_block_triggered=block_triggered,
            score_delta=score_delta,
            score_before=score_before,
            score_after=score_after,
            submitted_at=submitted_at,
            message=(
                f"Rating submitted successfully. Category: {category}. "
                f"College score: {score_before} -> {score_after}."
            ),
        )
