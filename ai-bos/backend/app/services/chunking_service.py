"""
Text chunking service — splits extracted document text into
overlapping chunks optimized for embedding and vector retrieval.

The chunker uses a recursive strategy:
1. Split on paragraph boundaries (double newlines).
2. If a paragraph exceeds the chunk size, split on sentence boundaries.
3. If a sentence still exceeds, split on word boundaries.

Each chunk carries metadata about its position in the source document,
enabling accurate citation in RAG responses.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field


@dataclass
class TextChunk:
    """A single chunk of text ready for embedding."""

    text: str
    chunk_index: int
    start_char: int
    end_char: int
    metadata: dict = field(default_factory=dict)

    @property
    def word_count(self) -> int:
        return len(self.text.split())


# Sentence-splitting regex: splits on `. `, `? `, `! `, or newlines
_SENTENCE_RE = re.compile(r"(?<=[.!?])\s+|\n")


def chunk_text(
    text: str,
    chunk_size: int = 512,
    chunk_overlap: int = 64,
    min_chunk_size: int = 50,
    document_id: str | None = None,
    filename: str | None = None,
) -> list[TextChunk]:
    """
    Split text into overlapping chunks for vector embedding.

    Parameters
    ----------
    text : str
        The full extracted text from a document.
    chunk_size : int
        Target maximum number of characters per chunk.
    chunk_overlap : int
        Number of overlapping characters between consecutive chunks.
    min_chunk_size : int
        Minimum chunk size — fragments smaller than this are merged
        into the previous chunk.
    document_id : str | None
        Optional document ID to attach as metadata.
    filename : str | None
        Optional filename to attach as metadata.

    Returns
    -------
    list[TextChunk]
        Ordered list of text chunks with positional metadata.
    """
    if not text or not text.strip():
        return []

    text = text.strip()

    # Phase 1: split into paragraphs
    paragraphs = re.split(r"\n{2,}", text)
    paragraphs = [p.strip() for p in paragraphs if p.strip()]

    raw_chunks: list[str] = []

    for para in paragraphs:
        if len(para) <= chunk_size:
            raw_chunks.append(para)
        else:
            # Phase 2: split long paragraphs into sentences
            sentences = _SENTENCE_RE.split(para)
            sentences = [s.strip() for s in sentences if s.strip()]

            current = ""
            for sentence in sentences:
                if len(sentence) > chunk_size:
                    # Phase 3: split very long sentences on word boundaries
                    if current:
                        raw_chunks.append(current)
                        current = ""
                    words = sentence.split()
                    word_chunk = ""
                    for word in words:
                        test = f"{word_chunk} {word}".strip()
                        if len(test) > chunk_size:
                            if word_chunk:
                                raw_chunks.append(word_chunk)
                            word_chunk = word
                        else:
                            word_chunk = test
                    if word_chunk:
                        raw_chunks.append(word_chunk)
                elif len(current) + len(sentence) + 1 > chunk_size:
                    if current:
                        raw_chunks.append(current)
                    current = sentence
                else:
                    current = f"{current} {sentence}".strip() if current else sentence

            if current:
                raw_chunks.append(current)

    # Phase 4: merge very small fragments into previous chunk
    merged: list[str] = []
    for chunk in raw_chunks:
        if merged and len(chunk) < min_chunk_size:
            merged[-1] = f"{merged[-1]} {chunk}"
        else:
            merged.append(chunk)

    # Phase 5: apply overlap between consecutive chunks
    chunks: list[TextChunk] = []
    char_offset = 0

    for i, chunk_text_str in enumerate(merged):
        # Find actual position in original text
        pos = text.find(chunk_text_str, max(0, char_offset - chunk_overlap))
        if pos == -1:
            pos = char_offset

        base_meta = {"chunk_index": i, "total_chunks": len(merged)}
        if document_id:
            base_meta["document_id"] = document_id
        if filename:
            base_meta["filename"] = filename

        # Add overlap from previous chunk
        if i > 0 and chunk_overlap > 0:
            prev_text = merged[i - 1]
            overlap_text = prev_text[-chunk_overlap:] if len(prev_text) > chunk_overlap else ""
            if overlap_text:
                chunk_text_str = f"{overlap_text} {chunk_text_str}"

        chunks.append(
            TextChunk(
                text=chunk_text_str.strip(),
                chunk_index=i,
                start_char=pos,
                end_char=pos + len(chunk_text_str.strip()),
                metadata=base_meta,
            )
        )

        char_offset = pos + len(chunk_text_str.strip())

    return chunks
