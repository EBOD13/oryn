from supabase import Client


class GamificationService:
    STEPS_PER_FOCUS_MINUTE = 1
    STEPS_PER_GOAL = 10

    def __init__(self, db: Client):
        self.db = db

    def get_progress(self, user_id: str) -> dict:
        result = (
            self.db.table("oryn_progress")
            .select("*")
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        return result.data

    def award_steps(
        self,
        user_id: str,
        steps: int,
        source: str,
        reference_id: str | None = None,
    ) -> dict:
        log_payload: dict = {
            "user_id": user_id,
            "steps": steps,
            "source": source,
        }
        if reference_id:
            log_payload["reference_id"] = reference_id

        self.db.table("oryn_step_log").insert(log_payload).execute()

        progress = self.get_progress(user_id)
        new_total = progress["total_steps"] + steps
        new_today = progress.get("steps_today", 0) + steps
        new_week = progress.get("steps_this_week", 0) + steps
        new_level = self._calculate_level(new_total)

        result = (
            self.db.table("oryn_progress")
            .update({
                "total_steps": new_total,
                "steps_today": new_today,
                "steps_this_week": new_week,
                "current_level": new_level,
            })
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0]

    def award_focus_steps(self, user_id: str, session_id: str, minutes: int) -> dict:
        steps = minutes * self.STEPS_PER_FOCUS_MINUTE
        return self.award_steps(user_id, steps, "focus_session", session_id)

    def award_goal_steps(self, user_id: str, goal_id: str) -> dict:
        return self.award_steps(user_id, self.STEPS_PER_GOAL, "goal_completed", goal_id)

    def list_achievements(self) -> list[dict]:
        return self.db.table("achievements").select("*").order("category").execute().data

    def get_user_achievements(self, user_id: str) -> list[dict]:
        result = (
            self.db.table("user_achievements")
            .select("*, achievements(*)")
            .eq("user_id", user_id)
            .order("earned_at", desc=True)
            .execute()
        )
        return result.data

    def _calculate_level(self, total_steps: int) -> int:
        # Level thresholds: 100 steps per level, scaling up
        thresholds = [0, 100, 250, 500, 1000, 2000, 5000, 10000, 25000, 50000, 100000]
        for level, threshold in enumerate(thresholds, start=1):
            if total_steps < threshold:
                return level - 1
        return len(thresholds)
