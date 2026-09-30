"""
System health and readiness check endpoint.
"""

import time
import socket
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db

router = APIRouter(prefix="/health", tags=["system"])


@router.get("", summary="Comprehensive system health and service dependencies check")
def health_check(db: Session = Depends(get_db)):
    start_time = time.perf_counter()
    services: dict[str, dict] = {}
    is_healthy = True

    # 1. Check PostgreSQL Database
    db_start = time.perf_counter()
    try:
        db.execute(text("SELECT 1"))
        db_latency = round((time.perf_counter() - db_start) * 1000, 2)
        services["database"] = {
            "status": "healthy",
            "latency_ms": db_latency,
            "engine": "postgresql",
        }
    except Exception as e:
        is_healthy = False
        services["database"] = {
            "status": "unhealthy",
            "error": str(e),
            "engine": "postgresql",
        }

    # 2. Check Qdrant Vector Store Reachability
    qdrant_start = time.perf_counter()
    try:
        if settings.QDRANT_URL:
            from urllib.parse import urlparse
            parsed = urlparse(settings.QDRANT_URL)
            q_host = parsed.hostname or settings.QDRANT_HOST
            q_port = parsed.port or (443 if parsed.scheme == "https" else 6333)
            target_label = settings.QDRANT_URL
        else:
            q_host = (settings.QDRANT_HOST or "qdrant").strip()
            q_port = int(str(settings.QDRANT_PORT).strip()) if settings.QDRANT_PORT else 6333
            target_label = f"{q_host}:{q_port}"

        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2.0)
        result = sock.connect_ex((str(q_host).strip(), int(q_port)))
        sock.close()
        qdrant_latency = round((time.perf_counter() - qdrant_start) * 1000, 2)

        if result == 0:
            services["vector_store"] = {
                "status": "healthy",
                "latency_ms": qdrant_latency,
                "target": target_label,
            }
        else:
            services["vector_store"] = {
                "status": "unreachable",
                "target": target_label,
            }
    except Exception as e:
        services["vector_store"] = {
            "status": "unreachable",
            "error": str(e),
        }

    overall_status = "healthy" if is_healthy else "degraded"
    total_time_ms = round((time.perf_counter() - start_time) * 1000, 2)

    response_data = {
        "status": overall_status,
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_latency_ms": total_time_ms,
        "services": services,
    }

    status_code = (
        status.HTTP_200_OK if is_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
    )
    return JSONResponse(content=response_data, status_code=status_code)
