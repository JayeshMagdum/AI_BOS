"""
Document repository — database access layer for documents.
"""

import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document import Document


class DocumentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(
        self,
        *,
        user_id: uuid.UUID,
        filename: str,
        file_path: str,
        file_size: int,
        file_type: str,
        status: str = "pending",
    ) -> Document:
        doc = Document(
            user_id=user_id,
            filename=filename,
            file_path=file_path,
            file_size=file_size,
            file_type=file_type,
            status=status,
        )
        self.db.add(doc)
        self.db.commit()
        self.db.refresh(doc)
        return doc

    def get_by_id(self, doc_id: uuid.UUID, user_id: uuid.UUID) -> Document | None:
        stmt = select(Document).where(
            Document.id == doc_id,
            Document.user_id == user_id,
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def list_by_user(self, user_id: uuid.UUID) -> list[Document]:
        stmt = (
            select(Document)
            .where(Document.user_id == user_id)
            .order_by(Document.created_at.desc())
        )
        return list(self.db.execute(stmt).scalars().all())

    def update_status(
        self,
        doc: Document,
        *,
        status: str,
        error_message: str | None = None,
    ) -> Document:
        doc.status = status
        doc.error_message = error_message
        self.db.commit()
        self.db.refresh(doc)
        return doc

    def delete(self, doc: Document) -> None:
        self.db.delete(doc)
        self.db.commit()
