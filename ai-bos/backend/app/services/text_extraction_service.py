"""
High-level service for document text extraction across all supported formats.
"""

from pathlib import Path
import re
from app.services.extractors import ExtractionResult, get_extractor


class TextExtractionService:
    @staticmethod
    def extract_from_file(file_path: Path, file_type: str | None = None) -> ExtractionResult:
        if not file_path.exists():
            raise FileNotFoundError(f"Document file not found at: {file_path}")

        resolved_type = file_type or file_path.suffix.lstrip(".")
        extractor = get_extractor(resolved_type)

        result = extractor.extract(file_path)

        # Normalize whitespace (replace multiple consecutive blank lines with maximum two)
        cleaned_text = re.sub(r"\n{3,}", "\n\n", result.text).strip()

        result.text = cleaned_text
        result.char_count = len(cleaned_text)
        result.word_count = len(cleaned_text.split())

        return result
