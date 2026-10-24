import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.router import api_router
from app.core.config import get_settings
from app.db.session import check_db_health, close_db_pool, init_db_pool

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("campus_uncut")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage application startup and shutdown lifespan events."""
    settings = get_settings()
    logger.info("Starting Campus Uncut backend in %s mode...", settings.APP_ENV)
    await init_db_pool(settings)
    yield
    logger.info("Shutting down Campus Uncut backend...")
    await close_db_pool()


def create_app() -> FastAPI:
    """Application factory for Campus Uncut backend."""
    settings = get_settings()

    app = FastAPI(
        title="Campus Uncut API",
        description="College life. Without the editing. Student-powered college intelligence platform.",
        version="1.0.0",
        docs_url="/docs" if settings.APP_ENV != "production" else None,
        redoc_url="/redoc" if settings.APP_ENV != "production" else None,
        lifespan=lifespan,
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Health check endpoint
    @app.get("/health", tags=["System"])
    async def health_check() -> JSONResponse:
        """Health check endpoint distinguishing application and database connectivity status."""
        is_db_connected = await check_db_health()
        status_text = "ok" if is_db_connected else "degraded"
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": status_text,
                "db": "connected" if is_db_connected else "disconnected",
                "environment": settings.APP_ENV,
            },
        )

    # Mount API routers (both /api and /api/v1 for clean versioning)
    app.include_router(api_router, prefix="/api")
    app.include_router(api_router, prefix="/api/v1")

    return app


app = create_app()
