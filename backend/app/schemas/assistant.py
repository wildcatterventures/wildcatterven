from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """Conversational chat message."""
    role: str = Field(..., description="'user', 'assistant', 'system', or 'tool'")
    content: str = Field(..., description="Message text or stringified tool output")
    name: Optional[str] = Field(None, description="Tool name if role is 'tool'")


class AssistantMessageRequest(BaseModel):
    """User input message sent to the AI assistant orchestrator."""
    message: str = Field(..., min_length=1, max_length=2000, description="Natural language query or response")
    conversation_id: Optional[str] = Field(None, description="Optional client conversation tracking ID")
    client_uuid: Optional[UUID] = Field(None, description="Client UUID from localStorage for rating flows")
    session_id: Optional[UUID] = Field(None, description="Active rating session ID if currently rating")
    history: Optional[List[ChatMessage]] = Field(default=[], description="Recent conversation turns")


class ToolCallRecord(BaseModel):
    """Auditable record of an approved tool executed by the assistant."""
    tool_name: str
    arguments: Dict[str, Any]
    result: Dict[str, Any]


class AssistantMessageResponse(BaseModel):
    """Assistant natural language reply and structured data for UI cards."""
    reply: str
    tool_calls: List[ToolCallRecord] = []
    structured_payload: Optional[Dict[str, Any]] = None
    provider_used: str = "mock"


class ReportReason(str, Enum):
    """Allowed reason categories for reporting an AI response."""
    SEXUALLY_EXPLICIT = "sexually_explicit"
    HATE_OR_HARASSMENT = "hate_or_harassment"
    VIOLENCE_OR_HARM = "violence_or_harm"
    INAPPROPRIATE = "inappropriate"
    OTHER = "other"


class CreateAssistantReportRequest(BaseModel):
    """User-submitted report payload for an objectionable AI assistant response."""
    message_content: str = Field(..., min_length=1, max_length=5000, description="The message content being reported")
    reason: ReportReason = Field(..., description="Categorization of the concern")
    user_notes: Optional[str] = Field(None, max_length=500, description="Optional brief context provided by the user")
    client_uuid: Optional[UUID] = Field(None, description="Client UUID for deduplication")


class AssistantReportResponse(BaseModel):
    """Confirmation of a logged user report."""
    id: UUID
    status: str = "received"
    message: str = "Report submitted successfully."
