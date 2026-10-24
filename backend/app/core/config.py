from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Campus Uncut backend application settings."""

    # Environment
    APP_ENV: str = "development"
    DEBUG: bool = False

    # Server Host & Port
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # PostgreSQL / Supabase Connection URI (server-side only)
    DATABASE_URL: Optional[str] = None
    DB_POOL_MIN_SIZE: int = 1
    DB_POOL_MAX_SIZE: int = 10
    DB_COMMAND_TIMEOUT: float = 30.0

    # LLM Settings (Groq tool-calling or Mock fallback)
    LLM_PROVIDER: str = "mock"
    LLM_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    LLM_MODEL: str = "llama-3.3-70b-versatile"
    LLM_TIMEOUT: float = 20.0

    # CORS Origins (comma-separated string)
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        """Return list of allowed CORS origins, stripped of whitespace."""
        if not self.CORS_ORIGINS:
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def api_key(self) -> Optional[str]:
        """Resolve LLM API key from LLM_API_KEY or GROQ_API_KEY."""
        return self.LLM_API_KEY or self.GROQ_API_KEY


@lru_cache()
def get_settings() -> Settings:
    """Return cached application settings singleton."""
    return Settings()
