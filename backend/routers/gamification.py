from fastapi import APIRouter, Depends
from schemas.gamification import OrynProgress, Achievement, UserAchievement
from services.gamification_service import GamificationService
from utils.auth import get_current_user
from config import supabase

router = APIRouter(prefix="/gamification", tags=["gamification"])


def get_service() -> GamificationService:
    return GamificationService(supabase)


@router.get("/progress", response_model=OrynProgress)
def get_progress(
    current_user: dict = Depends(get_current_user),
    service: GamificationService = Depends(get_service),
):
    return service.get_progress(current_user["sub"])


@router.get("/achievements", response_model=list[Achievement])
def list_achievements(
    service: GamificationService = Depends(get_service),
):
    return service.list_achievements()


@router.get("/achievements/earned", response_model=list[UserAchievement])
def get_earned_achievements(
    current_user: dict = Depends(get_current_user),
    service: GamificationService = Depends(get_service),
):
    return service.get_user_achievements(current_user["sub"])
