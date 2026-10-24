import asyncio
import logging
import ssl
from typing import AsyncGenerator, Optional
import asyncpg
from app.core.config import Settings, get_settings

logger = logging.getLogger("campus_uncut.db")

_pool: Optional[asyncpg.Pool] = None


async def init_db_pool(settings: Optional[Settings] = None) -> Optional[asyncpg.Pool]:
    """Initialize the asyncpg connection pool during application startup."""
    global _pool
    if settings is None:
        settings = get_settings()

    if not settings.DATABASE_URL:
        logger.warning("DATABASE_URL is not configured. Starting without active database pool.")
        return None

    try:
        # Determine SSL context if connecting to cloud provider (Supabase)
        ssl_ctx: Optional[ssl.SSLContext] = None
        dsn = settings.DATABASE_URL
        if "sslmode=require" in dsn or "supabase.co" in dsn or "pooler.supabase.com" in dsn:
            ssl_ctx = ssl.create_default_context()
            ssl_ctx.check_hostname = False
            ssl_ctx.verify_mode = ssl.CERT_NONE
            # Strip query parameter if present because asyncpg doesn't parse ?sslmode in connect string directly
            if "?" in dsn:
                clean_dsn, query_part = dsn.split("?", 1)
                # Keep other query parameters if necessary, but strip sslmode
                query_params = [q for q in query_part.split("&") if not q.startswith("sslmode=")]
                dsn = clean_dsn + (f"?{'&'.join(query_params)}" if query_params else "")

        _pool = await asyncpg.create_pool(
            dsn=dsn,
            min_size=settings.DB_POOL_MIN_SIZE,
            max_size=settings.DB_POOL_MAX_SIZE,
            command_timeout=settings.DB_COMMAND_TIMEOUT,
            ssl=ssl_ctx,
        )
        logger.info("Successfully established asyncpg connection pool.")
        return _pool
    except Exception as exc:
        logger.error("Failed to connect to database pool: %s", exc)
        _pool = None
        return None


async def close_db_pool() -> None:
    """Close the asyncpg connection pool gracefully on shutdown."""
    global _pool
    if _pool is not None:
        try:
            await _pool.close()
            logger.info("Database connection pool closed.")
        except Exception as exc:
            logger.error("Error closing database connection pool: %s", exc)
        finally:
            _pool = None


def get_db_pool() -> Optional[asyncpg.Pool]:
    """Get the active database pool instance."""
    return _pool


def set_db_pool(pool: Optional[asyncpg.Pool]) -> None:
    """Set the active database pool instance (useful for test fixtures)."""
    global _pool
    _pool = pool


async def check_db_health() -> bool:
    """Check database connectivity with a simple fast query."""
    pool = get_db_pool()
    if pool is None:
        return False
    try:
        async with pool.acquire() as conn:
            result = await asyncio.wait_for(conn.fetchval("SELECT 1"), timeout=3.0)
            return result == 1
    except Exception as exc:
        logger.warning("Database health check failed: %s", exc)
        return False


async def get_connection() -> AsyncGenerator[asyncpg.Connection, None]:
    """FastAPI dependency for acquiring a connection from the pool."""
    pool = get_db_pool()
    if pool is None:
        raise RuntimeError("Database connection pool is not available.")
    async with pool.acquire() as conn:
        yield conn
