"""
Document service — business logic for uploading, validating, listing,
and deleting business documents.
"""

import os
import re
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import Document
from app.repositories.document_repo import DocumentRepository

ALLOWED_EXTENSIONS = {"pdf", "docx", "doc", "txt", "csv", "xlsx", "xls"}


def sanitize_filename(filename: str) -> str:
    """Strip dangerous characters and keep filename safe."""
    basename = Path(filename).name
    # Keep alphanumeric, dot, dash, underscore
    return re.sub(r"[^\w.\-]", "_", basename)


class DocumentService:
    def __init__(self, db: Session) -> None:
        self.repo = DocumentRepository(db)
        self.upload_dir = Path(settings.UPLOAD_DIR)

    async def upload(self, *, user_id: uuid.UUID, file: UploadFile) -> Document:
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No filename provided.",
            )

        clean_name = sanitize_filename(file.filename)
        ext = clean_name.split(".")[-1].lower() if "." in clean_name else ""

        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '.{ext}'. Supported: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
            )

        # Storage directory per user: uploads/<user_id>/
        user_dir = self.upload_dir / str(user_id)
        user_dir.mkdir(parents=True, exist_ok=True)

        # Unique file path on disk: <doc_uuid>_<clean_filename>
        doc_uuid = uuid.uuid4()
        dest_filename = f"{doc_uuid}_{clean_name}"
        dest_path = user_dir / dest_filename

        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        total_size = 0

        # Stream file to disk and validate size
        with open(dest_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):  # 1MB chunk
                total_size += len(chunk)
                if total_size > max_bytes:
                    # Clean up partial file
                    buffer.close()
                    if dest_path.exists():
                        dest_path.unlink()
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB}MB.",
                    )
                buffer.write(chunk)

        # Persist document metadata in DB
        # Status is marked "completed" (ready) for this stage.
        # Future steps will trigger background text extraction/embedding pipelines.
        document = self.repo.create(
            user_id=user_id,
            filename=clean_name,
            file_path=str(dest_path),
            file_size=total_size,
            file_type=ext,
            status="completed",
        )

        return document

    def list_documents(self, user_id: uuid.UUID) -> list[Document]:
        return self.repo.list_by_user(user_id)

    def get_document(self, doc_id: uuid.UUID, user_id: uuid.UUID) -> Document:
        doc = self.repo.get_by_id(doc_id, user_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found.",
            )
        return doc

    def delete_document(self, doc_id: uuid.UUID, user_id: uuid.UUID) -> None:
        doc = self.repo.get_by_id(doc_id, user_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found.",
            )

        # Delete physical file
        try:
            file_path = Path(doc.file_path)
            if file_path.exists():
                file_path.unlink()
        except OSError:
            pass  # Don't fail the deletion if the file is already gone

        self.repo.delete(doc)
