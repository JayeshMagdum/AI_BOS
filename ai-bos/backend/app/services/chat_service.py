"""
RAG Chat Service — Retrieval-Augmented Generation using Qdrant + Gemini.

Pipeline:
1. User sends a natural language question.
2. EmbeddingService searches Qdrant for the most relevant document chunks.
3. Retrieved chunks are assembled into a context window.
4. A structured prompt with context + question is sent to Google Gemini.
5. Gemini returns an answer with source citations.

Uses the new `google-genai` SDK (replacing deprecated `google-generativeai`).
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

from app.core.config import settings
from app.services.embedding_service import EmbeddingMatch, EmbeddingService

logger = logging.getLogger(__name__)


@dataclass
class ChatSource:
    """A citation reference in the AI response."""
    filename: str
    document_id: str
    chunk_index: int
    relevance_score: float
    text_excerpt: str


@dataclass
class ChatResponse:
    """The complete AI chat response with sources."""
    answer: str
    sources: list[ChatSource] = field(default_factory=list)
    model: str = ""
    token_usage: dict = field(default_factory=dict)


# ── System prompt template ────────────────────────────────

SYSTEM_PROMPT = """You are AI BOS, an intelligent business assistant. Your role is to answer questions accurately using ONLY the provided document context.

Rules:
1. Base your answer strictly on the provided context. Do not make up information.
2. If the context doesn't contain enough information to answer, say so clearly.
3. When referencing information, cite the source document using [Source: filename].
4. Be concise but thorough. Use bullet points for lists.
5. If the question is about numbers or data, include the specific figures from the context.
6. Format your response in clean markdown for readability."""

CONTEXT_TEMPLATE = """
--- DOCUMENT CONTEXT ---
{context}
--- END CONTEXT ---

Question: {question}

