"""
Analytics API routes — /api/v1/analytics/*

Endpoints:
  GET /stats          → summary KPI metrics for dashboard
  GET /file-types     → distribution of document types
  GET /activity       → daily uploads & queries trend over N days
  GET /recent-uploads → latest uploaded documents formatted for dashboard
"""

import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user_id
from app.db.session import get_db
from app.schemas.analytics import (
    ActivityTrendResponse,
    FileTypeDistributionResponse,
    RecentUploadItem,
    StatsSummaryResponse,
)
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])


def get_analytics_service(db: Session = Depends(get_db)) -> AnalyticsService:
    return AnalyticsService(db)


@router.get(
    "/stats",
    response_model=StatsSummaryResponse,
    summary="Get overall usage metrics and KPI stats",
)
def get_dashboard_stats(
    user_id_str: str = Depends(get_current_user_id),
    svc: AnalyticsService = Depends(get_analytics_service),
):
    user_id = uuid.UUID(user_id_str)
    return svc.get_stats_summary(user_id)


@router.get(
    "/file-types",
    response_model=FileTypeDistributionResponse,
    summary="Get document distribution grouped by file type",
)
def get_file_type_distribution(
    user_id_str: str = Depends(get_current_user_id),
    svc: AnalyticsService = Depends(get_analytics_service),
):
    user_id = uuid.UUID(user_id_str)
    return svc.get_file_type_breakdown(user_id)


@router.get(
    "/activity",
    response_model=ActivityTrendResponse,
    summary="Get daily upload and query trends over specified time period",
)
def get_activity_trends(
    days: int = Query(default=14, ge=1, le=90),
    user_id_str: str = Depends(get_current_user_id),
    svc: AnalyticsService = Depends(get_analytics_service),
):
    user_id = uuid.UUID(user_id_str)
    return svc.get_activity_trend(user_id, days=days)


@router.get(
    "/recent-uploads",
    response_model=list[RecentUploadItem],
    summary="Get recent uploaded documents formatted for dashboard activity",
)
def get_recent_uploads(
    limit: int = Query(default=5, ge=1, le=50),
    user_id_str: str = Depends(get_current_user_id),
    svc: AnalyticsService = Depends(get_analytics_service),
):
    user_id = uuid.UUID(user_id_str)
    return svc.get_recent_uploads(user_id, limit=limit)
