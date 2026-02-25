from supabase import Client
from schemas.canvas import CanvasAssignmentCreate


class CanvasService:
    def __init__(self, db: Client):
        self.db = db

    # Courses
    def list_courses(self, user_id: str, active_only: bool = True) -> list[dict]:
        query = self.db.table("canvas_courses").select("*").eq("user_id", user_id)
        if active_only:
            query = query.eq("is_active", True)
        return query.execute().data

    def get_course(self, user_id: str, course_id: str) -> dict:
        result = (
            self.db.table("canvas_courses")
            .select("*")
            .eq("id", course_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        return result.data

    # Assignments
    def list_assignments(
        self,
        user_id: str,
        course_id: str | None = None,
        upcoming_only: bool = False,
    ) -> list[dict]:
        query = (
            self.db.table("canvas_assignments")
            .select("*, canvas_courses(name, course_code)")
            .eq("user_id", user_id)
            .order("due_at", desc=False)
        )
        if course_id:
            query = query.eq("course_id", course_id)
        if upcoming_only:
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc).isoformat()
            query = query.gte("due_at", now)
        return query.execute().data

    def get_assignment(self, user_id: str, assignment_id: str) -> dict:
        result = (
            self.db.table("canvas_assignments")
            .select("*, canvas_courses(name, course_code)")
            .eq("id", assignment_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        return result.data

    def create_manual_assignment(self, user_id: str, data: CanvasAssignmentCreate) -> dict:
        payload = data.model_dump(exclude_none=True)
        payload["user_id"] = user_id
        payload["is_manually_created"] = True
        result = self.db.table("canvas_assignments").insert(payload).execute()
        return result.data[0]

    # Grade snapshots
    def get_grade_history(self, user_id: str, assignment_id: str) -> list[dict]:
        result = (
            self.db.table("canvas_grade_snapshots")
            .select("*")
            .eq("user_id", user_id)
            .eq("assignment_id", assignment_id)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data
