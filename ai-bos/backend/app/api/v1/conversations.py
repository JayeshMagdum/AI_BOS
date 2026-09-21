"""
Conversations API routes — /api/v1/conversations/*

Endpoints:
  GET    /             → list user's conversation threads
  POST   /             → create new conversation thread
  GET    /{conv_id}    → get conversation with full message history
  DELETE /{conv_id}    → delete conversation thread
  POST   /{conv_id}/messages → send question, get assistant response and persist both
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user_id
from app.db.session import get_db
from app.schemas.conversation import (
    ChatMessageResponse,
    ConversationDetailResponse,
    ConversationListItem,
    CreateConversationRequest,
    SendMessageRequest,
)
from app.services.conversation_service import ConversationService

router = APIRouter(prefix="/conversations", tags=["conversations"])


def get_conversation_service(db: Session = Depends(get_db)) -> ConversationService:
    return ConversationService(db)


@router.get("", response_model=list[ConversationListItem], summary="List user conversation threads")
def list_conversations(
    user_id_str: str = Depends(get_current_user_id),
    svc: ConversationService = Depends(get_conversation_service),
):
    user_id = uuid.UUID(user_id_str)
    return svc.list_conversations(user_id)


@router.post(
    "",
    response_model=ConversationDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new conversation thread",
)
def create_conversation(
    body: CreateConversationRequest | None = None,
    user_id_str: str = Depends(get_current_user_id),
    svc: ConversationService = Depends(get_conversation_service),
):
    user_id = uuid.UUID(user_id_str)
    title = body.title if body else None
    return svc.create_conversation(user_id, title)


@router.get(
    "/{conv_id}",
    response_model=ConversationDetailResponse,
    summary="Get conversation with message history",
)
def get_conversation(
    conv_id: uuid.UUID,
    user_id_str: str = Depends(get_current_user_id),
    svc: ConversationService = Depends(get_conversation_service),
):
    user_id = uuid.UUID(user_id_str)
    conv = svc.get_conversation(conv_id, user_id)
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found"
        )
    return conv


@router.delete("/{conv_id}", summary="Delete conversation thread")
def delete_conversation(
    conv_id: uuid.UUID,
    user_id_str: str = Depends(get_current_user_id),
    svc: ConversationService = Depends(get_conversation_service),
):
    user_id = uuid.UUID(user_id_str)
    deleted = svc.delete_conversation(conv_id, user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found"
        )
    return {"success": True, "id": str(conv_id)}


@router.post(
    "/{conv_id}/messages",
    response_model=ChatMessageResponse,
    summary="Post question in conversation and receive assistant answer",
)
def send_message(
    conv_id: uuid.UUID,
    body: SendMessageRequest,
    user_id_str: str = Depends(get_current_user_id),
    svc: ConversationService = Depends(get_conversation_service),
):
    user_id = uuid.UUID(user_id_str)
    msg = svc.send_message(
        conv_id=conv_id,
        user_id=user_id,
        question=body.question,
        top_k=body.top_k,
    )
    if not msg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found"
        )
    return msg
