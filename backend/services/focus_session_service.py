from datetime import datetime, timezone
from supabase import Client
from schemas.focus_session import FocusSessionCreate, FocusSessionUpdate, SessionReflectionCreate


class FocusSessionService:
    def __init__(self, db: Client):
        self.db = db

    def start_session(self, user_id: str, data: FocusSessionCreate) -> dict:
        payload = data.model_dump(exclude_none=True)
        payload["user_id"] = user_id
        payload["started_at"] = datetime.now(timezone.utc).isoformat()
        payload["status"] = "active"
        result = self.db.table("focus_sessions").insert(payload).execute()
        return result.data[0]

    def get_session(self, user_id: str, session_id: str) -> dict:
        result = (
            self.db.table("focus_sessions")
            .select("*, session_reflections(*)")
            .eq("id", session_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        return result.data

    def update_session(self, user_id: str, session_id: str, data: FocusSessionUpdate) -> dict:
        payload = data.model_dump(exclude_none=True)
        result = (
            self.db.table("focus_sessions")
            .update(payload)
            .eq("id", session_id)
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0]

    def end_session(self, user_id: str, session_id: str, focus_score: int | None = None) -> dict:
        payload: dict = {
            "status": "completed",
            "ended_at": datetime.now(timezone.utc).isoformat(),
        }
        if focus_score is not None:
            payload["focus_score"] = focus_score
        result = (
            self.db.table("focus_sessions")
            .update(payload)
            .eq("id", session_id)
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0]

    def list_sessions(self, user_id: str, limit: int = 20, offset: int = 0) -> list[dict]:
        result = (
            self.db.table("focus_sessions")
            .select("*")
            .eq("user_id", user_id)
            .order("started_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return result.data

    def get_active_session(self, user_id: str) -> dict | None:
        result = (
            self.db.table("focus_sessions")
            .select("*")
            .eq("user_id", user_id)
            .eq("status", "active")
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    def add_reflection(
        self, user_id: str, session_id: str, data: SessionReflectionCreate
    ) -> dict:
        payload = data.model_dump(exclude_none=True)
        payload["user_id"] = user_id
        payload["session_id"] = session_id
        result = self.db.table("session_reflections").insert(payload).execute()
        return result.data[0]
