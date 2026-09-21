"""
Tests for analytics calculations and security protection.
"""

from fastapi.testclient import TestClient
from app.services.analytics_service import format_bytes


def test_format_bytes_calculation():
    assert format_bytes(500) == "500 B"
    assert format_bytes(1024) == "1.0 KB"
    assert format_bytes(1024 * 1024) == "1.0 MB"
    assert format_bytes(2500 * 1024 * 1024) == "2.44 GB"


def test_analytics_endpoints_require_auth(client: TestClient):
    res_stats = client.get("/api/v1/analytics/stats")
    assert res_stats.status_code == 401

    res_types = client.get("/api/v1/analytics/file-types")
    assert res_types.status_code == 401

    res_act = client.get("/api/v1/analytics/activity")
    assert res_act.status_code == 401
