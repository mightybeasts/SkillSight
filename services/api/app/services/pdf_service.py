"""
PDF parsing service using PyMuPDF (fitz) with pdfplumber as fallback.
"""
import fitz  # PyMuPDF
import pdfplumber
from loguru import logger
import io


class PDFService:
    def extract_text(self, file_bytes: bytes) -> str:
        """
        Extract text from PDF bytes.
        Tries PyMuPDF first (faster), falls back to pdfplumber (better for tables).
        """
        text = self._extract_with_pymupdf(file_bytes)
        if len(text.strip()) < 100:
            logger.info('PyMuPDF extracted little text, trying pdfplumber fallback')
            text = self._extract_with_pdfplumber(file_bytes)
        return text

    def _extract_with_pymupdf(self, file_bytes: bytes) -> str:
        try:
            doc = fitz.open(stream=file_bytes, filetype='pdf')
            pages_text = []
            for page in doc:
                pages_text.append(page.get_text('text'))
            doc.close()
            return '\n'.join(pages_text)
        except Exception as e:
            logger.warning(f'PyMuPDF extraction failed: {e}')
            return ''

    def _extract_with_pdfplumber(self, file_bytes: bytes) -> str:
        try:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                pages_text = []
                for page in pdf.pages:
                    text = page.extract_text() or ''
                    pages_text.append(text)
            return '\n'.join(pages_text)
        except Exception as e:
            logger.warning(f'pdfplumber extraction failed: {e}')
            return ''

    def validate_pdf(self, file_bytes: bytes) -> bool:
        """Validate that the bytes represent a valid PDF."""
        return file_bytes[:4] == b'%PDF'

    def get_page_count(self, file_bytes: bytes) -> int:
        try:
            doc = fitz.open(stream=file_bytes, filetype='pdf')
            count = doc.page_count
            doc.close()
            return count
        except Exception:
            return 0


pdf_service = PDFService()
