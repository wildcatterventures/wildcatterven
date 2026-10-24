from typing import Optional
from uuid import UUID
import asyncpg
from fastapi import HTTPException, status
from app.schemas.rating import CreateRespondentRequest, RespondentResponse


async def get_respondent_by_id(
    conn: asyncpg.Connection,
    respondent_id: UUID,
) -> Optional[RespondentResponse]:
    """Retrieve respondent profile by ID."""
    sql = """
        SELECT id, client_uuid, display_name, declared_college_id, affiliation, is_verified, created_at
        FROM people
        WHERE id = $1;
    """
    row = await conn.fetchrow(sql, respondent_id)
    if not row:
        return None
    return RespondentResponse(**dict(row))


async def get_respondent_by_client_uuid(
    conn: asyncpg.Connection,
    client_uuid: UUID,
) -> Optional[RespondentResponse]:
    """Retrieve respondent profile by stable client UUID."""
    sql = """
        SELECT id, client_uuid, display_name, declared_college_id, affiliation, is_verified, created_at
        FROM people
        WHERE client_uuid = $1;
    """
    row = await conn.fetchrow(sql, client_uuid)
    if not row:
        return None
    return RespondentResponse(**dict(row))


async def create_or_update_respondent(
    conn: asyncpg.Connection,
    req: CreateRespondentRequest,
) -> RespondentResponse:
    """
    Create or update a prototype respondent profile using client_uuid.
    Affiliation is self-declared and unverified.
    Prevents changing declared_college_id if submitted ratings already exist.
    """
    # 1. Verify declared college exists
    college_exists = await conn.fetchval(
        "SELECT 1 FROM colleges WHERE id = $1;",
        req.declared_college_id,
    )
    if not college_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Declared college {req.declared_college_id} does not exist.",
        )

    # 2. Check if respondent already exists by client_uuid
    existing = await conn.fetchrow(
        """
        SELECT id, client_uuid, display_name, declared_college_id, affiliation, is_verified, created_at
        FROM people
        WHERE client_uuid = $1;
        """,
        req.client_uuid,
    )

    if existing:
        # Check if changing declared college
        if existing["declared_college_id"] != req.declared_college_id:
            # Check for existing submitted sessions
            has_submitted = await conn.fetchval(
                """
                SELECT 1 FROM rating_sessions 
                WHERE respondent_id = $1 AND status = 'submitted'
                LIMIT 1;
                """,
                existing["id"],
            )
            if has_submitted:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Cannot change declared college: this respondent profile has already submitted ratings.",
                )

        # Safe to update
        updated_row = await conn.fetchrow(
            """
            UPDATE people
            SET declared_college_id = $2,
                affiliation = $3,
                display_name = $4
            WHERE id = $1
            RETURNING id, client_uuid, display_name, declared_college_id, affiliation, is_verified, created_at;
            """,
            existing["id"],
            req.declared_college_id,
            req.affiliation,
            req.display_name,
        )
        return RespondentResponse(**dict(updated_row))

    # 3. Insert new respondent profile
    new_row = await conn.fetchrow(
        """
        INSERT INTO people (client_uuid, display_name, declared_college_id, affiliation, is_verified)
        VALUES ($1, $2, $3, $4, FALSE)
        RETURNING id, client_uuid, display_name, declared_college_id, affiliation, is_verified, created_at;
        """,
        req.client_uuid,
        req.display_name,
        req.declared_college_id,
        req.affiliation,
    )
    return RespondentResponse(**dict(new_row))
