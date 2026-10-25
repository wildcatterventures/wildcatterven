from typing import Optional
from uuid import UUID
import asyncpg
from fastapi import HTTPException, status
from app.schemas.rating import CreateRespondentRequest, RespondentResponse
from app.services.email_validation import validate_college_email_affinity


async def get_respondent_by_id(
    conn: asyncpg.Connection,
    respondent_id: UUID,
) -> Optional[RespondentResponse]:
    """Retrieve respondent profile by ID."""
    sql = """
        SELECT id, client_uuid, display_name, declared_college_id, affiliation, college_email, is_verified, created_at
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
        SELECT id, client_uuid, display_name, declared_college_id, affiliation, college_email, is_verified, created_at
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
    Validates official college email if provided and ensures domain affinity with declared college.
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

    # 2. Validate college email if provided (checks structure, provider, and cross-college affinity)
    validated_email: Optional[str] = None
    if req.college_email:
        validated_email = await validate_college_email_affinity(
            conn, req.college_email, req.declared_college_id
        )

    # 3. Check if respondent already exists by client_uuid
    existing = await conn.fetchrow(
        """
        SELECT id, client_uuid, display_name, declared_college_id, affiliation, college_email, is_verified, created_at
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

        # Preserve existing email if new request did not provide one
        final_email = validated_email if validated_email is not None else existing["college_email"]

        # Safe to update
        updated_row = await conn.fetchrow(
            """
            UPDATE people
            SET declared_college_id = $2,
                affiliation = $3,
                display_name = $4,
                college_email = $5
            WHERE id = $1
            RETURNING id, client_uuid, display_name, declared_college_id, affiliation, college_email, is_verified, created_at;
            """,
            existing["id"],
            req.declared_college_id,
            req.affiliation,
            req.display_name,
            final_email,
        )
        return RespondentResponse(**dict(updated_row))

    # 4. Insert new respondent profile
    new_row = await conn.fetchrow(
        """
        INSERT INTO people (client_uuid, display_name, declared_college_id, affiliation, college_email, is_verified)
        VALUES ($1, $2, $3, $4, $5, FALSE)
        RETURNING id, client_uuid, display_name, declared_college_id, affiliation, college_email, is_verified, created_at;
        """,
        req.client_uuid,
        req.display_name,
        req.declared_college_id,
        req.affiliation,
        validated_email,
    )
    return RespondentResponse(**dict(new_row))