Provide a well-structured answer based on the context above. Include source citations."""


class ChatService:
    """
    Orchestrates the RAG pipeline: retrieve → prompt → generate.
    Uses the google-genai Client SDK.
    """

    def __init__(
        self,
        embedding_service: EmbeddingService | None = None,
    ):
        self.embedding_service = embedding_service or EmbeddingService(
            qdrant_host=settings.QDRANT_HOST,
            qdrant_port=settings.QDRANT_PORT,
            collection_name=settings.QDRANT_COLLECTION_NAME,
            model_name=settings.EMBEDDING_MODEL_NAME,
        )
        self._gemini_client = None

    @property
    def gemini_client(self):
        """Lazy-load the Gemini genai Client."""
        if self._gemini_client is None:
            from google import genai

            self._gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
            logger.info("Gemini genai Client initialized (model: gemini-3.8-flash)")
        return self._gemini_client

    def chat(
        self,
        question: str,
        user_id: str,
        top_k: int = 5,
        score_threshold: float = 0.2,
        conversation_history: list[dict] | None = None,
    ) -> ChatResponse:
        """
        Answer a user question using RAG.

        Parameters
        ----------
        question : str
            The user's natural language question.
        user_id : str
            Scope vector search to this user's documents.
        top_k : int
            Number of chunks to retrieve.
        score_threshold : float
            Minimum similarity score for retrieved chunks.
        conversation_history : list[dict] | None
            Previous messages in the conversation for multi-turn context.
            Each dict has 'role' ('user' or 'assistant') and 'content'.

        Returns
        -------
        ChatResponse
            The AI-generated answer with source citations.
        """
        # Step 1: Retrieve relevant chunks from Qdrant
        matches: list[EmbeddingMatch] = self.embedding_service.search(
            query=question,
            user_id=user_id,
            top_k=top_k,
            score_threshold=score_threshold,
        )

        # Fallback for broad/summary questions (e.g. "summarize the document", "key takeaways", etc.)
        # If semantic search didn't clear threshold, check if user actually has indexed documents.
        if not matches and self.embedding_service.count_user_chunks(user_id) > 0:
            logger.info(
                "Semantic search returned 0 matches for '%s', fetching fallback document chunks for user %s",
                question, user_id,
            )
            matches = self.embedding_service.get_user_chunks(user_id=user_id, limit=top_k)

        if not matches:
            return ChatResponse(
                answer=(
                    "I couldn't find any relevant information in your uploaded documents "
                    "to answer this question. Please upload relevant documents first, "
                    "or try rephrasing your question."
                ),
                sources=[],
                model="none",
            )

        # Step 2: Build context from retrieved chunks
        context_parts = []
        sources = []
        for i, match in enumerate(matches):
            context_parts.append(
                f"[Source {i + 1}: {match.filename}, Chunk {match.chunk_index}]\n"
                f"{match.chunk_text}"
            )
            sources.append(
                ChatSource(
                    filename=match.filename,
                    document_id=match.document_id,
                    chunk_index=match.chunk_index,
                    relevance_score=round(match.score, 4),
                    text_excerpt=match.chunk_text[:200],
                )
            )

        context = "\n\n".join(context_parts)

        # Step 3: Build conversation contents for multi-turn context
        contents = []

        # Add system instruction as initial user+model exchange
        contents.append({
            "role": "user",
            "parts": [{"text": SYSTEM_PROMPT}],
        })
        contents.append({
            "role": "model",
            "parts": [{"text": "Understood. I will answer questions based solely on the provided document context and cite sources."}],
        })

        # Add conversation history for multi-turn context (up to last 10 exchanges)
        if conversation_history:
            recent_history = conversation_history[-20:]  # last 10 pairs (user + assistant)
            for msg in recent_history:
                role = "model" if msg["role"] == "assistant" else "user"
                contents.append({
                    "role": role,
                    "parts": [{"text": msg["content"]}],
                })

        # Add the current question with context
        prompt = CONTEXT_TEMPLATE.format(context=context, question=question)
        contents.append({
            "role": "user",
            "parts": [{"text": prompt}],
        })

        # Step 4: Generate answer with Gemini via new google-genai SDK
        # Use verified available models with automatic retry on temporary 503 demand spikes
        candidate_models = list(dict.fromkeys([
            getattr(settings, "GEMINI_MODEL", "gemini-flash-latest"),
            "gemini-flash-latest",
            "gemini-3-flash-preview",
            "gemini-2.5-pro",
        ]))

        answer = ""
        model_name = ""
        token_usage = {}
        last_error = None

        import time

        for model_candidate in candidate_models:
            for attempt in range(1, 4):
                try:
                    logger.info("Generating chat response using model %s (attempt %d/3)...", model_candidate, attempt)
                    response = self.gemini_client.models.generate_content(
                        model=model_candidate,
                        contents=contents,
                    )

                    answer = response.text if response.text else "I was unable to generate a response. Please try again."
                    model_name = model_candidate

                    # Extract token usage if available
                    if hasattr(response, "usage_metadata") and response.usage_metadata:
                        meta = response.usage_metadata
                        token_usage = {
                            "prompt_tokens": getattr(meta, "prompt_token_count", 0),
                            "completion_tokens": getattr(meta, "candidates_token_count", 0),
                            "total_tokens": getattr(meta, "total_token_count", 0),
                        }
                    break
                except Exception as e:
                    last_error = e
                    err_str = str(e)
                    logger.warning("Gemini model %s attempt %d failed: %s", model_candidate, attempt, err_str)
                    if "503" in err_str or "UNAVAILABLE" in err_str or "429" in err_str:
                        time.sleep(attempt * 1.5)
                        continue
                    # Non-retryable error (e.g. 404), fall through to next candidate model
                    break
            if answer:
                break

        if not answer:
            logger.error("All Gemini model candidates failed: %s", last_error, exc_info=True)
            answer = (
                f"I found {len(matches)} relevant document sections, but encountered "
                f"an error generating the response: {str(last_error)[:300]}. "
                f"Please check your GEMINI_API_KEY configuration."
            )
            model_name = "error"
            token_usage = {}

        return ChatResponse(
            answer=answer,
            sources=sources,
            model=model_name,
            token_usage=token_usage,
        )
