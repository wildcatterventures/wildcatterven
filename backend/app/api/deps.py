from typing import AsyncGenerator
import asyncpg
from fastapi import HTTPException, status
from app.db.session import get_db_pool


async def get_db() -> AsyncGenerator[asyncpg.Connection, None]:
    """Dependency injection to acquire a connection from the asyncpg pool."""
    pool = get_db_pool()
    if pool is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is currently unavailable.",
        )
    async with pool.acquire() as conn:
        yield conn
