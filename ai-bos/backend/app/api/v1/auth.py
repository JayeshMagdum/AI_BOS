"""
Auth API routes — /api/v1/auth/*

Endpoints:
  POST /signup   → register a new user, return JWT
  POST /login    → authenticate, return JWT
  GET  /me       → return current user profile (protected)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.schemas.auth import (
    LoginRequest,
    SignupRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])

bearer_scheme = HTTPBearer(auto_error=False)


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)


def get_current_user_id(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str:
    """Extract and validate the user ID from the Bearer token."""
    if creds is None:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    payload = decode_access_token(creds.credentials)
    if payload is None or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    return payload["sub"]


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(body: SignupRequest, svc: AuthService = Depends(get_auth_service)):
    user = svc.signup(email=body.email, password=body.password, full_name=body.full_name)
    token = svc.login(email=body.email, password=body.password)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, svc: AuthService = Depends(get_auth_service)):
    token = svc.login(email=body.email, password=body.password)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def get_me(
    user_id: str = Depends(get_current_user_id),
    svc: AuthService = Depends(get_auth_service),
):
    return svc.get_current_user(user_id)
