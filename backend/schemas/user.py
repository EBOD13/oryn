from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, EmailStr, UUID4


class UserProfile(BaseModel):
    id: UUID4
    display_name: Optional[str] = None
    email: EmailStr
    avatar_url: Optional[str] = None
    institution: Optional[str] = None
    major: Optional[str] = None
    college_year: Optional[int] = None  # 1-6
    timezone: str = "UTC"
    onboarding_completed: bool = False
    created_at: datetime
    updated_at: datetime
    archived_at: Optional[datetime] = None


class UserProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    institution: Optional[str] = None
    major: Optional[str] = None
    college_year: Optional[int] = None
    timezone: Optional[str] = None
    onboarding_completed: Optional[bool] = None


class UserPreferences(BaseModel):
    user_id: UUID4
    daily_study_goal_minutes: int = 120
    exam_prep_lead_days: int = 14
    focus_break_interval_min: int = 25
    focus_break_duration_min: int = 5
    notification_style: str = "gentle"
    shield_message_style: str = "motivational"
    ai_provider: Literal["gemini", "openai", "claude"] = "gemini"
    updated_at: datetime


class UserPreferencesUpdate(BaseModel):
    daily_study_goal_minutes: Optional[int] = None
    exam_prep_lead_days: Optional[int] = None
    focus_break_interval_min: Optional[int] = None
    focus_break_duration_min: Optional[int] = None
    notification_style: Optional[str] = None
    shield_message_style: Optional[str] = None
    ai_provider: Optional[Literal["gemini", "openai", "claude"]] = None
