"""
Re-indexing / Backfill Script for AI BOS Documents.

Iterates over all Document records in PostgreSQL. For any document that:
1. Has 0 vectors in Qdrant, OR
2. Is specified via command line arguments,
it extracts text from the file on disk, chunks the text, and upserts embeddings into Qdrant.
"""

import os
import sys
import logging
from pathlib import Path

from app.db.session import SessionLocal
from app.models.document import Document
from app.services.chunking_service import chunk_text
from app.services.embedding_service import EmbeddingService
from app.services.text_extraction_service import TextExtractionService
from qdrant_client.models import Filter, FieldCondition, MatchValue

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("reindex")


def reindex_all(force: bool = False):
    db = SessionLocal()
    emb_service = EmbeddingService(qdrant_host="qdrant", qdrant_port=6333)

    documents = db.query(Document).all()
    logger.info("Found %d total documents in PostgreSQL database.", len(documents))

    stats = {
        "total": len(documents),
        "skipped_not_found": 0,
        "skipped_already_indexed": 0,
        "reindexed": 0,
        "failed": 0,
        "total_vectors_added": 0,
    }

    for doc in documents:
        doc_id_str = str(doc.id)
        user_id_str = str(doc.user_id)
        file_path = Path(doc.file_path)

        # Check existing vectors in Qdrant
        existing_points = []
        try:
            scroll_res, _ = emb_service.client.scroll(
                collection_name=emb_service.collection_name,
                scroll_filter=Filter(
                    must=[
                        FieldCondition(
                            key="document_id",
                            match=MatchValue(value=doc_id_str),
                        )
                    ]
                ),
                limit=1,
            )
            existing_points = scroll_res
        except Exception as e:
            logger.warning("Could not check Qdrant points for doc %s: %s", doc_id_str, e)

        if existing_points and not force:
            logger.info("Doc %s (%s) already has vectors in Qdrant. Skipping.", doc_id_str, doc.filename)
            stats["skipped_already_indexed"] += 1
            continue

        if not file_path.exists():
            logger.warning("Doc %s (%s) file not found at %s. Skipping.", doc_id_str, doc.filename, file_path)
            stats["skipped_not_found"] += 1
            continue

        logger.info("Indexing doc %s (%s) from %s...", doc_id_str, doc.filename, file_path)

        try:
            # 1. Extract text
            ext = file_path.suffix.lstrip(".").lower()
            extraction = TextExtractionService.extract_from_file(file_path, ext)
            extracted_text = extraction.text or ""

            if not extracted_text.strip():
                logger.warning("No text could be extracted from %s.", file_path)
                stats["failed"] += 1
                continue

            # 2. Chunk text
            chunks = chunk_text(
                text=extracted_text,
                chunk_size=512,
                chunk_overlap=64,
                document_id=doc_id_str,
                filename=doc.filename,
            )

            if not chunks:
                logger.warning("No chunks generated for %s.", file_path)
                continue

            # 3. Clean up existing vectors if forcing
            if existing_points and force:
                emb_service.delete_by_document(doc_id_str)

            # 4. Upsert into Qdrant
            chunk_dicts = [
                {
                    "text": c.text,
                    "chunk_index": c.chunk_index,
                    "word_count": c.word_count,
                }
                for c in chunks
            ]
            added = emb_service.upsert_chunks(
                chunks=chunk_dicts,
                document_id=doc_id_str,
                user_id=user_id_str,
                filename=doc.filename,
            )

            stats["reindexed"] += 1
            stats["total_vectors_added"] += added
            logger.info("Successfully indexed %d chunks for doc %s (%s)", added, doc_id_str, doc.filename)

        except Exception as e:
            logger.error("Failed to reindex doc %s (%s): %s", doc_id_str, doc.filename, e, exc_info=True)
            stats["failed"] += 1

    db.close()
    logger.info("=" * 50)
    logger.info("Reindexing Summary: %s", stats)
    logger.info("=" * 50)
    return stats


if __name__ == "__main__":
    force_flag = "--force" in sys.argv
    reindex_all(force=force_flag)
