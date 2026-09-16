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
    summary="Extract text content and structural metadata from document",
)
def extract_document_text(
    doc_id: uuid.UUID,
    user_id_str: str = Depends(get_current_user_id),
    svc: DocumentService = Depends(get_document_service),
):
    user_id = uuid.UUID(user_id_str)
    res = svc.extract_text(doc_id=doc_id, user_id=user_id)
    return {
        "document_id": doc_id,
        "char_count": res.char_count,
        "word_count": res.word_count,
        "metadata": res.metadata,
        "text_preview": res.text[:2000],
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
