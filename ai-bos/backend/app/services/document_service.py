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

        # Perform text extraction on uploaded document
        extraction_status = "completed"
        error_msg = None
        extracted_text = ""
        try:
            from app.services.text_extraction_service import TextExtractionService
            extraction_result = TextExtractionService.extract_from_file(dest_path, ext)
            extracted_text = extraction_result.text or ""
            if not extracted_text.strip():
                extraction_status = "completed"
        except Exception as e:
            extraction_status = "failed"
            error_msg = f"Extraction error: {str(e)[:400]}"

        # Persist document metadata in DB
        document = self.repo.create(
            user_id=user_id,
            filename=clean_name,
            file_path=str(dest_path),
            file_size=total_size,
            file_type=ext,
            status="processing" if extracted_text.strip() else extraction_status,
        )
        if error_msg:
            self.repo.update_status(document, status=extraction_status, error_message=error_msg)

        # Chunk extracted text and embed into Qdrant vector store
        if extracted_text.strip() and extraction_status != "failed":
            try:
                from app.services.chunking_service import chunk_text
                from app.services.embedding_service import EmbeddingService
                from app.core.config import settings as app_settings

                # Chunk the text
                chunks = chunk_text(
                    text=extracted_text,
                    chunk_size=512,
                    chunk_overlap=64,
                    document_id=str(document.id),
                    filename=clean_name,
                )

                if chunks:
                    # Convert TextChunk objects to dicts for embedding service
                    chunk_dicts = [
                        {
                            "text": c.text,
                            "chunk_index": c.chunk_index,
                            "word_count": c.word_count,
                        }
                        for c in chunks
                    ]

                    # Embed and upsert into Qdrant
                    embedding_svc = EmbeddingService(
                        qdrant_host=app_settings.QDRANT_HOST,
                        qdrant_port=app_settings.QDRANT_PORT,
                        collection_name=app_settings.QDRANT_COLLECTION_NAME,
                        model_name=app_settings.EMBEDDING_MODEL_NAME,
                    )
                    vectors_count = embedding_svc.upsert_chunks(
                        chunks=chunk_dicts,
                        document_id=str(document.id),
                        user_id=str(user_id),
                        filename=clean_name,
                    )

                    import logging
                    logger = logging.getLogger(__name__)
                    logger.info(
                        "Indexed %d vectors for document %s (%s)",
                        vectors_count, document.id, clean_name,
                    )

                # Mark as completed after successful indexing
                self.repo.update_status(document, status="completed")

            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error("Embedding pipeline error for doc %s: %s", document.id, str(e), exc_info=True)
                self.repo.update_status(
                    document,
                    status="failed",
                    error_message=f"Embedding error: {str(e)[:400]}",
                )

        return document

    def extract_text(self, doc_id: uuid.UUID, user_id: uuid.UUID):
        doc = self.get_document(doc_id, user_id)
        from app.services.text_extraction_service import TextExtractionService
        return TextExtractionService.extract_from_file(Path(doc.file_path), doc.file_type)

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

        # Delete vectors from Qdrant
        try:
            from app.services.embedding_service import EmbeddingService
            from app.core.config import settings as app_settings

            embedding_svc = EmbeddingService(
                qdrant_host=app_settings.QDRANT_HOST,
                qdrant_port=app_settings.QDRANT_PORT,
                collection_name=app_settings.QDRANT_COLLECTION_NAME,
                model_name=app_settings.EMBEDDING_MODEL_NAME,
            )
            embedding_svc.delete_by_document(str(doc_id))
        except Exception:
            pass  # Don't fail the deletion if vector cleanup fails

        # Delete physical file
        try:
            file_path = Path(doc.file_path)
            if file_path.exists():
                file_path.unlink()
        except OSError:
            pass  # Don't fail the deletion if the file is already gone

        self.repo.delete(doc)
