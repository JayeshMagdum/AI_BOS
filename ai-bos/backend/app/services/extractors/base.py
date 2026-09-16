"""
Base interface and data models for document text extraction.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


@dataclass
class ExtractionResult:
    text: str
    metadata: dict[str, Any] = field(default_factory=dict)
    word_count: int = 0
    char_count: int = 0

    def __post_init__(self):
        if not self.word_count and self.text:
            self.word_count = len(self.text.split())
        if not self.char_count and self.text:
            self.char_count = len(self.text)


class BaseExtractor(ABC):
    @abstractmethod
    def extract(self, file_path: Path) -> ExtractionResult:
        """Extract plain text and structural metadata from a document file."""
        pass
