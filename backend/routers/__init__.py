from .users import router as users_router
from .canvas import router as canvas_router
from .study_plans import router as study_plans_router
from .focus_sessions import router as focus_sessions_router
from .goals import router as goals_router
from .nudges import router as nudges_router
from .gamification import router as gamification_router

__all__ = [
    "users_router",
    "canvas_router",
    "study_plans_router",
    "focus_sessions_router",
    "goals_router",
    "nudges_router",
    "gamification_router",
]
