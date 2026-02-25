from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, UUID4


SessionType = Literal["study", "exam_prep", "project", "reading", "review"]
SessionStatus = Literal["active", "completed", "abandoned", "paused"]
MoodType = Literal["stressed", "focused", "tired", "motivated", "neutral"]


class FocusSession(BaseModel):
    id: UUID4
    user_id: UUID4
    study_plan_id: Optional[UUID4] = None
    assignment_id: Optional[UUID4] = None
    session_type: SessionType = "study"
    target_duration_min: Optional[int] = None
    actual_duration_min: Optional[int] = None
    started_at: datetime
    ended_at: Optional[datetime] = None
    status: SessionStatus = "active"
    breaks_taken: int = 0
    total_break_min: int = 0
    focus_score: Optional[int] = None  # 1-100
    created_at: datetime
    updated_at: datetime


class FocusSessionCreate(BaseModel):
    study_plan_id: Optional[UUID4] = None
    assignment_id: Optional[UUID4] = None
    session_type: SessionType = "study"
    target_duration_min: Optional[int] = None


class FocusSessionUpdate(BaseModel):
    status: Optional[SessionStatus] = None
    ended_at: Optional[datetime] = None
    breaks_taken: Optional[int] = None
    total_break_min: Optional[int] = None
    focus_score: Optional[int] = None


class SessionReflection(BaseModel):
    id: UUID4
    session_id: UUID4
    user_id: UUID4
    what_i_learned: Optional[str] = None
    difficulty_rating: Optional[int] = None  # 1-5
    confidence_rating: Optional[int] = None  # 1-5
    mood_before: Optional[MoodType] = None
    mood_after: Optional[MoodType] = None
    ai_summary: Optional[str] = None
    created_at: datetime


class SessionReflectionCreate(BaseModel):
    what_i_learned: Optional[str] = None
    difficulty_rating: Optional[int] = None
    confidence_rating: Optional[int] = None
    mood_before: Optional[MoodType] = None
    mood_after: Optional[MoodType] = None
