"""
Documents API routes — /api/v1/documents/*

Endpoints:
  POST   /upload      → upload document (PDF, DOCX, CSV, XLSX, TXT)
  GET    /            → list uploaded documents for current user
  GET    /{doc_id}    → get single document status & metadata
  DELETE /{doc_id}    → delete document & file
"""

import uuid
from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user_id
from app.db.session import get_db
from app.schemas.document import (
    DocumentDeleteResponse,
    DocumentResponse,
)
from app.services.document_service import DocumentService

router = APIRouter(prefix="/documents", tags=["documents"])


def get_document_service(db: Session = Depends(get_db)) -> DocumentService:
    return DocumentService(db)


@router.post(
    "/upload",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a business document",
)
async def upload_document(
    file: UploadFile = File(...),
    user_id_str: str = Depends(get_current_user_id),
    svc: DocumentService = Depends(get_document_service),
):
    user_id = uuid.UUID(user_id_str)
    return await svc.upload(user_id=user_id, file=file)


@router.get(
    "",
    response_model=list[DocumentResponse],
    summary="List all uploaded documents",
)
def list_documents(
    user_id_str: str = Depends(get_current_user_id),
    svc: DocumentService = Depends(get_document_service),
):
    user_id = uuid.UUID(user_id_str)
    return svc.list_documents(user_id)


@router.get(
    "/{doc_id}",
    response_model=DocumentResponse,
    summary="Get document details",
)
def get_document(
    doc_id: uuid.UUID,
    user_id_str: str = Depends(get_current_user_id),
    svc: DocumentService = Depends(get_document_service),
):
    user_id = uuid.UUID(user_id_str)
    return svc.get_document(doc_id=doc_id, user_id=user_id)


@router.get(
    "/{doc_id}/extract",
    summary="Extract text content, structural metadata, and chunk preview from document",
)
def extract_document_text(
    doc_id: uuid.UUID,
    user_id_str: str = Depends(get_current_user_id),
    svc: DocumentService = Depends(get_document_service),
):
    user_id = uuid.UUID(user_id_str)
    doc = svc.get_document(doc_id=doc_id, user_id=user_id)
    res = svc.extract_text(doc_id=doc_id, user_id=user_id)

    from app.services.chunking_service import chunk_text
    chunks = chunk_text(
        res.text,
        chunk_size=512,
        chunk_overlap=64,
        document_id=str(doc_id),
        filename=doc.filename,
    )

    return {
        "document_id": doc_id,
        "filename": doc.filename,
        "char_count": res.char_count,
        "word_count": res.word_count,
        "chunk_count": len(chunks),
        "extraction_metadata": res.metadata,
        "text_preview": res.text[:2000],
        "chunks_preview": [
            {
                "index": c.chunk_index,
                "word_count": c.word_count,
                "text": c.text[:300],
            }
            for c in chunks[:5]
        ],
    }


@router.delete(
    "/{doc_id}",
    response_model=DocumentDeleteResponse,
    summary="Delete a document",
)
def delete_document(
    doc_id: uuid.UUID,
    user_id_str: str = Depends(get_current_user_id),
    svc: DocumentService = Depends(get_document_service),
):
    user_id = uuid.UUID(user_id_str)
    svc.delete_document(doc_id=doc_id, user_id=user_id)
    return DocumentDeleteResponse(success=True, id=doc_id)
