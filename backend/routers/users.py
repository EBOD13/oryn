from fastapi import APIRouter, Depends
from schemas.user import UserProfile, UserProfileUpdate, UserPreferences, UserPreferencesUpdate
from services.user_service import UserService
from utils.auth import get_current_user
from config import supabase

router = APIRouter(prefix="/users", tags=["users"])


def get_user_service() -> UserService:
    return UserService(supabase)


@router.get("/me", response_model=UserProfile)
def get_my_profile(
    current_user: dict = Depends(get_current_user),
    service: UserService = Depends(get_user_service),
):
    return service.get_profile(current_user["sub"])


@router.patch("/me", response_model=UserProfile)
def update_my_profile(
    data: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
    service: UserService = Depends(get_user_service),
):
    return service.update_profile(current_user["sub"], data)


@router.get("/me/preferences", response_model=UserPreferences)
def get_my_preferences(
    current_user: dict = Depends(get_current_user),
    service: UserService = Depends(get_user_service),
):
    return service.get_preferences(current_user["sub"])


@router.patch("/me/preferences", response_model=UserPreferences)
def update_my_preferences(
    data: UserPreferencesUpdate,
    current_user: dict = Depends(get_current_user),
    service: UserService = Depends(get_user_service),
):
    return service.update_preferences(current_user["sub"], data)


@router.post("/me/onboarding/complete", response_model=UserProfile)
def complete_onboarding(
    current_user: dict = Depends(get_current_user),
    service: UserService = Depends(get_user_service),
):
    return service.complete_onboarding(current_user["sub"])
