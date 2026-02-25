from datetime import date, datetime, time
from typing import Any, Literal, Optional
from pydantic import BaseModel, UUID4


PlanStatus = Literal["planned", "in_progress", "completed", "skipped"]
PlanPriority = Literal["low", "normal", "high", "urgent"]


class StudyPlan(BaseModel):
    id: UUID4
    user_id: UUID4
    assignment_id: Optional[UUID4] = None
    title: str
    estimated_minutes: Optional[int] = None
    priority: PlanPriority = "normal"
    status: PlanStatus = "planned"
    planned_date: Optional[date] = None
    planned_start_time: Optional[time] = None
    reminder_at: Optional[datetime] = None
    ai_generated_steps: Optional[list[dict[str, Any]]] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class StudyPlanCreate(BaseModel):
    assignment_id: Optional[UUID4] = None
    title: str
    estimated_minutes: Optional[int] = None
    priority: PlanPriority = "normal"
    planned_date: Optional[date] = None
    planned_start_time: Optional[time] = None
    reminder_at: Optional[datetime] = None


class StudyPlanUpdate(BaseModel):
    title: Optional[str] = None
    estimated_minutes: Optional[int] = None
    priority: Optional[PlanPriority] = None
    status: Optional[PlanStatus] = None
    planned_date: Optional[date] = None
    planned_start_time: Optional[time] = None
    reminder_at: Optional[datetime] = None
    ai_generated_steps: Optional[list[dict[str, Any]]] = None
