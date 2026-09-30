"""
Centralized application configuration.

All environment-dependent values must be read here, never scattered
with os.getenv() calls throughout the codebase. This keeps configuration
auditable and makes it trivial to see every setting the app depends on.
"""
from functools import lru_cache
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App
    APP_NAME: str = "AI Business Operating System"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database
    DATABASE_URL: str

    # Vector DB
    QDRANT_HOST: str = "qdrant"
    QDRANT_PORT: int = 6333
    QDRANT_URL: str | None = None
    QDRANT_API_KEY: str | None = None
    QDRANT_COLLECTION_NAME: str = "aibos_documents"

    # AI
    GEMINI_API_KEY: str
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"

    # Storage
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 25

    # CORS
    ALLOWED_ORIGINS: str | list[str] = ["http://localhost:3000"]

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def fix_database_url(cls, v: str) -> str:
        if isinstance(v, str):
            # Normalise postgres:// -> postgresql:// for SQLAlchemy 2.0
            if v.startswith("postgres://"):
                v = v.replace("postgres://", "postgresql://", 1)
            # Ensure sslmode=require for Neon or cloud-hosted postgres
            if "neon.tech" in v and "sslmode" not in v:
                separator = "&" if "?" in v else "?"
                v = f"{v}{separator}sslmode=require"
        return v

    @field_validator("ALLOWED_ORIGINS", mode="after")
    @classmethod
    def parse_allowed_origins(cls, v: object) -> list[str]:
        origins: list[str] = []
        if isinstance(v, str):
            v_str = v.strip()
            if v_str.startswith("[") and v_str.endswith("]"):
                import json
                try:
                    parsed = json.loads(v_str)
                    if isinstance(parsed, list):
                        origins = [str(o).strip().strip("'\"").rstrip("/") for o in parsed if str(o).strip()]
                except Exception:
                    v_str = v_str[1:-1].strip()
            if not origins:
                origins = [origin.strip().strip("'\"").rstrip("/") for origin in v_str.split(",") if origin.strip()]
        elif isinstance(v, list):
            origins = [str(o).strip().strip("'\"").rstrip("/") for o in v if str(o).strip()]
        else:
            return v  # type: ignore
        return origins

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance — avoids re-parsing .env on every import."""
    return Settings()


settings = get_settings()
