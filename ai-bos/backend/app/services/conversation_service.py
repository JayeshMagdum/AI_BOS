"""
Conversation service — business logic for persistent chat threads and multi-turn messaging.
"""

import json
import uuid
from sqlalchemy.orm import Session

from app.repositories.conversation_repo import ConversationRepository
from app.schemas.conversation import (
    ChatMessageResponse,
    ConversationDetailResponse,
    ConversationListItem,
)
from app.services.chat_service import ChatService


class ConversationService:
    def __init__(self, db: Session) -> None:
        self.repo = ConversationRepository(db)
        self.chat_service = ChatService()

    def list_conversations(self, user_id: uuid.UUID, limit: int = 50) -> list[ConversationListItem]:
        convs = self.repo.list_by_user(user_id, limit=limit)
        items: list[ConversationListItem] = []

        for conv in convs:
            last_msg = None
            sources_count = 0

            if conv.messages:
                last_chat = conv.messages[-1]
                last_msg = last_chat.content[:100] + ("..." if len(last_chat.content) > 100 else "")

                # Count sources from assistant messages in thread
                for m in reversed(conv.messages):
                    if m.role == "assistant" and m.sources:
                        try:
                            src_list = json.loads(m.sources)
                            if isinstance(src_list, list):
                                sources_count = len(src_list)
                                break
                        except Exception:
                            pass

            items.append(
                ConversationListItem(
                    id=conv.id,
                    title=conv.title,
                    last_message=last_msg,
                    sources_count=sources_count,
                    created_at=conv.created_at,
                    updated_at=conv.updated_at,
                )
            )

        return items

    def get_conversation(self, conv_id: uuid.UUID, user_id: uuid.UUID) -> ConversationDetailResponse | None:
        conv = self.repo.get_by_id(conv_id, user_id)
        if not conv:
            return None

        messages = [
            ChatMessageResponse(
                id=m.id,
                conversation_id=m.conversation_id,
                role=m.role,
                content=m.content,
                sources=json.loads(m.sources) if m.sources else [],
                model=m.model,
                token_usage=json.loads(m.token_usage) if m.token_usage else {},
                created_at=m.created_at,
            )
            for m in conv.messages
        ]

        return ConversationDetailResponse(
            id=conv.id,
            title=conv.title,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            messages=messages,
        )

    def create_conversation(
        self, user_id: uuid.UUID, title: str | None = None
    ) -> ConversationDetailResponse:
        default_title = (title.strip() if title and title.strip() else "New Conversation")
        conv = self.repo.create(user_id=user_id, title=default_title)
        return ConversationDetailResponse(
            id=conv.id,
            title=conv.title,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            messages=[],
        )

    def delete_conversation(self, conv_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        conv = self.repo.get_by_id(conv_id, user_id)
        if not conv:
            return False
        self.repo.delete(conv)
        return True

    def send_message(
        self,
        conv_id: uuid.UUID,
        user_id: uuid.UUID,
        question: str,
        top_k: int = 5,
    ) -> ChatMessageResponse | None:
        conv = self.repo.get_by_id(conv_id, user_id)
        if not conv:
            return None

        # 1. Save user question
        self.repo.add_message(
            conversation_id=conv_id,
            role="user",
            content=question.strip(),
        )

        # 2. Build conversation history for context
        history = []
        for m in conv.messages:
            history.append({"role": m.role, "content": m.content})

        # 3. Query RAG engine with multi-turn context
        chat_res = self.chat_service.chat(
            question=question.strip(),
            user_id=str(user_id),
            top_k=top_k,
            conversation_history=history,
        )

        # 4. Format sources & token usage as JSON
        sources_json = json.dumps([
            {
                "filename": s.filename,
                "document_id": s.document_id,
                "chunk_index": s.chunk_index,
                "relevance_score": s.relevance_score,
                "text_excerpt": s.text_excerpt,
            }
            for s in chat_res.sources
        ])
        token_usage_json = json.dumps(chat_res.token_usage)

        # 5. Save assistant response
        ai_msg = self.repo.add_message(
            conversation_id=conv_id,
            role="assistant",
            content=chat_res.answer,
            sources=sources_json,
            model=chat_res.model,
            token_usage=token_usage_json,
        )

        # 6. If this was the first question and title is default, generate a thread title
        if conv.title == "New Conversation" or not conv.title.strip():
            words = question.strip().split()
            clean_title = " ".join(words[:6])
            if len(question.strip()) > len(clean_title):
                clean_title += "..."
            self.repo.update_title(conv, clean_title)

        return ChatMessageResponse(
            id=ai_msg.id,
            conversation_id=ai_msg.conversation_id,
            role=ai_msg.role,
            content=ai_msg.content,
            sources=json.loads(sources_json),
            model=ai_msg.model,
            token_usage=json.loads(token_usage_json),
            created_at=ai_msg.created_at,
        )
