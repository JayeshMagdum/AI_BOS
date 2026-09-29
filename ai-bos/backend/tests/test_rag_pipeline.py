"""
Unit and integration tests for document preview, download endpoints,
document-scoped vector search, and dynamic RAG chat reasoning.
"""

import uuid
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from app.schemas.conversation import SendMessageRequest
from app.schemas.document import ChunkSample, DocumentPreviewResponse
from app.api.v1.chat import ChatRequest
from app.services.embedding_service import EmbeddingService, EmbeddingMatch
from app.services.chat_service import ChatService


# ── Auth & Protection Tests ──────────────────────────────────────────

def test_document_download_requires_auth(client: TestClient):
    """Ensure document download endpoint rejects unauthorized requests."""
    fake_doc_id = str(uuid.uuid4())
    res = client.get(f"/api/v1/documents/{fake_doc_id}/download")
    assert res.status_code == 401


def test_document_preview_requires_auth(client: TestClient):
    """Ensure document preview endpoint rejects unauthorized requests."""
    fake_doc_id = str(uuid.uuid4())
    res = client.get(f"/api/v1/documents/{fake_doc_id}/preview")
    assert res.status_code == 401


def test_chat_suggestions_requires_auth(client: TestClient):
    """Ensure dynamic chat suggestions endpoint rejects unauthorized requests."""
    res = client.get("/api/v1/chat/suggestions")
    assert res.status_code == 401


def test_chat_ask_requires_auth(client: TestClient):
    """Ensure direct chat ask endpoint rejects unauthorized requests."""
    res = client.post(
        "/api/v1/chat/ask",
        json={"question": "What were the revenues in 2024?"},
    )
    assert res.status_code == 401


# ── Schema Validation Tests ──────────────────────────────────────────

def test_chat_request_schema_accepts_document_id():
    """Verify ChatRequest accepts an optional document_id filter."""
    doc_id = str(uuid.uuid4())
    req = ChatRequest(question="Summarize chapter 2", top_k=3, document_id=doc_id)
    assert req.question == "Summarize chapter 2"
    assert req.top_k == 3
    assert req.document_id == doc_id


def test_send_message_request_accepts_document_id():
    """Verify SendMessageRequest in conversation schema accepts an optional document_id."""
    doc_id = str(uuid.uuid4())
    req = SendMessageRequest(question="What are the warranty terms?", top_k=5, document_id=doc_id)
    assert req.question == "What are the warranty terms?"
    assert req.top_k == 5
    assert req.document_id == doc_id


def test_document_preview_response_schema():
    """Verify DocumentPreviewResponse and ChunkSample serialization."""
    doc_id = str(uuid.uuid4())
    chunks = [
        ChunkSample(chunk_index=0, word_count=45, text="Financial results for Q3 show 15% growth."),
        ChunkSample(chunk_index=1, word_count=38, text="EBITDA margin reached 22.4% across all regions."),
    ]
    preview = DocumentPreviewResponse(
        id=doc_id,
        filename="financial_report_q3.pdf",
        file_type="pdf",
        file_size=102400,
        status="completed",
        created_at="2026-09-29T10:00:00Z",
        vector_count=2,
        char_count=500,
        word_count=83,
        chunk_count=2,
        text_preview="Financial results for Q3 show 15% growth. EBITDA margin reached 22.4%...",
        chunks_preview=chunks,
    )
    assert preview.filename == "financial_report_q3.pdf"
    assert preview.vector_count == 2
    assert len(preview.chunks_preview) == 2
    assert preview.chunks_preview[0].chunk_index == 0


# ── Scoped Vector Search & Retrieval Tests ────────────────────────────

def test_embedding_service_scoped_search_filter():
    """Test that EmbeddingService.search adds document_id condition to Qdrant filter when provided."""
    mock_client = MagicMock()
    mock_model = MagicMock()
    mock_model.encode.return_value = [[0.1, 0.2, 0.3]]
    mock_client.search.return_value = []

    service = EmbeddingService.__new__(EmbeddingService)
    service._qdrant_client = mock_client
    service._model = mock_model
    service.collection_name = "test_collection"

    user_id = str(uuid.uuid4())
    doc_id = str(uuid.uuid4())

    service.search(
        query="What is the net profit?",
        user_id=user_id,
        top_k=5,
        score_threshold=0.3,
        document_id=doc_id,
    )

    mock_client.search.assert_called_once()
    call_kwargs = mock_client.search.call_args.kwargs
    assert call_kwargs["collection_name"] == "test_collection"
    assert call_kwargs["limit"] == 5

    qdrant_filter = call_kwargs["query_filter"]
    must_keys = [cond.key for cond in qdrant_filter.must]
    assert "user_id" in must_keys
    assert "document_id" in must_keys


def test_embedding_service_scoped_count():
    """Test that EmbeddingService.count_user_chunks scopes count by document_id when provided."""
    mock_client = MagicMock()
    count_result = MagicMock()
    count_result.count = 7
    mock_client.count.return_value = count_result

    service = EmbeddingService.__new__(EmbeddingService)
    service._qdrant_client = mock_client
    service.collection_name = "test_collection"

    user_id = str(uuid.uuid4())
    doc_id = str(uuid.uuid4())

    count = service.count_user_chunks(user_id=user_id, document_id=doc_id)
    assert count == 7

    mock_client.count.assert_called_once()
    call_kwargs = mock_client.count.call_args.kwargs
    must_keys = [cond.key for cond in call_kwargs["count_filter"].must]
    assert "user_id" in must_keys
    assert "document_id" in must_keys


def test_chat_service_scoped_fallback_response():
    """Test that ChatService returns an accurate document-scoped fallback message when no matches are found."""
    mock_embed = MagicMock()
    mock_embed.search.return_value = []
    mock_embed.count_user_chunks.return_value = 0

    chat_svc = ChatService(embedding_service=mock_embed)
    user_id = str(uuid.uuid4())
    doc_id = str(uuid.uuid4())

    res = chat_svc.chat(
        question="What is the maintenance schedule?",
        user_id=user_id,
        document_id=doc_id,
    )

    assert "in the selected document" in res.answer
    assert res.sources == []
    assert res.model == "none"
    mock_embed.search.assert_called_once_with(
        query="What is the maintenance schedule?",
        user_id=user_id,
        top_k=5,
        score_threshold=0.2,
        document_id=doc_id,
    )
