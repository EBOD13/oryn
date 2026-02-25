from fastapi import APIRouter, Depends, Query
from schemas.canvas import CanvasCourse, CanvasAssignment, CanvasGradeSnapshot, CanvasAssignmentCreate
from services.canvas_service import CanvasService
from utils.auth import get_current_user
from config import supabase

router = APIRouter(prefix="/canvas", tags=["canvas"])


def get_canvas_service() -> CanvasService:
    return CanvasService(supabase)


@router.get("/courses", response_model=list[CanvasCourse])
def list_courses(
    active_only: bool = Query(True),
    current_user: dict = Depends(get_current_user),
    service: CanvasService = Depends(get_canvas_service),
):
    return service.list_courses(current_user["sub"], active_only)


@router.get("/courses/{course_id}", response_model=CanvasCourse)
def get_course(
    course_id: str,
    current_user: dict = Depends(get_current_user),
    service: CanvasService = Depends(get_canvas_service),
):
    return service.get_course(current_user["sub"], course_id)


@router.get("/assignments", response_model=list[CanvasAssignment])
def list_assignments(
    course_id: str | None = Query(None),
    upcoming_only: bool = Query(False),
    current_user: dict = Depends(get_current_user),
    service: CanvasService = Depends(get_canvas_service),
):
    return service.list_assignments(current_user["sub"], course_id, upcoming_only)


@router.get("/assignments/{assignment_id}", response_model=CanvasAssignment)
def get_assignment(
    assignment_id: str,
    current_user: dict = Depends(get_current_user),
    service: CanvasService = Depends(get_canvas_service),
):
    return service.get_assignment(current_user["sub"], assignment_id)


@router.post("/assignments", response_model=CanvasAssignment, status_code=201)
def create_manual_assignment(
    data: CanvasAssignmentCreate,
    current_user: dict = Depends(get_current_user),
    service: CanvasService = Depends(get_canvas_service),
):
    return service.create_manual_assignment(current_user["sub"], data)


@router.get("/assignments/{assignment_id}/grades", response_model=list[CanvasGradeSnapshot])
def get_grade_history(
    assignment_id: str,
    current_user: dict = Depends(get_current_user),
    service: CanvasService = Depends(get_canvas_service),
):
    return service.get_grade_history(current_user["sub"], assignment_id)
