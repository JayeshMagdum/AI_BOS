"""
Unit tests for authentication security utilities, token lifecycle,
and auth API endpoints.
"""

from datetime import timedelta
import pytest
from fastapi.testclient import TestClient

from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.schemas.auth import (
    LoginRequest,
    SignupRequest,
    TokenResponse,
    UserResponse,
)


# ── Password Hashing Tests ───────────────────────────────────────────

def test_password_hashing_and_verification():
    """Verify bcrypt hash generation and password matching."""
    plain = "SuperSecretPassword123!"
    hashed = hash_password(plain)

    assert hashed != plain
    assert hashed.startswith("$2b$") or hashed.startswith("$2a$")
    assert verify_password(plain, hashed) is True
    assert verify_password("WrongPassword999!", hashed) is False


def test_password_hash_uniqueness():
    """Ensure two hashes of the same password produce different salts."""
    pwd = "EnterprisePassword456!"
    hash1 = hash_password(pwd)
    hash2 = hash_password(pwd)

    assert hash1 != hash2
    assert verify_password(pwd, hash1) is True
    assert verify_password(pwd, hash2) is True


# ── JWT Token Lifecycle Tests ────────────────────────────────────────

def test_jwt_token_creation_and_decoding():
    """Test generating a JWT token and decoding subject payload."""
    subject = "user-uuid-1234-abcd"
    token = create_access_token(subject=subject)

    assert isinstance(token, str)
    assert len(token) > 20

    payload = decode_access_token(token)
    assert payload is not None
    assert payload.get("sub") == subject
    assert "exp" in payload


def test_jwt_token_with_custom_expiry():
    """Test token creation with an explicit expiration delta."""
    subject = "user-custom-expiry"
    delta = timedelta(hours=2)
    token = create_access_token(subject=subject, expires_delta=delta)

    payload = decode_access_token(token)
    assert payload is not None
    assert payload.get("sub") == subject


def test_jwt_decode_invalid_tokens():
    """Verify decode_access_token safely returns None for invalid or tampered tokens."""
    assert decode_access_token("completely-invalid-garbage-token") is None
    assert decode_access_token("") is None
    assert decode_access_token("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.badpayload.badsig") is None


# ── Auth Schemas Tests ───────────────────────────────────────────────

def test_signup_request_schema():
    """Verify SignupRequest schema validation."""
    data = {"email": "analyst@enterprise.com", "password": "secure-password", "full_name": "Jane Analyst"}
    req = SignupRequest(**data)
    assert req.email == "analyst@enterprise.com"
    assert req.password == "secure-password"
    assert req.full_name == "Jane Analyst"


def test_login_request_schema():
    """Verify LoginRequest schema validation."""
    data = {"email": "analyst@enterprise.com", "password": "secure-password"}
    req = LoginRequest(**data)
    assert req.email == "analyst@enterprise.com"
    assert req.password == "secure-password"


def test_token_response_schema():
    """Verify TokenResponse schema defaults."""
    res = TokenResponse(access_token="mock-jwt-token-string")
    assert res.access_token == "mock-jwt-token-string"
    assert res.token_type == "bearer"


# ── Endpoint Protection & Validation Tests ───────────────────────────

def test_get_me_unauthorized(client: TestClient):
    """Ensure /api/v1/auth/me rejects requests without a token."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert "detail" in response.json()


def test_get_me_with_invalid_bearer_token(client: TestClient):
    """Ensure /api/v1/auth/me rejects malformed or fabricated bearer tokens."""
    headers = {"Authorization": "Bearer fabricated-invalid-token"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 401
    assert "detail" in response.json()


def test_signup_validation_rejects_missing_fields(client: TestClient):
    """Ensure signup endpoint rejects empty or incomplete payloads with 422."""
    response = client.post("/api/v1/auth/signup", json={})
    assert response.status_code == 422


def test_signup_validation_rejects_invalid_email(client: TestClient):
    """Ensure signup endpoint rejects invalid email formats with 422."""
    response = client.post(
        "/api/v1/auth/signup",
        json={"email": "not-an-email-address", "password": "ValidPassword123!"},
    )
    assert response.status_code == 422


def test_login_validation_rejects_missing_fields(client: TestClient):
    """Ensure login endpoint rejects empty payload with 422."""
    response = client.post("/api/v1/auth/login", json={})
    assert response.status_code == 422
