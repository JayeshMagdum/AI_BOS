"""
Document service — business logic for uploading, validating, listing,
and deleting business documents.
"""

import os
import re
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import SessionLocal
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
        self.db = db
        self.repo = DocumentRepository(db)
        self.upload_dir = Path(settings.UPLOAD_DIR)

    async def upload(self, *, user_id: uuid.UUID, file: UploadFile, background_tasks: BackgroundTasks) -> Document:
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

        # Persist document metadata in DB initially
        document = self.repo.create(
            user_id=user_id,
            filename=clean_name,
            file_path=str(dest_path),
            file_size=total_size,
            file_type=ext,
            status="processing",
        )

        background_tasks.add_task(
            self._process_document_background,
            document_id=document.id,
            user_id=user_id,
            dest_path=dest_path,
            ext=ext,
            clean_name=clean_name
        )

        return document

    def _process_document_background(self, document_id: uuid.UUID, user_id: uuid.UUID, dest_path: Path, ext: str, clean_name: str):
        import concurrent.futures
        import traceback
        import logging
        logger = logging.getLogger(__name__)

        def _do_work():
            db = SessionLocal()
            try:
                repo = DocumentRepository(db)
                document = repo.get_by_id(document_id, user_id)
                if not document:
                    return

                # Perform text extraction
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

                if error_msg:
                    repo.update_status(document, status=extraction_status, error_message=error_msg)
                    return

                # Chunk extracted text and embed into Qdrant vector store
                if extracted_text.strip() and extraction_status != "failed":
                    try:
                        from app.services.chunking_service import chunk_text
                        from app.services.embedding_service import EmbeddingService

                        # Chunk the text
                        chunks = chunk_text(
                            text=extracted_text,
                            chunk_size=512,
                            chunk_overlap=64,
                            document_id=str(document.id),
                            filename=clean_name,
                        )

                        if chunks:
                            chunk_dicts = [
                                {
                                    "text": c.text,
                                    "chunk_index": c.chunk_index,
                                    "word_count": c.word_count,
                                }
                                for c in chunks
                            ]

                            embedding_svc = EmbeddingService()
                            vectors_count = embedding_svc.upsert_chunks(
                                chunks=chunk_dicts,
                                document_id=str(document.id),
                                user_id=str(user_id),
                                filename=clean_name,
                            )

                        # Run Analytics Extraction
                        from app.services.analytics_extractor import AnalyticsExtractorService
                        AnalyticsExtractorService.extract_and_store(
                            db,
                            document.id,
                            user_id,
                            dest_path,
                            ext,
                            extracted_text
                        )

                        repo.update_status(document, status="completed")

                    except Exception as e:
                        logger.error("Pipeline error for doc %s: %s\n%s", document.id, e, traceback.format_exc())
                        repo.update_status(
                            document,
                            status="failed",
                            error_message=f"Processing error: {str(e)}",
                        )
                db.commit()
            except Exception as e:
                db.rollback()
                logger.error("Unhandled error in background task: %s\n%s", e, traceback.format_exc())
                try:
                    repo = DocumentRepository(db)
                    doc = repo.get_by_id(document_id, user_id)
                    if doc:
                        repo.update_status(doc, status="failed", error_message=f"Unhandled error: {str(e)[:200]}")
                except:
                    pass
            finally:
                db.close()

        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(_do_work)
            try:
                future.result(timeout=90)
            except concurrent.futures.TimeoutError:
                logger.error("Background task timed out for document %s after 90 seconds", document_id)
                db = SessionLocal()
                try:
                    repo = DocumentRepository(db)
                    doc = repo.get_by_id(document_id, user_id)
                    if doc:
                        repo.update_status(doc, status="failed", error_message="Processing timed out after 90 seconds.")
                finally:
                    db.close()
            except Exception as e:
                logger.error("Background task crashed for document %s: %s\n%s", document_id, e, traceback.format_exc())
                db = SessionLocal()
                try:
                    repo = DocumentRepository(db)
                    doc = repo.get_by_id(document_id, user_id)
                    if doc:
                        repo.update_status(doc, status="failed", error_message=f"Task crashed: {str(e)[:200]}")
                finally:
                    db.close()

    def retry_document(self, doc_id: uuid.UUID, user_id: uuid.UUID, background_tasks: BackgroundTasks) -> Document:
        from fastapi import BackgroundTasks
        document = self.repo.get_by_id(doc_id, user_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found",
            )
        if document.status not in ("failed", "pending"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot retry document in status: {document.status}",
            )
            
        self.repo.update_status(document, status="processing", error_message=None)
        dest_path = Path(document.file_path)
        
        background_tasks.add_task(
            self._process_document_background,
            document_id=document.id,
            user_id=user_id,
            dest_path=dest_path,
            ext=document.file_type,
            clean_name=document.filename
        )
        return document

    def extract_text(self, doc_id: uuid.UUID, user_id: uuid.UUID):
        doc = self.get_document(doc_id, user_id)
        from app.services.text_extraction_service import TextExtractionService
        return TextExtractionService.extract_from_file(Path(doc.file_path), doc.file_type)

    def get_document_file(self, doc_id: uuid.UUID, user_id: uuid.UUID) -> tuple[Path, str, str]:
        """Retrieve physical file path, filename, and file type for downloading."""
        doc = self.get_document(doc_id, user_id)
        path = Path(doc.file_path)
        if not path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Physical file not found on storage disk.",
            )
        return path, doc.filename, doc.file_type

    def get_document_preview(self, doc_id: uuid.UUID, user_id: uuid.UUID) -> dict:
        """Retrieve rich preview metadata, extracted text sample, chunk breakdown, and vector count."""
        doc = self.get_document(doc_id, user_id)
        from app.services.text_extraction_service import TextExtractionService
        from app.services.chunking_service import chunk_text
        from app.services.embedding_service import EmbeddingService
        from app.core.config import settings as app_settings
        from qdrant_client.models import Filter, FieldCondition, MatchValue

        path = Path(doc.file_path)
        extracted_text = ""
        if path.exists():
            res = TextExtractionService.extract_from_file(path, doc.file_type)
            extracted_text = res.text or ""

        chunks = (
            chunk_text(
                extracted_text,
                chunk_size=512,
                chunk_overlap=64,
                document_id=str(doc_id),
                filename=doc.filename,
            )
            if extracted_text
            else []
        )

        vector_count = 0
        try:
            emb_svc = EmbeddingService()
            count_res = emb_svc.client.count(
                collection_name=emb_svc.collection_name,
                count_filter=Filter(
                    must=[FieldCondition(key="document_id", match=MatchValue(value=str(doc_id)))]
                ),
                exact=True,
            )
            vector_count = count_res.count
        except Exception:
            pass

        return {
            "id": doc.id,
            "filename": doc.filename,
            "file_type": doc.file_type,
            "file_size": doc.file_size,
            "status": doc.status,
            "created_at": doc.created_at,
            "vector_count": vector_count,
            "char_count": len(extracted_text),
            "word_count": len(extracted_text.split()),
            "chunk_count": len(chunks),
            "text_preview": extracted_text[:3000],
            "chunks_preview": [
                {
                    "chunk_index": c.chunk_index,
                    "word_count": c.word_count,
                    "text": c.text,
                }
                for c in chunks[:5]
            ],
        }

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

            embedding_svc = EmbeddingService()
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
