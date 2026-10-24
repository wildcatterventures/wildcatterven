from fastapi import APIRouter
from app.api.v1.assistant import router as assistant_router
from app.api.v1.colleges import router as colleges_router
from app.api.v1.ratings import router as ratings_router

api_router = APIRouter()

api_router.include_router(colleges_router)
api_router.include_router(ratings_router)
api_router.include_router(assistant_router)
