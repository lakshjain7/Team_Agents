"""Section-aware PDF chunker using PyMuPDF.

Assigns section_type to each chunk based on heading detection patterns
confirmed from real Tata AIG Medicare Premier policy document structure:

  Section 1 – General Definitions  (pages 2-10)
  Section 2 – Benefits             (pages 11-32)
  Section 3 – Exclusions           (pages 33-39)
  Section 4 – General Terms        (pages 40-47)
  Section 5 – Claims Procedure     (pages 48-52)
  Section 6 – Dispute Resolution   (pages 53-60)
"""
import re
from dataclasses import dataclass
import fitz  # PyMuPDF


CHUNK_SIZE = 400      # tokens approximate (chars / 4)
CHUNK_OVERLAP = 80    # token overlap

# Section heading detection patterns (confirmed from real policy PDFs)
SECTION_PATTERNS: dict[str, list[str]] = {
    "definitions": [
        r"Section\s+1\b",
        r"General\s+Definitions",
        r"Specific\s+Definitions",
        r"^\d+\.\s+[A-Z][a-z]+",        # numbered definition entries
    ],
    "coverage": [
        r"Section\s+2\b",
        r"\bBenefits?\b",
        r"\bB\d+\.\s",                   # benefit codes B1. B2. etc.
        r"What\s+(is|are)\s+covered",
        r"Covered\s+Expenses",
        r"Insured\s+Benefits",
    ],
    "exclusions": [
        r"Section\s+3\b",
        r"\bExclusion",
        r"Code-Excl\d+",
        r"What\s+(is|are)\s+not\s+covered",
        r"General\s+Exclusions",
        r"Standard\s+Exclusions",
        r"Medical\s+Exclusions",
        r"Non-Medical\s+Exclusions",
    ],
    "waiting_periods": [
        r"Waiting\s+Period",
        r"Code-Excl0[123]",
        r"Pre.?existing\s+Diseases?\s+Waiting",
        r"30\s+Days?\s+Waiting",
        r"Specified\s+Disease.*Waiting",
    ],
    "conditions": [
        r"Section\s+4\b",
        r"General\s+Terms\s+and\s+Clauses",
        r"General\s+Conditions",
        r"Condition\s+Precedent",
        r"Policy\s+Conditions",
        r"Terms\s+and\s+Conditions",
    ],
    "claims": [
        r"Section\s+5\b",
        r"Claims?\s+Procedure",
        r"Claims?\s+Payment",
        r"How\s+to\s+(make|file|submit)\s+a\s+[Cc]laim",
    ],
    "limits": [
        r"Sub.?[Ll]imit",
        r"Room\s+Rent",
        r"Co.?[Pp]ay",
        r"Deductible",
        r"Maximum\s+(Limit|Liability)",
        r"Schedule\s+of\s+Benefits",
    ],
}

# Compiled patterns for efficiency
_COMPILED: dict[str, list[re.Pattern]] = {
    section: [re.compile(p, re.IGNORECASE | re.MULTILINE) for p in patterns]
    for section, patterns in SECTION_PATTERNS.items()
}


@dataclass
class Chunk:
    content: str
    page_number: int
    chunk_index: int
    section_type: str


def _detect_section(text: str, current_section: str) -> str:
    """Return section_type for a block of text, defaulting to current_section."""
    for section, patterns in _COMPILED.items():
        for pattern in patterns:
            if pattern.search(text):
                return section
    return current_section


def _chunk_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    """Split text into overlapping chunks by approximate token count (chars/4)."""
    char_size = chunk_size * 4
    char_overlap = overlap * 4
    chunks = []
    start = 0
    while start < len(text):
        end = start + char_size
        chunk = text[start:end]
        if chunk.strip():
            chunks.append(chunk.strip())
        if end >= len(text):
            break
        start = end - char_overlap
    return chunks


def parse_pdf(file_path: str) -> list[Chunk]:
    """Parse PDF and return section-aware chunks."""
    doc = fitz.open(file_path)
    all_chunks: list[Chunk] = []
    current_section = "general"
    chunk_index = 0

    for page_num in range(doc.page_count):
        page = doc[page_num]
        page_text = page.get_text()
        if not page_text.strip():
            continue

        # Update current section based on page content
        current_section = _detect_section(page_text, current_section)

        # Split page text into sub-chunks
        sub_chunks = _chunk_text(page_text, CHUNK_SIZE, CHUNK_OVERLAP)
        for sub in sub_chunks:
            # Refine section detection per sub-chunk
            section = _detect_section(sub, current_section)
            all_chunks.append(
                Chunk(
                    content=sub,
                    page_number=page_num + 1,
                    chunk_index=chunk_index,
                    section_type=section,
                )
            )
            chunk_index += 1

    doc.close()
    return all_chunks


def extract_policy_name(file_path: str) -> str:
    """Extract policy name from PDF first page text."""
    doc = fitz.open(file_path)
    first_page = doc[0].get_text() if doc.page_count > 0 else ""
    doc.close()
    # Look for UIN line or title line
    lines = [l.strip() for l in first_page.split("\n") if len(l.strip()) > 10]
    for line in lines[:15]:
        if any(kw in line.lower() for kw in ["policy", "insurance", "medicare", "health", "care", "assure"]):
            if len(line) < 100:
                return line
    return lines[0] if lines else "Unknown Policy"
