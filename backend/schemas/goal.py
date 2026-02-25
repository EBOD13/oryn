from datetime import date, datetime
from typing import Any, Literal, Optional
from pydantic import BaseModel, UUID4


GoalCategory = Literal["academic", "fitness", "personal", "career", "financial"]
GoalType = Literal["habit", "milestone", "metric"]
GoalRecurrence = Literal["daily", "weekly", "monthly", "once"]
TriggerType = Literal["time_based", "location_based", "manual"]
LogSource = Literal["manual", "apple_health", "strava", "google_fit", "canvas", "auto"]


class Goal(BaseModel):
    id: UUID4
    user_id: UUID4
    title: str
    description: Optional[str] = None
    category: GoalCategory
    goal_type: GoalType
    recurrence: GoalRecurrence = "daily"
    target_value: Optional[float] = None
    target_unit: Optional[str] = None
    target_date: Optional[date] = None
    is_active: bool = True
    is_automated: bool = False
    service_connection_id: Optional[UUID4] = None
    automation_config: Optional[dict[str, Any]] = None
    trigger_type: TriggerType = "manual"
    trigger_config: Optional[dict[str, Any]] = None
    current_streak: int = 0
    best_streak: int = 0
    created_at: datetime
    updated_at: datetime


class GoalCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: GoalCategory
    goal_type: GoalType
    recurrence: GoalRecurrence = "daily"
    target_value: Optional[float] = None
    target_unit: Optional[str] = None
    target_date: Optional[date] = None
    is_automated: bool = False
    service_connection_id: Optional[UUID4] = None
    automation_config: Optional[dict[str, Any]] = None
    trigger_type: TriggerType = "manual"
    trigger_config: Optional[dict[str, Any]] = None


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_value: Optional[float] = None
    target_date: Optional[date] = None
    is_active: Optional[bool] = None
    recurrence: Optional[GoalRecurrence] = None


class GoalLog(BaseModel):
    id: UUID4
    goal_id: UUID4
    user_id: UUID4
    value: float
    notes: Optional[str] = None
    source: LogSource = "manual"
    logged_date: date
    created_at: datetime


class GoalLogCreate(BaseModel):
    goal_id: UUID4
    value: float
    notes: Optional[str] = None
    logged_date: Optional[date] = None
