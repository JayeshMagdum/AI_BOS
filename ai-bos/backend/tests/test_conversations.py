"""
Tests for conversation threads and message endpoints.
"""

from fastapi.testclient import TestClient


def test_conversations_require_auth(client: TestClient):
    response = client.get("/api/v1/conversations")
    assert response.status_code == 401


def test_create_conversation_requires_auth(client: TestClient):
    response = client.post("/api/v1/conversations", json={"title": "Test Chat"})
    assert response.status_code == 401


def test_send_message_requires_auth(client: TestClient):
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = client.post(
        f"/api/v1/conversations/{fake_id}/messages",
        json={"question": "What is our quarterly profit?"},
    )
    assert response.status_code == 401
