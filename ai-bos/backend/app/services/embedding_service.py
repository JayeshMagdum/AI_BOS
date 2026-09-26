"""
Embedding service — generates vector embeddings for text chunks
using Sentence Transformers and stores/queries them in Qdrant.

This service handles:
1. Loading the embedding model (lazy, cached).
2. Encoding text chunks into dense vectors.
3. Upserting vectors into a Qdrant collection.
4. Querying Qdrant for similar chunks given a query string.
"""

from __future__ import annotations

import uuid
import logging
from dataclasses import dataclass, field
from pathlib import Path

logger = logging.getLogger(__name__)


@dataclass
class EmbeddingMatch:
    """A single vector search result."""
    chunk_text: str
    score: float
    document_id: str
    filename: str
    chunk_index: int
    metadata: dict = field(default_factory=dict)


class EmbeddingService:
    """
    Manages embedding generation and Qdrant vector operations.

    Uses sentence-transformers for local embedding and qdrant-client
    for vector storage/retrieval.
    """

    def __init__(
        self,
        qdrant_host: str = "qdrant",
        qdrant_port: int = 6333,
        collection_name: str = "aibos_documents",
        model_name: str = "all-MiniLM-L6-v2",
    ):
        self.qdrant_host = qdrant_host
        self.qdrant_port = qdrant_port
        self.collection_name = collection_name
        self.model_name = model_name

        self._model = None
        self._qdrant_client = None
        self._vector_size: int | None = None

    # ── Lazy loaders ──────────────────────────────────────

    @property
    def model(self):
        if self._model is None:
            from sentence_transformers import SentenceTransformer
            logger.info("Loading embedding model: %s", self.model_name)
            self._model = SentenceTransformer(self.model_name)
            self._vector_size = self._model.get_sentence_embedding_dimension()
            logger.info("Model loaded. Vector dimension: %d", self._vector_size)
        return self._model

    @property
    def vector_size(self) -> int:
        if self._vector_size is None:
            _ = self.model  # trigger lazy load
        return self._vector_size  # type: ignore

    @property
    def client(self):
        if self._qdrant_client is None:
            from qdrant_client import QdrantClient
            self._qdrant_client = QdrantClient(
                host=self.qdrant_host, port=self.qdrant_port
            )
            self._ensure_collection()
        return self._qdrant_client

    def _ensure_collection(self):
        """Create the Qdrant collection if it doesn't exist."""
        from qdrant_client.models import Distance, VectorParams

        collections = [c.name for c in self._qdrant_client.get_collections().collections]
        if self.collection_name not in collections:
            self._qdrant_client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=self.vector_size,
                    distance=Distance.COSINE,
                ),
            )
            logger.info("Created Qdrant collection: %s", self.collection_name)

    # ── Core operations ───────────────────────────────────

    def encode(self, texts: list[str]) -> list[list[float]]:
        """Encode a batch of texts into embedding vectors."""
        embeddings = self.model.encode(texts, show_progress_bar=False)
        return [emb.tolist() for emb in embeddings]

    def upsert_chunks(
        self,
        chunks: list[dict],
        document_id: str,
        user_id: str,
        filename: str,
    ) -> int:
        """
        Embed and upsert text chunks into Qdrant.

        Parameters
        ----------
        chunks : list[dict]
            Each dict must have 'text', 'chunk_index', and optionally other metadata.
        document_id : str
            The document these chunks belong to.
        user_id : str
            The owning user ID (used for filtered queries).
        filename : str
            Original filename for citation metadata.

        Returns
        -------
        int
            Number of vectors upserted.
        """
        from qdrant_client.models import PointStruct

        if not chunks:
            return 0

        texts = [c["text"] for c in chunks]
        vectors = self.encode(texts)

        points = []
        for chunk, vector in zip(chunks, vectors):
            point_id = str(uuid.uuid4())
            payload = {
                "text": chunk["text"],
                "document_id": document_id,
                "user_id": user_id,
                "filename": filename,
                "chunk_index": chunk.get("chunk_index", 0),
                "word_count": chunk.get("word_count", len(chunk["text"].split())),
            }
            points.append(PointStruct(id=point_id, vector=vector, payload=payload))

        self.client.upsert(
            collection_name=self.collection_name,
            points=points,
        )

        logger.info(
            "Upserted %d vectors for document %s (%s)",
            len(points), document_id, filename,
        )
        return len(points)

    def search(
        self,
        query: str,
        user_id: str,
        top_k: int = 5,
        score_threshold: float = 0.3,
    ) -> list[EmbeddingMatch]:
        """
        Search for chunks similar to the query, scoped to a specific user.

        Parameters
        ----------
        query : str
            Natural language search query.
        user_id : str
            Filter results to only this user's documents.
        top_k : int
            Maximum number of results to return.
        score_threshold : float
            Minimum cosine similarity score.

        Returns
        -------
        list[EmbeddingMatch]
            Ordered by descending similarity score.
        """
        from qdrant_client.models import Filter, FieldCondition, MatchValue

        query_vector = self.encode([query])[0]

        results = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_vector,
            query_filter=Filter(
                must=[
                    FieldCondition(key="user_id", match=MatchValue(value=user_id))
                ]
            ),
            limit=top_k,
            score_threshold=score_threshold,
        )

        matches = []
        for hit in results:
            payload = hit.payload or {}
            matches.append(
                EmbeddingMatch(
                    chunk_text=payload.get("text", ""),
                    score=hit.score,
                    document_id=payload.get("document_id", ""),
                    filename=payload.get("filename", ""),
                    chunk_index=payload.get("chunk_index", 0),
                    metadata={
                        "word_count": payload.get("word_count", 0),
                        "point_id": str(hit.id),
                    },
                )
            )

        return matches

    def count_user_chunks(self, user_id: str) -> int:
        """Count how many vector chunks are stored in Qdrant for this user."""
        from qdrant_client.models import Filter, FieldCondition, MatchValue

        try:
            res = self.client.count(
                collection_name=self.collection_name,
                count_filter=Filter(
                    must=[FieldCondition(key="user_id", match=MatchValue(value=user_id))]
                ),
                exact=True,
            )
            return res.count
        except Exception as e:
            logger.warning("Failed to count chunks for user %s: %s", user_id, e)
            return 0

    def get_user_chunks(self, user_id: str, limit: int = 5) -> list[EmbeddingMatch]:
        """Retrieve recent chunks for a user when semantic search yields no matches on broad questions."""
        from qdrant_client.models import Filter, FieldCondition, MatchValue

        try:
            records, _ = self.client.scroll(
                collection_name=self.collection_name,
                scroll_filter=Filter(
                    must=[FieldCondition(key="user_id", match=MatchValue(value=user_id))]
                ),
                limit=limit,
                with_payload=True,
                with_vectors=False,
            )
            matches = []
            for hit in records:
                payload = hit.payload or {}
                matches.append(
                    EmbeddingMatch(
                        chunk_text=payload.get("text", ""),
                        score=0.5,
                        document_id=payload.get("document_id", ""),
                        filename=payload.get("filename", ""),
                        chunk_index=payload.get("chunk_index", 0),
                        metadata={
                            "word_count": payload.get("word_count", 0),
                            "point_id": str(hit.id),
                        },
                    )
                )
            return matches
        except Exception as e:
            logger.warning("Failed to retrieve fallback chunks for user %s: %s", user_id, e)
            return []

    def delete_by_document(self, document_id: str) -> None:
        """Remove all vectors belonging to a specific document."""
        from qdrant_client.models import Filter, FieldCondition, MatchValue

        self.client.delete(
            collection_name=self.collection_name,
            points_selector=Filter(
                must=[
                    FieldCondition(
                        key="document_id",
                        match=MatchValue(value=document_id),
                    )
                ]
            ),
        )
        logger.info("Deleted vectors for document %s", document_id)
