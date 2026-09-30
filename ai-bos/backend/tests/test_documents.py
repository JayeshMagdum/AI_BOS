"""
Unit and integration tests for document validation, filename sanitization,
document schemas, and documents API authorization protection.
"""

import uuid
from fastapi.testclient import TestClient

from app.services.document_service import ALLOWED_EXTENSIONS, sanitize_filename
from app.schemas.document import (
    ChunkSample,
    DocumentListResponse,
    DocumentPreviewResponse,
    DocumentResponse,
)


# ── Filename Sanitization & Validation Tests ─────────────────────────

def test_sanitize_filename_standard():
    """Verify standard clean filenames remain unchanged."""
    assert sanitize_filename("annual_report_2024.pdf") == "annual_report_2024.pdf"
    assert sanitize_filename("balance-sheet-q3.xlsx") == "balance-sheet-q3.xlsx"
    assert sanitize_filename("meeting_notes.txt") == "meeting_notes.txt"


def test_sanitize_filename_strips_path_traversal():
    """Verify path traversal patterns like ../.. are stripped away."""
    assert sanitize_filename("../../../etc/passwd") == "passwd"
    assert sanitize_filename("..\\..\\windows\\system32\\config.sys") == "config.sys"


def test_sanitize_filename_escapes_special_characters():
    """Verify spaces, brackets, and shell characters are replaced with underscores."""
    dangerous = "Q3 Results (Preliminary) & Final [v1.0]!?.pdf"
    cleaned = sanitize_filename(dangerous)

    assert " " not in cleaned
    assert "&" not in cleaned
    assert "?" not in cleaned
    assert "!" not in cleaned
    assert cleaned.endswith(".pdf")


def test_allowed_extensions_coverage():
    """Verify all required enterprise formats are in ALLOWED_EXTENSIONS."""
    expected_extensions = {"pdf", "docx", "doc", "txt", "csv", "xlsx", "xls"}
    for ext in expected_extensions:
        assert ext in ALLOWED_EXTENSIONS

    # Verify disallowed executable or script types are excluded
    disallowed = {"exe", "sh", "bat", "py", "js", "bin", "zip", "tar"}
    for ext in disallowed:
        assert ext not in ALLOWED_EXTENSIONS


# ── Document Schema Tests ────────────────────────────────────────────

def test_document_response_schema():
    """Test serialization of DocumentResponse."""
    doc_id = str(uuid.uuid4())
    data = {
        "id": doc_id,
        "filename": "market_analysis.pdf",
        "file_type": "pdf",
        "file_size": 204800,
        "status": "completed",
        "chunk_count": 8,
        "created_at": "2026-09-30T10:00:00Z",
    }
    res = DocumentResponse(**data)
    assert res.id == doc_id
    assert res.filename == "market_analysis.pdf"
    assert res.file_size == 204800
    assert res.status == "completed"
    assert res.chunk_count == 8


def test_document_list_response_schema():
    """Test serialization of DocumentListResponse collection."""
    doc_id = str(uuid.uuid4())
    doc = DocumentResponse(
        id=doc_id,
        filename="sales_q1.csv",
        file_type="csv",
        file_size=51200,
        status="completed",
        chunk_count=3,
        created_at="2026-09-30T10:00:00Z",
    )
    list_res = DocumentListResponse(documents=[doc], total=1)
    assert list_res.total == 1
    assert len(list_res.documents) == 1
    assert list_res.documents[0].file_type == "csv"


# ── Endpoint Protection Tests ────────────────────────────────────────

def test_get_documents_requires_auth(client: TestClient):
    """Ensure listing documents requires valid authentication."""
    response = client.get("/api/v1/documents")
    assert response.status_code == 401
    assert "detail" in response.json()


def test_upload_document_requires_auth(client: TestClient):
    """Ensure document upload rejects unauthenticated requests."""
    fake_file = ("test.txt", b"Mock business text data", "text/plain")
    response = client.post("/api/v1/documents/upload", files={"file": fake_file})
    assert response.status_code == 401


def test_delete_document_requires_auth(client: TestClient):
    """Ensure document deletion rejects unauthenticated requests."""
    fake_id = str(uuid.uuid4())
    response = client.delete(f"/api/v1/documents/{fake_id}")
    assert response.status_code == 401


def test_get_document_chunks_requires_auth(client: TestClient):
    """Ensure fetching document chunks rejects unauthenticated requests."""
    fake_id = str(uuid.uuid4())
    response = client.get(f"/api/v1/documents/{fake_id}/chunks")
    assert response.status_code == 401
