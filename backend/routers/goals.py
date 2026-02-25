from fastapi import APIRouter, Depends, Query
from schemas.goal import Goal, GoalCreate, GoalUpdate, GoalLog, GoalLogCreate
from services.goal_service import GoalService
from utils.auth import get_current_user
from config import supabase

router = APIRouter(prefix="/goals", tags=["goals"])


def get_service() -> GoalService:
    return GoalService(supabase)


@router.get("", response_model=list[Goal])
def list_goals(
    active_only: bool = Query(True),
    current_user: dict = Depends(get_current_user),
    service: GoalService = Depends(get_service),
):
    return service.list_goals(current_user["sub"], active_only)


@router.get("/{goal_id}", response_model=Goal)
def get_goal(
    goal_id: str,
    current_user: dict = Depends(get_current_user),
    service: GoalService = Depends(get_service),
):
    return service.get_goal(current_user["sub"], goal_id)


@router.post("", response_model=Goal, status_code=201)
def create_goal(
    data: GoalCreate,
    current_user: dict = Depends(get_current_user),
    service: GoalService = Depends(get_service),
):
    return service.create_goal(current_user["sub"], data)


@router.patch("/{goal_id}", response_model=Goal)
def update_goal(
    goal_id: str,
    data: GoalUpdate,
    current_user: dict = Depends(get_current_user),
    service: GoalService = Depends(get_service),
):
    return service.update_goal(current_user["sub"], goal_id, data)


@router.delete("/{goal_id}", status_code=204)
def delete_goal(
    goal_id: str,
    current_user: dict = Depends(get_current_user),
    service: GoalService = Depends(get_service),
):
    service.delete_goal(current_user["sub"], goal_id)


@router.post("/log", response_model=GoalLog, status_code=201)
def log_progress(
    data: GoalLogCreate,
    current_user: dict = Depends(get_current_user),
    service: GoalService = Depends(get_service),
):
    return service.log_progress(current_user["sub"], data)


@router.get("/{goal_id}/logs", response_model=list[GoalLog])
def get_goal_logs(
    goal_id: str,
    limit: int = Query(30, le=100),
    current_user: dict = Depends(get_current_user),
    service: GoalService = Depends(get_service),
):
    return service.get_goal_logs(current_user["sub"], goal_id, limit)
