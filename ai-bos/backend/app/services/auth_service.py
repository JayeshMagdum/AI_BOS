"""
Auth service — signup, login, and current-user logic.

Business rules live here. No HTTP awareness (no Request/Response objects).
The service receives plain Python types and returns domain objects or raises
exceptions that the router translates into HTTP errors.
"""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.repositories.user_repo import UserRepository


class AuthService:
    def __init__(self, db: Session) -> None:
        self.repo = UserRepository(db)

    def signup(self, *, email: str, password: str, full_name: str) -> User:
        """Register a new user. Raises 409 if email already taken."""
        existing = self.repo.get_by_email(email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )
        hashed = hash_password(password)
        return self.repo.create(email=email, hashed_password=hashed, full_name=full_name)

    def login(self, *, email: str, password: str) -> str:
        """Authenticate and return a JWT. Raises 401 on bad credentials."""
        user = self.repo.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account has been deactivated.",
            )
        return create_access_token(subject=str(user.id))

    def get_current_user(self, user_id: str) -> User:
        """Look up user by ID (from decoded JWT sub claim)."""
        import uuid

        try:
            uid = uuid.UUID(user_id)
        except ValueError:
            raise HTTPException(status_code=401, detail="Invalid token.")
        user = self.repo.get_by_id(uid)
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="User not found or inactive.")
        return user
