"""
Conversation repository — database access layer for conversation threads and messages.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.conversation import Conversation, ChatMessage


class ConversationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, user_id: uuid.UUID, title: str = "New Conversation") -> Conversation:
        conv = Conversation(user_id=user_id, title=title)
        self.db.add(conv)
        self.db.commit()
        self.db.refresh(conv)
        return conv

    def list_by_user(self, user_id: uuid.UUID, limit: int = 50) -> list[Conversation]:
        stmt = (
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .options(selectinload(Conversation.messages))
            .order_by(Conversation.updated_at.desc())
            .limit(limit)
        )
        return list(self.db.execute(stmt).scalars().all())

    def get_by_id(self, conv_id: uuid.UUID, user_id: uuid.UUID) -> Conversation | None:
        stmt = (
            select(Conversation)
            .where(Conversation.id == conv_id, Conversation.user_id == user_id)
            .options(selectinload(Conversation.messages))
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def update_title(self, conv: Conversation, title: str) -> Conversation:
        conv.title = title
        conv.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(conv)
        return conv

    def delete(self, conv: Conversation) -> None:
        self.db.delete(conv)
        self.db.commit()

    def add_message(
        self,
        conversation_id: uuid.UUID,
        role: str,
        content: str,
        sources: str | None = None,
        model: str | None = None,
        token_usage: str | None = None,
    ) -> ChatMessage:
        msg = ChatMessage(
            conversation_id=conversation_id,
            role=role,
            content=content,
            sources=sources,
            model=model,
            token_usage=token_usage,
        )
        self.db.add(msg)

        # Touch conversation updated_at
        stmt = select(Conversation).where(Conversation.id == conversation_id)
        conv = self.db.execute(stmt).scalar_one_or_none()
        if conv:
            conv.updated_at = datetime.now(timezone.utc)

        self.db.commit()
        self.db.refresh(msg)
        return msg
