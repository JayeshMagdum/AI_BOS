"""
Extractor factory for routing files by extension to appropriate parser.
"""

from app.services.extractors.base import BaseExtractor, ExtractionResult
from app.services.extractors.docx_extractor import DocxExtractor
from app.services.extractors.pdf_extractor import PdfExtractor
from app.services.extractors.tabular_extractor import TabularExtractor
from app.services.extractors.text_extractor import TextExtractor

_EXTRACTOR_MAP: dict[str, type[BaseExtractor]] = {
    "pdf": PdfExtractor,
    "docx": DocxExtractor,
    "doc": DocxExtractor,
    "txt": TextExtractor,
    "md": TextExtractor,
    "csv": TabularExtractor,
    "tsv": TabularExtractor,
    "xlsx": TabularExtractor,
    "xls": TabularExtractor,
}


def get_extractor(file_type: str) -> BaseExtractor:
    clean_type = file_type.lower().strip().lstrip(".")
    extractor_cls = _EXTRACTOR_MAP.get(clean_type, TextExtractor)
    return extractor_cls()


__all__ = [
    "BaseExtractor",
    "ExtractionResult",
    "PdfExtractor",
    "DocxExtractor",
    "TabularExtractor",
    "TextExtractor",
    "get_extractor",
]
