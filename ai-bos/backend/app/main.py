"""
FastAPI application entrypoint.
"""
import logging
import time
import uuid
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import setup_logging

setup_logging()
logger = logging.getLogger("aibos.api")

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests_middleware(request: Request, call_next):
    req_id = str(uuid.uuid4())[:8]
    start_time = time.perf_counter()
    client_ip = request.client.host if request.client else "unknown"

    logger.info(f"[{req_id}] --> {request.method} {request.url.path} from {client_ip}")

    try:
        response: Response = await call_next(request)
    except Exception as exc:
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        logger.error(f"[{req_id}] <-- ERROR {request.method} {request.url.path} ({duration_ms}ms): {exc}")
        raise exc

    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
    response.headers["X-Request-ID"] = req_id
    response.headers["X-Process-Time"] = f"{duration_ms}ms"

    logger.info(
        f"[{req_id}] <-- {response.status_code} {request.method} {request.url.path} ({duration_ms}ms)"
    )
    return response


app.include_router(api_router)


@app.get("/", tags=["system"])
def root() -> dict[str, str]:
    return {"message": f"{settings.APP_NAME} API is running", "version": "1.0.0"}
