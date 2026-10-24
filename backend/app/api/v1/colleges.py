from typing import List, Optional
from uuid import UUID
import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.api.deps import get_db
from app.schemas.college import (
    CollegeDetail,
    CollegeRatingReport,
    CollegeSummary,
    CreateCollegeRequest,
)
from app.services.colleges import (
    create_college,
    get_college_by_id,
    get_college_ratings,
    search_colleges,
)

router = APIRouter(prefix="/colleges", tags=["Colleges"])


@router.get("", response_model=List[CollegeSummary])
async def list_colleges_endpoint(
    q: Optional[str] = Query(None, description="Search term for name, city, state, or short code"),
    demo: bool = Query(False, description="Include simulated demo colleges"),
    conn: asyncpg.Connection = Depends(get_db),
) -> List[CollegeSummary]:
    """Search and list colleges with optional text search and demo data filtering."""
    return await search_colleges(conn, query=q, include_demo=demo)


@router.post("", response_model=CollegeDetail, status_code=status.HTTP_201_CREATED)
async def create_college_endpoint(
    payload: CreateCollegeRequest,
    conn: asyncpg.Connection = Depends(get_db),
) -> CollegeDetail:
    """Create an unknown college after user confirmation, initializing score to 100 with zero ratings."""
    return await create_college(conn, payload)


@router.get("/{college_id}", response_model=CollegeDetail)
async def get_college_endpoint(
    college_id: UUID,
    conn: asyncpg.Connection = Depends(get_db),
) -> CollegeDetail:
    """Get full college profile, score state, and submission counts."""
    college = await get_college_by_id(conn, college_id)
    if not college:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"College with ID {college_id} not found.",
        )
    return college


@router.get("/{college_id}/ratings", response_model=CollegeRatingReport)
async def get_college_ratings_endpoint(
    college_id: UUID,
    conn: asyncpg.Connection = Depends(get_db),
) -> CollegeRatingReport:
    """Get detailed rating report with parameter averages and distributions."""
    report = await get_college_ratings(conn, college_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"College with ID {college_id} not found.",
        )
    return report
