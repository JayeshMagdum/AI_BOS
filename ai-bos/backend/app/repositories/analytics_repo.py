"""
Analytics repository — database aggregation layer for business metrics.
"""

import uuid
from datetime import datetime, date
from sqlalchemy import Date, cast, func, select
from sqlalchemy.orm import Session

from app.models.document import Document


class AnalyticsRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_document_summary(self, user_id: uuid.UUID) -> dict[str, int]:
        """
        Aggregate total count, storage bytes, and status counts for a user's documents.
        """
        stmt = (
            select(
                func.count(Document.id).label("total_docs"),
                func.coalesce(func.sum(Document.file_size), 0).label("total_bytes"),
            )
            .where(Document.user_id == user_id)
        )
        row = self.db.execute(stmt).one()
        total_docs = row.total_docs or 0
        total_bytes = row.total_bytes or 0

        # Status breakdown
        status_stmt = (
            select(Document.status, func.count(Document.id))
            .where(Document.user_id == user_id)
            .group_by(Document.status)
        )
        status_rows = self.db.execute(status_stmt).all()
        status_counts = {status: count for status, count in status_rows}

        return {
            "total_documents": total_docs,
            "total_storage_bytes": int(total_bytes),
            "processed_documents": status_counts.get("completed", 0),
            "processing_documents": status_counts.get("processing", 0),
            "failed_documents": status_counts.get("failed", 0),
            "pending_documents": status_counts.get("pending", 0),
        }

    def get_file_type_distribution(self, user_id: uuid.UUID) -> list[tuple[str, int]]:
        """
        Get document counts grouped by file_type (e.g. pdf, docx, txt, csv, xlsx).
        """
        stmt = (
            select(Document.file_type, func.count(Document.id).label("count"))
            .where(Document.user_id == user_id)
            .group_by(Document.file_type)
            .order_by(func.count(Document.id).desc())
        )
        return [(row.file_type.lower(), row.count) for row in self.db.execute(stmt).all()]

    def get_daily_upload_counts(
        self, user_id: uuid.UUID, since_datetime: datetime
    ) -> dict[date, int]:
        """
        Group document uploads by date starting from since_datetime.
        """
        date_col = cast(Document.created_at, Date)
        stmt = (
            select(date_col.label("day"), func.count(Document.id).label("count"))
            .where(
                Document.user_id == user_id,
                Document.created_at >= since_datetime,
            )
            .group_by(date_col)
            .order_by(date_col.asc())
        )
        rows = self.db.execute(stmt).all()
        return {row.day: row.count for row in rows}

    def get_recent_uploads(self, user_id: uuid.UUID, limit: int = 5) -> list[Document]:
        """
        Get the N most recently uploaded documents for a user.
        """
        stmt = (
            select(Document)
            .where(Document.user_id == user_id)
            .order_by(Document.created_at.desc())
            .limit(limit)
        )
        return list(self.db.execute(stmt).scalars().all())
