from datetime import date, datetime
from typing import Any, Literal, Optional
from pydantic import BaseModel, UUID4


AchievementCategory = Literal["focus", "goals", "streak", "oryn", "special"]
StepSource = Literal[
    "focus_session", "goal_completed", "streak_bonus",
    "achievement", "daily_bonus", "manual"
]


class OrynProgress(BaseModel):
    user_id: UUID4
    total_steps: int = 0
    current_level: int = 1
    steps_today: int = 0
    steps_this_week: int = 0
    last_step_date: Optional[date] = None
    avatar_config: Optional[dict[str, Any]] = None
    updated_at: datetime


class Achievement(BaseModel):
    id: UUID4
    slug: str
    title: str
    description: str
    icon: Optional[str] = None
    category: AchievementCategory
    threshold_value: Optional[int] = None
    steps_reward: int = 0


class UserAchievement(BaseModel):
    id: UUID4
    user_id: UUID4
    achievement_id: UUID4
    earned_at: datetime
    achievement: Optional[Achievement] = None
