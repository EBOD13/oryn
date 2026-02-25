from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, UUID4


class CanvasCourse(BaseModel):
    id: UUID4
    user_id: UUID4
    canvas_course_id: str
    name: str
    course_code: Optional[str] = None
    term: Optional[str] = None
    current_score: Optional[float] = None
    current_grade: Optional[str] = None
    is_active: bool = True
    last_synced_at: Optional[datetime] = None


AssignmentType = Literal["assignment", "quiz", "discussion", "exam", "other"]
SubmissionStatus = Literal["submitted", "missing", "late", "graded", "not_submitted"]


class CanvasAssignment(BaseModel):
    id: UUID4
    user_id: UUID4
    course_id: UUID4
    canvas_assignment_id: Optional[str] = None
    title: str
    assignment_type: AssignmentType = "assignment"
    due_at: Optional[datetime] = None
    points_possible: Optional[float] = None
    score: Optional[float] = None
    submission_status: Optional[SubmissionStatus] = None
    is_manually_created: bool = False


class CanvasAssignmentCreate(BaseModel):
    course_id: UUID4
    title: str
    assignment_type: AssignmentType = "assignment"
    due_at: Optional[datetime] = None
    points_possible: Optional[float] = None


SnapshotType = Literal["assignment_graded", "course_update", "manual"]


class CanvasGradeSnapshot(BaseModel):
    id: UUID4
    user_id: UUID4
    assignment_id: UUID4
    score: Optional[float] = None
    points_possible: Optional[float] = None
    course_score: Optional[float] = None
    course_grade: Optional[str] = None
    snapshot_type: SnapshotType
    created_at: datetime
