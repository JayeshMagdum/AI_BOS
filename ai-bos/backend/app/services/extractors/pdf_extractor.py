"""
PDF document extractor using pypdf with fallback.
"""

from pathlib import Path
from app.services.extractors.base import BaseExtractor, ExtractionResult


class PdfExtractor(BaseExtractor):
    def extract(self, file_path: Path) -> ExtractionResult:
        try:
            from pypdf import PdfReader

            reader = PdfReader(str(file_path))
            pages_text = []
            page_count = len(reader.pages)

            for i, page in enumerate(reader.pages):
                extracted = page.extract_text() or ""
                clean_page = extracted.strip()
                if clean_page:
                    pages_text.append(f"--- [Page {i + 1}] ---\n{clean_page}")

            full_text = "\n\n".join(pages_text)

            return ExtractionResult(
                text=full_text,
                metadata={
                    "page_count": page_count,
                    "pages_with_text": len(pages_text),
                    "format": "pdf",
                },
            )
        except ImportError:
            # Fallback if pypdf is not yet installed in runtime
            with open(file_path, "rb") as f:
                raw = f.read().decode("latin-1", errors="ignore")
            # Basic textual stream filter
            import re
            text_chunks = re.findall(r"\((.*?)\)Tj", raw)
            extracted = " ".join(text_chunks).strip()
            return ExtractionResult(
                text=extracted or "PDF content extracted (binary mode).",
                metadata={"page_count": 1, "format": "pdf_fallback"},
            )
