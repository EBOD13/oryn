from datetime import date
from fastapi import APIRouter, Depends, Query
from schemas.study_plan import StudyPlan, StudyPlanCreate, StudyPlanUpdate
from services.study_plan_service import StudyPlanService
from utils.auth import get_current_user
from config import supabase

router = APIRouter(prefix="/study-plans", tags=["study-plans"])


def get_service() -> StudyPlanService:
    return StudyPlanService(supabase)


@router.get("", response_model=list[StudyPlan])
def list_plans(
    planned_date: date | None = Query(None),
    status: str | None = Query(None),
    current_user: dict = Depends(get_current_user),
    service: StudyPlanService = Depends(get_service),
):
    return service.list_plans(current_user["sub"], planned_date, status)


@router.get("/today", response_model=list[StudyPlan])
def today_plans(
    current_user: dict = Depends(get_current_user),
    service: StudyPlanService = Depends(get_service),
):
    return service.today_plans(current_user["sub"])


@router.get("/{plan_id}", response_model=StudyPlan)
def get_plan(
    plan_id: str,
    current_user: dict = Depends(get_current_user),
    service: StudyPlanService = Depends(get_service),
):
    return service.get_plan(current_user["sub"], plan_id)


@router.post("", response_model=StudyPlan, status_code=201)
def create_plan(
    data: StudyPlanCreate,
    current_user: dict = Depends(get_current_user),
    service: StudyPlanService = Depends(get_service),
):
    return service.create_plan(current_user["sub"], data)


@router.patch("/{plan_id}", response_model=StudyPlan)
def update_plan(
    plan_id: str,
    data: StudyPlanUpdate,
    current_user: dict = Depends(get_current_user),
    service: StudyPlanService = Depends(get_service),
):
    return service.update_plan(current_user["sub"], plan_id, data)


@router.delete("/{plan_id}", status_code=204)
def delete_plan(
    plan_id: str,
    current_user: dict = Depends(get_current_user),
    service: StudyPlanService = Depends(get_service),
):
    service.delete_plan(current_user["sub"], plan_id)
