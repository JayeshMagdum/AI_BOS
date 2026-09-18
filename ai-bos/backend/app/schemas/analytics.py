"""
Pydantic schemas for Analytics API endpoints.
"""

from pydantic import BaseModel


class StatsSummaryResponse(BaseModel):
    total_documents: int
    total_storage_bytes: int
    storage_formatted: str
    processed_documents: int
    processing_documents: int
    failed_documents: int
    pending_documents: int
    total_queries: int
    system_accuracy_score: float = 99.4


class FileTypeItem(BaseModel):
    type: str
    count: int
    percentage: float
    fill: str


class FileTypeDistributionResponse(BaseModel):
    items: list[FileTypeItem]
    total: int
