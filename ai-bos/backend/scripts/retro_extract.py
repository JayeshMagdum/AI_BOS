import sys
import os
import uuid
from pathlib import Path

# Add the parent directory to sys.path so we can import 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.models.document import Document
from app.services.analytics_extractor import AnalyticsExtractorService
from app.services.document_service import DocumentService

def run():
    db = SessionLocal()
    from app.models.analytics import ExtractedData
    db.query(ExtractedData).delete()
    db.commit()
    
    docs = db.query(Document).all()
    
    doc_service = DocumentService(db)
    
    print(f"Found {len(docs)} documents. Running extraction...")
    
    for doc in docs:
        print(f"Extracting for {doc.filename}...")
        try:
            # We need to extract the text first
            extracted_text = ""
            if Path(doc.file_path).exists():
                from app.services.text_extraction_service import TextExtractionService
                res = TextExtractionService.extract_from_file(Path(doc.file_path), doc.file_type)
                extracted_text = res.text or ""
                
            AnalyticsExtractorService.extract_and_store(
                db=db,
                document_id=doc.id,
                user_id=doc.user_id,
                file_path=Path(doc.file_path),
                file_type=doc.file_type,
                extracted_text=extracted_text
            )
            print(f"Successfully extracted data for {doc.filename}")
        except Exception as e:
            print(f"Error for {doc.filename}: {e}")

if __name__ == "__main__":
    run()
