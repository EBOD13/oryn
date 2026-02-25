from datetime import date
from supabase import Client
from schemas.goal import GoalCreate, GoalUpdate, GoalLogCreate


class GoalService:
    def __init__(self, db: Client):
        self.db = db

    def list_goals(self, user_id: str, active_only: bool = True) -> list[dict]:
        query = (
            self.db.table("goals")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=False)
        )
        if active_only:
            query = query.eq("is_active", True)
        return query.execute().data

    def get_goal(self, user_id: str, goal_id: str) -> dict:
        result = (
            self.db.table("goals")
            .select("*")
            .eq("id", goal_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        return result.data

    def create_goal(self, user_id: str, data: GoalCreate) -> dict:
        payload = data.model_dump(exclude_none=True)
        payload["user_id"] = user_id
        if "target_date" in payload:
            payload["target_date"] = str(payload["target_date"])
        result = self.db.table("goals").insert(payload).execute()
        return result.data[0]

    def update_goal(self, user_id: str, goal_id: str, data: GoalUpdate) -> dict:
        payload = data.model_dump(exclude_none=True)
        if "target_date" in payload:
            payload["target_date"] = str(payload["target_date"])
        result = (
            self.db.table("goals")
            .update(payload)
            .eq("id", goal_id)
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0]

    def delete_goal(self, user_id: str, goal_id: str) -> None:
        self.db.table("goals").delete().eq("id", goal_id).eq("user_id", user_id).execute()

    def log_progress(self, user_id: str, data: GoalLogCreate) -> dict:
        payload = data.model_dump(exclude_none=True)
        payload["user_id"] = user_id
        if "logged_date" in payload:
            payload["logged_date"] = str(payload["logged_date"])
        else:
            payload["logged_date"] = date.today().isoformat()
        result = self.db.table("goal_logs").insert(payload).execute()
        return result.data[0]

    def get_goal_logs(self, user_id: str, goal_id: str, limit: int = 30) -> list[dict]:
        result = (
            self.db.table("goal_logs")
            .select("*")
            .eq("user_id", user_id)
            .eq("goal_id", goal_id)
            .order("logged_date", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data
