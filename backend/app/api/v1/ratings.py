from uuid import UUID
import asyncpg
from fastapi import APIRouter, Depends, status
from app.api.deps import get_db
from app.schemas.rating import (
    CreateRespondentRequest,
    CreateSessionRequest,
    RatingAnswerResponse,
    RatingSessionDetail,
    RatingSessionResponse,
    RespondentResponse,
    SaveAnswerRequest,
    SubmitSessionResult,
)
from app.services.ratings import (
    create_rating_session,
    get_rating_session_detail,
    save_rating_answer,
)
from app.services.respondents import create_or_update_respondent
from app.services.scoring import submit_rating_session

router = APIRouter(tags=["Ratings & Respondents"])


@router.post("/respondents", response_model=RespondentResponse, status_code=status.HTTP_201_CREATED)
async def create_respondent_endpoint(
    payload: CreateRespondentRequest,
    conn: asyncpg.Connection = Depends(get_db),
) -> RespondentResponse:
    """Create or update a prototype respondent profile with self-declared affiliation."""
    return await create_or_update_respondent(conn, payload)


@router.post("/rating-sessions", response_model=RatingSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_rating_session_endpoint(
    payload: CreateSessionRequest,
    conn: asyncpg.Connection = Depends(get_db),
) -> RatingSessionResponse:
    """Start or resume an in-progress rating session for a declared college."""
    return await create_rating_session(conn, payload.college_id, payload.respondent_id)


@router.get("/rating-sessions/{session_id}", response_model=RatingSessionDetail)
async def get_rating_session_endpoint(
    session_id: UUID,
    conn: asyncpg.Connection = Depends(get_db),
) -> RatingSessionDetail:
    """Retrieve session progress, answers so far, and completeness status."""
    return await get_rating_session_detail(conn, session_id)


@router.put(
    "/rating-sessions/{session_id}/answers/{parameter_id}",
    response_model=RatingAnswerResponse,
)
async def save_rating_answer_endpoint(
    session_id: UUID,
    parameter_id: UUID,
    payload: SaveAnswerRequest,
    conn: asyncpg.Connection = Depends(get_db),
) -> RatingAnswerResponse:
    """Save or correct an individual parameter answer within an in-progress session."""
    return await save_rating_answer(conn, session_id, parameter_id, payload)


@router.post("/rating-sessions/{session_id}/submit", response_model=SubmitSessionResult)
async def submit_rating_session_endpoint(
    session_id: UUID,
    conn: asyncpg.Connection = Depends(get_db),
) -> SubmitSessionResult:
    """
    Submit completed rating session in a single atomic transaction.
    Enforces all 25 answered, single submission per respondent/college, and updates score.
    """
    return await submit_rating_session(conn, session_id)
