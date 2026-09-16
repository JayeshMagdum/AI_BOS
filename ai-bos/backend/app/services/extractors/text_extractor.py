"""
Plain text and markdown document extractor.
"""

from pathlib import Path
from app.services.extractors.base import BaseExtractor, ExtractionResult


class TextExtractor(BaseExtractor):
    def extract(self, file_path: Path) -> ExtractionResult:
        encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252"]
        content = ""

        for encoding in encodings:
            try:
                with open(file_path, "r", encoding=encoding) as f:
                    content = f.read()
                break
            except (UnicodeDecodeError, LookupError):
                continue

        lines = content.splitlines()
        non_empty_lines = [line.strip() for line in lines if line.strip()]

        return ExtractionResult(
            text=content.strip(),
            metadata={
                "line_count": len(lines),
                "non_empty_line_count": len(non_empty_lines),
                "format": "plain_text",
            },
        )
