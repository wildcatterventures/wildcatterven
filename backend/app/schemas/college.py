from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_validator


class CreateCollegeRequest(BaseModel):
    """Payload to create a new unknown college."""
    name: str = Field(..., min_length=2, max_length=150, description="Official or full college name")
    city: str = Field(..., min_length=2, max_length=100, description="City where the campus is located")
    state: str = Field(..., min_length=2, max_length=100, description="State or province")
    short_code: Optional[str] = Field(None, min_length=2, max_length=30, description="Optional custom short code")
    email_domains: Optional[str] = Field(None, max_length=200, description="Optional comma-separated approved institutional domains")

    @field_validator("name", "city", "state")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Field cannot be empty or only whitespace")
        return cleaned


class CollegeSummary(BaseModel):
    """Public college summary item for search directory listing."""
    college_id: UUID
    name: str
    short_code: str
    city: str
    state: str
    is_demo: bool = False
    current_score: int = 100
    total_submitted_sessions: int = 0
    current_student_submissions: int = 0
    alumni_submissions: int = 0
    email_domains: Optional[str] = None
    created_at: Optional[datetime] = None
    category: Optional[str] = None
    student_experience_average: Optional[float] = None



class CollegeDetail(CollegeSummary):
    """Detailed college profile including threshold counters."""
    total_qualifying_low: int = 0
    total_qualifying_neutral: int = 0
    total_qualifying_high: int = 0
    last_event_at: Optional[datetime] = None


class ParameterDistribution(BaseModel):
    """Frequency count for a single score value (1-10) of a parameter."""
    rating_score: int
    frequency: int


class ParameterRating(BaseModel):
    """Parameter rating aggregate metrics and distribution."""
    parameter_id: UUID
    parameter_key: str
    parameter_name: str
    parameter_category: str
    display_order: int
    numeric_response_count: int = 0
    no_view_count: int = 0
    average_score: Optional[float] = None
    distributions: List[ParameterDistribution] = []


class CollegeRatingReport(BaseModel):
    """Complete rating report for a college across all parameters."""
    college_id: UUID
    name: str
    short_code: str
    is_demo: bool = False
    current_score: int = 100
    total_submitted_sessions: int = 0
    current_student_submissions: int = 0
    alumni_submissions: int = 0
    parameters: List[ParameterRating] = []
    category: Optional[str] = None
    student_experience_average: Optional[float] = None
