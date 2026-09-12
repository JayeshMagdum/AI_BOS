"""
Top-level v1 API router.

Individual feature routers (auth, documents, chat, analytics) will be
included here as they're built in later steps. Keeping this file thin
means main.py never needs to know about individual feature modules.
"""
from fastapi import APIRouter

api_router = APIRouter(prefix="/api/v1")


@api_router.get("/health", tags=["system"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}
