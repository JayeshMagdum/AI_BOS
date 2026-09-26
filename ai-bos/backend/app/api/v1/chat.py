"""
Chat API routes — /api/v1/chat

Endpoints:
  POST /ask  → send a question, get an AI-generated answer with sources
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user_id
from app.db.session import get_db
from app.services.chat_service import ChatService


router = APIRouter(prefix="/chat", tags=["chat"])


# ── Request / Response schemas ────────────────────────────

class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=20)


class SourceResponse(BaseModel):
    filename: str
    document_id: str
    chunk_index: int
    relevance_score: float
    text_excerpt: str


class ChatAnswerResponse(BaseModel):
    answer: str
    sources: list[SourceResponse]
    model: str
    token_usage: dict


class SuggestionsResponse(BaseModel):
    suggestions: list[str]
    has_documents: bool


# ── Dependencies ──────────────────────────────────────────

def get_chat_service() -> ChatService:
    return ChatService()


# ── Endpoints ─────────────────────────────────────────────

@router.get(
    "/suggestions",
    response_model=SuggestionsResponse,
    summary="Get dynamic suggested queries tailored strictly to the user's uploaded documents",
)
def get_suggestions(
    user_id_str: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    svc: ChatService = Depends(get_chat_service),
):
    user_id = uuid.UUID(user_id_str)
    return svc.get_suggested_queries(user_id=str(user_id), db=db)


@router.post(
    "/ask",
    response_model=ChatAnswerResponse,
    summary="Ask a question about your business documents",
)
def ask_question(
    body: ChatRequest,
    user_id_str: str = Depends(get_current_user_id),
    svc: ChatService = Depends(get_chat_service),
):
    user_id = uuid.UUID(user_id_str)

    if not body.question.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question cannot be empty.",
        )

    result = svc.chat(
        question=body.question.strip(),
        user_id=str(user_id),
        top_k=body.top_k,
    )

    return ChatAnswerResponse(
        answer=result.answer,
        sources=[
            SourceResponse(
                filename=s.filename,
                document_id=s.document_id,
                chunk_index=s.chunk_index,
                relevance_score=s.relevance_score,
                text_excerpt=s.text_excerpt,
            )
            for s in result.sources
        ],
        model=result.model,
        token_usage=result.token_usage,
    )
