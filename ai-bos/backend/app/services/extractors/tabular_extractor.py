"""
Tabular document extractor for CSV and Excel spreadsheets.
Converts rows into human-readable and embedding-friendly textual summaries.
"""

import csv
from pathlib import Path
from app.services.extractors.base import BaseExtractor, ExtractionResult


class TabularExtractor(BaseExtractor):
    def extract(self, file_path: Path) -> ExtractionResult:
        ext = file_path.suffix.lower()

        if ext in [".csv", ".tsv"]:
            return self._extract_csv(file_path)
        elif ext in [".xlsx", ".xls"]:
            return self._extract_excel(file_path)
        else:
            return self._extract_csv(file_path)

    def _extract_csv(self, file_path: Path) -> ExtractionResult:
        encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252"]
        rows = []
        delimiter = "\t" if file_path.suffix.lower() == ".tsv" else ","

        for encoding in encodings:
            try:
                with open(file_path, "r", encoding=encoding) as f:
                    # Sniff or default
                    reader = csv.reader(f, delimiter=delimiter)
                    rows = [row for row in reader if any(cell.strip() for cell in row)]
                break
            except (UnicodeDecodeError, csv.Error):
                continue

        if not rows:
            return ExtractionResult(text="", metadata={"rows": 0, "format": "csv"})

        header = rows[0]
        data_rows = rows[1:]

        text_lines = [f"Table Headers: {', '.join(header)}"]
        for i, row in enumerate(data_rows[:500]):  # cap to first 500 rows for summary
            row_dict_strs = [
                f"{header[j]}: {row[j]}"
                for j in range(min(len(header), len(row)))
                if row[j].strip()
            ]
            if row_dict_strs:
                text_lines.append(f"Row {i + 1}: {', '.join(row_dict_strs)}")

        if len(data_rows) > 500:
            text_lines.append(f"... [Truncated. Total rows: {len(data_rows)}]")

        return ExtractionResult(
            text="\n".join(text_lines),
            metadata={
                "total_rows": len(rows),
                "columns": len(header),
                "headers": header[:20],
                "format": "csv",
            },
        )

    def _extract_excel(self, file_path: Path) -> ExtractionResult:
        try:
            import openpyxl

            wb = openpyxl.load_workbook(str(file_path), data_only=True)
            sheet_texts = []
            total_rows = 0

            for sheetname in wb.sheetnames:
                sheet = wb[sheetname]
                rows = list(sheet.iter_rows(values_only=True))
                # Filter empty rows
                filtered_rows = [
                    [str(c) if c is not None else "" for c in r]
                    for r in rows
                    if any(c is not None and str(c).strip() for c in r)
                ]

                if not filtered_rows:
                    continue

                total_rows += len(filtered_rows)
                header = filtered_rows[0]
                lines = [f"Sheet [{sheetname}] - Columns: {', '.join(header)}"]

                for i, row in enumerate(filtered_rows[1:300]):
                    row_strs = [
                        f"{header[j]}: {row[j]}"
                        for j in range(min(len(header), len(row)))
                        if row[j].strip()
                    ]
                    if row_strs:
                        lines.append(f"Row {i + 1}: {', '.join(row_strs)}")

                if len(filtered_rows) > 300:
                    lines.append(f"... [Truncated {sheetname}. Total: {len(filtered_rows)} rows]")

                sheet_texts.append("\n".join(lines))

            return ExtractionResult(
                text="\n\n".join(sheet_texts),
                metadata={
                    "sheets": wb.sheetnames,
                    "sheet_count": len(wb.sheetnames),
                    "total_rows": total_rows,
                    "format": "excel",
                },
            )
        except ImportError:
            # Fallback if openpyxl not installed
            return ExtractionResult(
                text="Excel spreadsheet uploaded. Install openpyxl for full extraction.",
                metadata={"format": "excel_unparsed"},
            )
