import asyncpg
from fastapi import APIRouter, Depends
from app.api.deps import get_db
from app.schemas.assistant import (
    AssistantMessageRequest,
    AssistantMessageResponse,
)
from app.services.assistant import process_assistant_message

router = APIRouter(prefix="/assistant", tags=["Assistant"])


@router.post("/message", response_model=AssistantMessageResponse)
async def assistant_message_endpoint(
    payload: AssistantMessageRequest,
    conn: asyncpg.Connection = Depends(get_db),
) -> AssistantMessageResponse:
    """
    Process natural-language user query or rating flow via approved tool calling.
    Falls back deterministically to rule-based mock provider if AI provider is unavailable.
    """
    return await process_assistant_message(conn, payload)
