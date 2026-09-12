"""
Declarative base for all SQLAlchemy models.

Every model in app/models/ must import Base from here — never create
a second declarative_base(), or Alembic's autogenerate will silently
miss tables.
"""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
