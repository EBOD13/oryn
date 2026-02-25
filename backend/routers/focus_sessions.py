from fastapi import APIRouter, Depends, Query
from schemas.focus_session import (
    FocusSession, FocusSessionCreate, FocusSessionUpdate,
    SessionReflection, SessionReflectionCreate,
)
from services.focus_session_service import FocusSessionService
from utils.auth import get_current_user
from config import supabase

router = APIRouter(prefix="/focus-sessions", tags=["focus-sessions"])


def get_service() -> FocusSessionService:
    return FocusSessionService(supabase)


@router.get("", response_model=list[FocusSession])
def list_sessions(
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    current_user: dict = Depends(get_current_user),
    service: FocusSessionService = Depends(get_service),
):
    return service.list_sessions(current_user["sub"], limit, offset)


@router.get("/active", response_model=FocusSession | None)
def get_active_session(
    current_user: dict = Depends(get_current_user),
    service: FocusSessionService = Depends(get_service),
):
    return service.get_active_session(current_user["sub"])


@router.get("/{session_id}", response_model=FocusSession)
def get_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    service: FocusSessionService = Depends(get_service),
):
    return service.get_session(current_user["sub"], session_id)


@router.post("", response_model=FocusSession, status_code=201)
def start_session(
    data: FocusSessionCreate,
    current_user: dict = Depends(get_current_user),
    service: FocusSessionService = Depends(get_service),
):
    return service.start_session(current_user["sub"], data)


@router.patch("/{session_id}", response_model=FocusSession)
def update_session(
    session_id: str,
    data: FocusSessionUpdate,
    current_user: dict = Depends(get_current_user),
    service: FocusSessionService = Depends(get_service),
):
    return service.update_session(current_user["sub"], session_id, data)


@router.post("/{session_id}/end", response_model=FocusSession)
def end_session(
    session_id: str,
    focus_score: int | None = Query(None, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    service: FocusSessionService = Depends(get_service),
):
    return service.end_session(current_user["sub"], session_id, focus_score)


@router.post("/{session_id}/reflection", response_model=SessionReflection, status_code=201)
def add_reflection(
    session_id: str,
    data: SessionReflectionCreate,
    current_user: dict = Depends(get_current_user),
    service: FocusSessionService = Depends(get_service),
):
    return service.add_reflection(current_user["sub"], session_id, data)
