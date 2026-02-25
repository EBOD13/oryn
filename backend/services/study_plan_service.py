from datetime import date
from supabase import Client
from schemas.study_plan import StudyPlanCreate, StudyPlanUpdate


class StudyPlanService:
    def __init__(self, db: Client):
        self.db = db

    def list_plans(
        self,
        user_id: str,
        planned_date: date | None = None,
        status: str | None = None,
    ) -> list[dict]:
        query = (
            self.db.table("study_plans")
            .select("*, canvas_assignments(title, due_at, assignment_type)")
            .eq("user_id", user_id)
            .order("planned_date", desc=False)
        )
        if planned_date:
            query = query.eq("planned_date", planned_date.isoformat())
        if status:
            query = query.eq("status", status)
        return query.execute().data

    def get_plan(self, user_id: str, plan_id: str) -> dict:
        result = (
            self.db.table("study_plans")
            .select("*, canvas_assignments(title, due_at, assignment_type)")
            .eq("id", plan_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        return result.data

    def create_plan(self, user_id: str, data: StudyPlanCreate) -> dict:
        payload = data.model_dump(exclude_none=True)
        payload["user_id"] = user_id
        if "planned_date" in payload:
            payload["planned_date"] = str(payload["planned_date"])
        result = self.db.table("study_plans").insert(payload).execute()
        return result.data[0]

    def update_plan(self, user_id: str, plan_id: str, data: StudyPlanUpdate) -> dict:
        payload = data.model_dump(exclude_none=True)
        if "planned_date" in payload:
            payload["planned_date"] = str(payload["planned_date"])
        result = (
            self.db.table("study_plans")
            .update(payload)
            .eq("id", plan_id)
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0]

    def delete_plan(self, user_id: str, plan_id: str) -> None:
        self.db.table("study_plans").delete().eq("id", plan_id).eq("user_id", user_id).execute()

    def today_plans(self, user_id: str) -> list[dict]:
        return self.list_plans(user_id, planned_date=date.today())
