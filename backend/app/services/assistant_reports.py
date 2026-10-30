import logging
from uuid import UUID, uuid4
import asyncpg
from fastapi import HTTPException, status
from app.schemas.assistant import (
    AssistantReportResponse,
    CreateAssistantReportRequest,
)

logger = logging.getLogger("campus_uncut.safety_reports")


async def record_assistant_report(
    conn: asyncpg.Connection,
    req: CreateAssistantReportRequest,
) -> AssistantReportResponse:
    """
    Log an in-app report regarding an objectionable AI assistant response.
    Enforces deduplication to prevent abuse and stores report securely
    in the database without forwarding data to external third parties.
    """
    clean_content = req.message_content.strip()
    clean_notes = req.user_notes.strip() if req.user_notes else None

    # Deduplication check: Same client and message within the last 30 seconds
    if req.client_uuid:
        existing_id = await conn.fetchval(
            """
            SELECT id FROM ai_response_reports
            WHERE client_uuid = $1 AND message_content = $2
              AND created_at > NOW() - INTERVAL '30 seconds'
            LIMIT 1;
            """,
            req.client_uuid,
            clean_content,
        )
        if existing_id:
            logger.info(
                "[SAFETY REPORT] Duplicate report suppressed for client %s (report %s)",
                req.client_uuid,
                existing_id,
            )
            return AssistantReportResponse(
                id=existing_id,
                status="already_received",
                message="A report for this response was already submitted recently. Thank you.",
            )

    try:
        report_id = await conn.fetchval(
            """
            INSERT INTO ai_response_reports (
                message_content,
                reason,
                user_notes,
                client_uuid
            )
            VALUES ($1, $2, $3, $4)
            RETURNING id;
            """,
            clean_content,
            req.reason.value,
            clean_notes,
            req.client_uuid,
        )
    except Exception as exc:
        logger.error("[SAFETY REPORT] Database error creating report: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to record safety report at this time. Please try again later.",
        )

    logger.info(
        "[SAFETY REPORT] Created report %s | reason: %s | client: %s",
        report_id,
        req.reason.value,
        req.client_uuid,
    )

    return AssistantReportResponse(
        id=report_id,
        status="received",
        message="Thank you for reporting this response. Our safety team will review it.",
    )
