from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field, model_validator
from app.core.constants import (
    MIN_RATING_SCORE,
    MAX_RATING_SCORE,
    VALID_AFFILIATIONS,
)


class CreateRespondentRequest(BaseModel):
    """Payload to create or identify a prototype respondent profile."""
    client_uuid: UUID = Field(..., description="Stable client-generated UUID stored in localStorage")
    declared_college_id: UUID = Field(..., description="College UUID the respondent claims affiliation with")
    affiliation: str = Field(..., description="Must be 'current_student' or 'alumnus'")
    display_name: Optional[str] = Field(None, max_length=100, description="Optional public display name")

    @model_validator(mode="after")
    def validate_affiliation(self) -> "CreateRespondentRequest":
        if self.affiliation not in VALID_AFFILIATIONS:
            raise ValueError(f"affiliation must be one of {sorted(VALID_AFFILIATIONS)}")
        if self.display_name:
            self.display_name = self.display_name.strip() or None
        return self


class RespondentResponse(BaseModel):
    """Respondent profile response."""
    id: UUID
    client_uuid: UUID
    declared_college_id: UUID
    affiliation: str
    display_name: Optional[str] = None
    is_verified: bool = False
    created_at: datetime


class CreateSessionRequest(BaseModel):
    """Payload to start a rating session."""
    college_id: UUID = Field(..., description="Target college ID")
    respondent_id: UUID = Field(..., description="Respondent ID starting the session")


class SaveAnswerRequest(BaseModel):
    """Payload to save or correct an individual parameter rating answer."""
    score: Optional[int] = Field(
        None,
        description="Integer rating between 1 and 10; must be None if is_no_view=True",
    )
    is_no_view: bool = Field(
        False,
        description="Explicit flag indicating respondent has No view on this parameter",
    )

    @model_validator(mode="after")
    def validate_answer(self) -> "SaveAnswerRequest":
        if self.is_no_view:
            if self.score is not None:
                raise ValueError("When is_no_view is True, score must be NULL/None.")
        else:
            if self.score is None:
                raise ValueError("When is_no_view is False, a numeric score between 1 and 10 is required.")
            if self.score < MIN_RATING_SCORE or self.score > MAX_RATING_SCORE:
                raise ValueError(
                    f"Score must be an integer between {MIN_RATING_SCORE} and {MAX_RATING_SCORE}."
                )
        return self


class RatingAnswerResponse(BaseModel):
    """Stored parameter rating answer."""
    id: UUID
    session_id: UUID
    parameter_id: UUID
    score: Optional[int] = None
    is_no_view: bool
    updated_at: datetime


class RatingSessionResponse(BaseModel):
    """Rating session header information."""
    id: UUID
    college_id: UUID
    respondent_id: UUID
    respondent_role: str
    status: str
    is_demo: bool = False
    calculated_overall_rating: Optional[float] = None
    started_at: datetime
    submitted_at: Optional[datetime] = None


class RatingSessionDetail(RatingSessionResponse):
    """Detailed session progress with answers and completeness breakdown."""
    answers: List[RatingAnswerResponse] = []
    total_active_parameters: int = 25
    answered_count: int = 0
    missing_parameter_ids: List[UUID] = []
    is_complete: bool = False


class SubmitSessionResult(BaseModel):
    """Result of an atomic rating session submission."""
    session_id: UUID
    college_id: UUID
    status: str
    unrounded_overall_rating: Optional[float] = None
    category: Optional[str] = None
    score_contribution_inserted: bool = False
    threshold_block_triggered: Optional[int] = None
    score_delta: Optional[int] = None
    score_before: int = 100
    score_after: int = 100
    submitted_at: datetime
    message: str = "Rating session successfully submitted."
