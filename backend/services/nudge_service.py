from datetime import datetime, timezone
from supabase import Client
from schemas.nudge import NudgeCreate


class NudgeService:
    def __init__(self, db: Client):
        self.db = db

    def list_nudges(
        self,
        user_id: str,
        status: str | None = None,
        limit: int = 20,
    ) -> list[dict]:
        query = (
            self.db.table("nudge_queue")
            .select("*")
            .eq("user_id", user_id)
            .order("scheduled_for", desc=True)
            .limit(limit)
        )
        if status:
            query = query.eq("status", status)
        return query.execute().data

    def get_pending(self, user_id: str) -> list[dict]:
        return self.list_nudges(user_id, status="pending")

    def create_nudge(self, user_id: str, data: NudgeCreate) -> dict:
        payload = data.model_dump()
        payload["user_id"] = user_id
        payload["scheduled_for"] = payload["scheduled_for"].isoformat()
        result = self.db.table("nudge_queue").insert(payload).execute()
        return result.data[0]

    def mark_delivered(self, user_id: str, nudge_id: str) -> dict:
        result = (
            self.db.table("nudge_queue")
            .update({
                "status": "delivered",
                "delivered_at": datetime.now(timezone.utc).isoformat(),
            })
            .eq("id", nudge_id)
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0]

    def mark_read(self, user_id: str, nudge_id: str) -> dict:
        result = (
            self.db.table("nudge_queue")
            .update({
                "status": "read",
                "read_at": datetime.now(timezone.utc).isoformat(),
            })
            .eq("id", nudge_id)
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0]

    def dismiss(self, user_id: str, nudge_id: str) -> dict:
        result = (
            self.db.table("nudge_queue")
            .update({
                "status": "dismissed",
                "dismissed_at": datetime.now(timezone.utc).isoformat(),
            })
            .eq("id", nudge_id)
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0]
