import asyncpg
from fastapi import APIRouter, Depends, status
from app.api.deps import get_db
from app.schemas.assistant import (
    AssistantMessageRequest,
    AssistantMessageResponse,
    AssistantReportResponse,
    CreateAssistantReportRequest,
)
from app.services.assistant import process_assistant_message
from app.services.assistant_reports import record_assistant_report

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


@router.post(
    "/report",
    response_model=AssistantReportResponse,
    status_code=status.HTTP_201_CREATED,
)
async def assistant_report_endpoint(
    payload: CreateAssistantReportRequest,
    conn: asyncpg.Connection = Depends(get_db),
) -> AssistantReportResponse:
    """
    Submit an in-app report flagging an objectionable or non-compliant AI assistant response.
    Fulfills Google Play Generative AI Policy compliance requirements.
    """
    return await record_assistant_report(conn, payload)
