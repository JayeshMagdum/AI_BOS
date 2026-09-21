"""
Pytest fixtures and test environment configuration.
"""

import os
import pytest
from fastapi.testclient import TestClient

# Set test environment variables before importing app
os.environ["SECRET_KEY"] = "test-secret-key-32-bytes-long-for-testing"
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["GEMINI_API_KEY"] = "mock-gemini-key"
os.environ["ENVIRONMENT"] = "testing"
os.environ["DEBUG"] = "true"

from app.main import app
from app.core.security import create_access_token


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def test_user_token():
    user_id = "12345678-1234-5678-1234-567812345678"
    token = create_access_token(data={"sub": user_id, "email": "test@example.com"})
    return token, user_id


@pytest.fixture
def auth_headers(test_user_token):
    token, _ = test_user_token
    return {"Authorization": f"Bearer {token}"}
