"""
Top-level v1 API router.

Individual feature routers (auth, documents, chat, analytics) will be
included here as they're built in later steps. Keeping this file thin
means main.py never needs to know about individual feature modules.
"""
from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.documents import router as documents_router
from app.api.v1.chat import router as chat_router
from app.api.v1.analytics import router as analytics_router

api_router = APIRouter(prefix="/api/v1")

# ── Feature routers ──────────────────────────────────────
api_router.include_router(auth_router)
api_router.include_router(documents_router)
api_router.include_router(chat_router)
api_router.include_router(analytics_router)


@api_router.get("/health", tags=["system"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}
