from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.settings import settings
from routers import (
    users_router,
    canvas_router,
    study_plans_router,
    focus_sessions_router,
    goals_router,
    nudges_router,
    gamification_router,
)

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

prefix = settings.api_v1_prefix
app.include_router(users_router, prefix=prefix)
app.include_router(canvas_router, prefix=prefix)
app.include_router(study_plans_router, prefix=prefix)
app.include_router(focus_sessions_router, prefix=prefix)
app.include_router(goals_router, prefix=prefix)
app.include_router(nudges_router, prefix=prefix)
app.include_router(gamification_router, prefix=prefix)


@app.get("/health")
def health_check():
    return {"status": "ok", "app": settings.app_name}
