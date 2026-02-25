from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, UUID4


NudgeType = Literal[
    "assignment_reminder", "exam_prep", "goal_check",
    "daily_summary", "encouragement", "streak_alert",
    "grade_update", "custom"
]
NudgePriority = Literal["low", "normal", "high", "critical"]
DeliveryChannel = Literal["push", "shield", "in_app", "all"]
NudgeStatus = Literal["pending", "delivered", "read", "dismissed", "expired"]


class Nudge(BaseModel):
    id: UUID4
    user_id: UUID4
    nudge_type: NudgeType
    title: str
    body: str
    priority: NudgePriority = "normal"
    delivery_channel: DeliveryChannel = "push"
    scheduled_for: datetime
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    dismissed_at: Optional[datetime] = None
    status: NudgeStatus = "pending"
    created_at: datetime


class NudgeCreate(BaseModel):
    nudge_type: NudgeType
    title: str
    body: str
    priority: NudgePriority = "normal"
    delivery_channel: DeliveryChannel = "push"
    scheduled_for: datetime
