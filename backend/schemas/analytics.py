from datetime import date
from typing import Optional
from pydantic import BaseModel, UUID4


class DailySummary(BaseModel):
    user_id: UUID4
    day: date
    session_count: int = 0
    total_focus_minutes: int = 0
    avg_focus_score: Optional[float] = None
    assignments_worked: int = 0
    goals_logged: int = 0
    shields_effective: int = 0
    shields_total: int = 0


class WeeklySummary(BaseModel):
    user_id: UUID4
    week_start: date
    session_count: int = 0
    total_focus_minutes: int = 0
    avg_focus_score: Optional[float] = None
    days_active: int = 0
    assignments_worked: int = 0


class GradeStudyCorrelation(BaseModel):
    assignment_id: UUID4
    assignment_title: str
    score: Optional[float] = None
    points_possible: Optional[float] = None
    study_minutes: int = 0


class ShieldEffectiveness(BaseModel):
    app_bundle_id: str
    app_name: str
    total_shields: int
    effective_shields: int
    effectiveness_rate: float
