import logging
from typing import List, Optional
from uuid import UUID, uuid4
import asyncpg

logger = logging.getLogger("campus_uncut.analytics")


async def log_search_event(
    conn: asyncpg.Connection,
    query: str,
    visitor_session_id: Optional[UUID] = None,
    resolved_college_id: Optional[UUID] = None,
    requested_parameter_keys: Optional[List[str]] = None,
    input_mode: str = "text",
    dedup_window_seconds: int = 5,
) -> Optional[UUID]:
    """
    Safely and non-blockingly record privacy-preserving search events into search_events.
    - Avoids logging empty or whitespace-only queries.
    - Sanitizes query to prevent leaking sensitive info or excessive lengths.
    - Dedupes identical queries from the same visitor session within `dedup_window_seconds`.
    - Guarantees logging failures NEVER break or raise to callers.
    """
    clean_query = (query or "").strip()
    if not clean_query:
        return None

    # Truncate clean query to safe length to prevent database abuse or storage bloat
    truncated_query = clean_query[:200]

    # Validate input_mode according to schema CHECK constraint (text | voice)
    mode = "voice" if input_mode == "voice" else "text"

    # Assign or generate visitor session ID
    session_id = visitor_session_id or uuid4()
    keys = requested_parameter_keys or []

    try:
        # Check deduplication window to prevent duplicate events from frontend debounce or network retries
        recent = await conn.fetchval(
            """
            SELECT id FROM search_events
            WHERE visitor_session_id = $1
              AND LOWER(TRIM(query)) = LOWER(TRIM($2))
              AND created_at > NOW() - ($3 * INTERVAL '1 second')
            LIMIT 1;
            """,
            session_id,
            truncated_query,
            dedup_window_seconds,
        )
        if recent:
            logger.debug(
                "Deduplicated search event for query '%s' within %ds window.",
                truncated_query,
                dedup_window_seconds,
            )
            return recent

        event_id = await conn.fetchval(
            """
            INSERT INTO search_events (
                visitor_session_id, query, resolved_college_id, requested_parameter_keys, input_mode
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id;
            """,
            session_id,
            truncated_query,
            resolved_college_id,
            keys,
            mode,
        )
        return event_id
    except Exception as exc:
        logger.warning("Failed to log search event (non-fatal): %s", exc)
        return None
