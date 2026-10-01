import json
import logging
import uuid
from pathlib import Path
from typing import Any

import pandas as pd
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.analytics import ExtractedData
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

class AnalyticsExtractorService:
    @staticmethod
    def extract_and_store(
        db: Session,
        document_id: uuid.UUID,
        user_id: uuid.UUID,
        file_path: Path,
        file_type: str,
        extracted_text: str,
    ) -> None:
        """
        Extract structured data suitable for charting from the given document.
        Store results in ExtractedData table.
        """
        try:
            if file_type in ["csv", "xlsx", "xls"]:
                AnalyticsExtractorService._extract_from_tabular(
                    db, document_id, user_id, file_path, file_type
                )
            elif file_type in ["pdf", "docx", "doc", "txt"]:
                AnalyticsExtractorService._extract_from_unstructured(
                    db, document_id, user_id, extracted_text
                )
        except Exception as e:
            logger.error(f"Failed to extract analytics for document {document_id}: {e}", exc_info=True)

    @staticmethod
    def _extract_from_tabular(
        db: Session, document_id: uuid.UUID, user_id: uuid.UUID, file_path: Path, file_type: str
    ) -> None:
        if file_type == "csv":
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)

        if df.empty:
            return

        numeric_cols = df.select_dtypes(include=['int64', 'float64']).columns.tolist()
        
        cat_cols = []
        for col in df.select_dtypes(include=['object', 'string']).columns:
            unique_count = df[col].nunique()
            if unique_count > 0 and unique_count < 50:
                avg_len = df[col].astype(str).str.len().mean()
                if avg_len < 50:
                    cat_cols.append(col)
                    
        date_cols = []
        for col in df.columns:
            if col not in numeric_cols and col not in cat_cols:
                try:
                    df[col] = pd.to_datetime(df[col], format='mixed', errors='ignore')
                    if pd.api.types.is_datetime64_any_dtype(df[col]):
                        date_cols.append(col)
                except:
                    pass

        valid_numeric_cols = []
        for col in numeric_cols:
            if df[col].std() > 0.01:
                valid_numeric_cols.append(col)

        if not valid_numeric_cols:
            return

        records_to_insert = []
        
        # 1. TIME SERIES (Date + Numeric) -> LINE CHART
        if date_cols and valid_numeric_cols:
            primary_date = date_cols[0]
            df_date = df.dropna(subset=[primary_date]).copy()
            df_date['__date_str'] = df_date[primary_date].dt.strftime('%Y-%m-%d')
            
            for num_col in valid_numeric_cols[:2]:
                agg = df_date.groupby('__date_str')[num_col].mean().reset_index()
                agg = agg.sort_values(by='__date_str').head(50)
                for _, row in agg.iterrows():
                    records_to_insert.append(ExtractedData(
                        user_id=user_id, document_id=document_id,
                        category_name=f"Time Series: {primary_date}",
                        metric_name=num_col,
                        category_value=str(row['__date_str']),
                        metric_value=float(row[num_col]),
                        chart_type="line", is_timeseries=True
                    ))

        # 2. CATEGORICAL + NUMERIC
        for cat_col in cat_cols[:3]:
            cardinality = df[cat_col].nunique()
            for num_col in valid_numeric_cols[:3]:
                # Use mean for temperatures/rates, sum for revenue/counts
                # Simple heuristic: if mean > 1000, probably a volume/revenue (sum), else mean
                use_sum = df[num_col].mean() > 1000
                if use_sum:
                    agg = df.groupby(cat_col, dropna=True)[num_col].sum().reset_index()
                else:
                    agg = df.groupby(cat_col, dropna=True)[num_col].mean().reset_index()
                
                agg = agg.sort_values(by=num_col, ascending=False)
                
                chart_type = "pie" if cardinality <= 6 else "bar"
                
                if cardinality > 6:
                    top_k = agg.head(10)
                    other_sum = agg.iloc[10:][num_col].sum() if use_sum else agg.iloc[10:][num_col].mean()
                    if not pd.isna(other_sum) and len(agg) > 10:
                        other_row = pd.DataFrame([{cat_col: 'Other', num_col: other_sum}])
                        agg = pd.concat([top_k, other_row], ignore_index=True)
                    else:
                        agg = top_k

                for _, row in agg.iterrows():
                    records_to_insert.append(ExtractedData(
                        user_id=user_id, document_id=document_id,
                        category_name=cat_col, metric_name=num_col,
                        category_value=str(row[cat_col]), metric_value=float(row[num_col]),
                        chart_type=chart_type, is_timeseries=False
                    ))

        # 3. TWO NUMERICS -> SCATTER
        if len(valid_numeric_cols) >= 2:
            num1, num2 = valid_numeric_cols[0], valid_numeric_cols[1]
            correlation = df[num1].corr(df[num2])
            if abs(correlation) > 0.2:
                sample = df.dropna(subset=[num1, num2]).sample(min(100, len(df)))
                for _, row in sample.iterrows():
                    records_to_insert.append(ExtractedData(
                        user_id=user_id, document_id=document_id,
                        category_name=f"Scatter: {num1} vs {num2}",
                        metric_name=num2,
                        category_value=str(row[num1]),
                        metric_value=float(row[num2]),
                        chart_type="scatter", is_timeseries=False
                    ))

        # 4. SINGLE NUMERIC -> HISTOGRAM
        for num_col in valid_numeric_cols[:1]:
            s = df[num_col].dropna()
            if len(s) > 10:
                counts, bins = pd.cut(s, bins=10, retbins=True, right=False)
                val_counts = counts.value_counts().sort_index()
                for i, (interval, count) in enumerate(val_counts.items()):
                    records_to_insert.append(ExtractedData(
                        user_id=user_id, document_id=document_id,
                        category_name=f"Distribution: {num_col}",
                        metric_name="Frequency",
                        category_value=f"{interval.left:.1f} - {interval.right:.1f}",
                        metric_value=float(count),
                        chart_type="histogram", is_timeseries=False
                    ))

        if records_to_insert:
            db.bulk_save_objects(records_to_insert)
            db.commit()

    @staticmethod
    def _extract_from_unstructured(
        db: Session, document_id: uuid.UUID, user_id: uuid.UUID, extracted_text: str
    ) -> None:
        """Call Gemini to extract structured metrics from raw text."""
        if not extracted_text.strip():
            return

        # Truncate text to avoid hitting token limits
        text_sample = extracted_text[:15000] 
        
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        
        prompt = f"""
You are an expert data analyst. Extract structured facts, figures, counts, or financial metrics from the document below.
Return a JSON array of objects representing chartable data points. 
If the document is a narrative with NO chartable facts or metrics, return an empty array [].

For each data point you find, return an object with:
- "category_name": The overarching dimension (e.g. "Region", "Year", "Product Category")
- "category_value": The specific value (e.g. "North America", "2023", "Widgets")
- "metric_name": The name of the numeric metric (e.g. "Revenue", "Count", "Market Share (%)")
- "metric_value": A pure float representing the numeric value (e.g. 150000.0, 45.0)

Example output for a document mentioning "Sales in NA were 500k, Europe 300k":
[
  {{"category_name": "Region", "category_value": "NA", "metric_name": "Sales", "metric_value": 500000.0}},
  {{"category_name": "Region", "category_value": "Europe", "metric_name": "Sales", "metric_value": 300000.0}}
]

Document Text:
{text_sample}
"""

        try:
            response = client.models.generate_content(
                model='gemini-3.8-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                ),
            )
            
            result = response.text
            if not result:
                return
                
            data = json.loads(result)
            if not isinstance(data, list):
                return
                
            records_to_insert = []
            for item in data:
                if not all(k in item for k in ["category_name", "category_value", "metric_name", "metric_value"]):
                    continue
                    
                # Group small categories into pie, large into bar (we'll just default to bar here for simplicity)
                chart_type = "bar"
                
                records_to_insert.append(
                    ExtractedData(
                        user_id=user_id,
                        document_id=document_id,
                        category_name=str(item["category_name"])[:255],
                        metric_name=str(item["metric_name"])[:255],
                        category_value=str(item["category_value"])[:500],
                        metric_value=float(item["metric_value"]),
                        chart_type=chart_type,
                        is_timeseries=False
                    )
                )
                
            if records_to_insert:
                db.bulk_save_objects(records_to_insert)
                db.commit()
                
        except Exception as e:
            logger.error(f"Gemini unstructured extraction failed: {e}")
