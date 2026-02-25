from supabase import Client
from schemas.user import UserProfileUpdate, UserPreferencesUpdate


class UserService:
    def __init__(self, db: Client):
        self.db = db

    def get_profile(self, user_id: str) -> dict:
        result = self.db.table("users").select("*").eq("id", user_id).single().execute()
        return result.data

    def update_profile(self, user_id: str, data: UserProfileUpdate) -> dict:
        payload = data.model_dump(exclude_none=True)
        result = (
            self.db.table("users")
            .update(payload)
            .eq("id", user_id)
            .execute()
        )
        return result.data[0]

    def get_preferences(self, user_id: str) -> dict:
        result = (
            self.db.table("user_preferences")
            .select("*")
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        return result.data

    def update_preferences(self, user_id: str, data: UserPreferencesUpdate) -> dict:
        payload = data.model_dump(exclude_none=True)
        result = (
            self.db.table("user_preferences")
            .update(payload)
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0]

    def complete_onboarding(self, user_id: str) -> dict:
        result = (
            self.db.table("users")
            .update({"onboarding_completed": True})
            .eq("id", user_id)
            .execute()
        )
        return result.data[0]
