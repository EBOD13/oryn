from fastapi import APIRouter, Depends, Query
from schemas.nudge import Nudge, NudgeCreate
from services.nudge_service import NudgeService
from utils.auth import get_current_user
from config import supabase

router = APIRouter(prefix="/nudges", tags=["nudges"])


def get_service() -> NudgeService:
    return NudgeService(supabase)


@router.get("", response_model=list[Nudge])
def list_nudges(
    status: str | None = Query(None),
    limit: int = Query(20, le=100),
    current_user: dict = Depends(get_current_user),
    service: NudgeService = Depends(get_service),
):
    return service.list_nudges(current_user["sub"], status, limit)


@router.get("/pending", response_model=list[Nudge])
def get_pending(
    current_user: dict = Depends(get_current_user),
    service: NudgeService = Depends(get_service),
):
    return service.get_pending(current_user["sub"])


@router.post("", response_model=Nudge, status_code=201)
def create_nudge(
    data: NudgeCreate,
    current_user: dict = Depends(get_current_user),
    service: NudgeService = Depends(get_service),
):
    return service.create_nudge(current_user["sub"], data)


@router.post("/{nudge_id}/deliver", response_model=Nudge)
def mark_delivered(
    nudge_id: str,
    current_user: dict = Depends(get_current_user),
    service: NudgeService = Depends(get_service),
):
    return service.mark_delivered(current_user["sub"], nudge_id)


@router.post("/{nudge_id}/read", response_model=Nudge)
def mark_read(
    nudge_id: str,
    current_user: dict = Depends(get_current_user),
    service: NudgeService = Depends(get_service),
):
    return service.mark_read(current_user["sub"], nudge_id)


@router.post("/{nudge_id}/dismiss", response_model=Nudge)
def dismiss(
    nudge_id: str,
    current_user: dict = Depends(get_current_user),
    service: NudgeService = Depends(get_service),
):
    return service.dismiss(current_user["sub"], nudge_id)
