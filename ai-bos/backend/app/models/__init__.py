# Re-export all models from a single location so Alembic and other
# modules only need to import from `app.models`.
from app.models.user import User  # noqa: F401

__all__ = ["User"]
