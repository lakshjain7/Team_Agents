"""MedicalExtractorAgent — extract conditions from text or uploaded PDF."""
import io
from services import llm

try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False


EXTRACT_SYSTEM = """You are a medical coding specialist.
Extract all diagnosed medical conditions, pre-existing diseases, chronic conditions, and health risks from the text.
Include conditions explicitly mentioned AND ones implied by lab values or diagnoses.

Return ONLY valid JSON:
{
  "conditions": [
    {
      "name": "Type 2 Diabetes Mellitus",
      "icd_hint": "E11",
      "type": "chronic|acute|genetic|unknown",
      "severity": "mild|moderate|severe|unknown",
      "explicitly_mentioned": true
    }
  ],
  "summary": "one sentence summary of the overall health profile"
}

If no medical content is found, return {"conditions": [], "summary": "No medical conditions identified."}"""


def extract_from_text(text: str) -> dict:
    """Extract medical conditions from plain text."""
    result = llm.chat_json(EXTRACT_SYSTEM, text)
    result.setdefault("conditions", [])
    result.setdefault("summary", "")
    return result


def extract_from_pdf_bytes(file_bytes: bytes) -> dict:
    """Extract medical conditions from uploaded PDF file bytes."""
    if not PYMUPDF_AVAILABLE:
        return {"conditions": [], "summary": "PDF parsing unavailable", "error": "pymupdf not installed"}

    doc = fitz.open(stream=file_bytes, filetype="pdf")
    all_text = ""
    for page in doc:
        all_text += page.get_text() + "\n"
    doc.close()

    if not all_text.strip():
        return {"conditions": [], "summary": "No readable text found in PDF"}

    # Truncate to avoid token limits (~4000 chars ≈ 1000 tokens)
    truncated = all_text[:8000]
    return extract_from_text(truncated)


def match_conditions_to_exclusions(conditions: list[dict], policies: list[dict]) -> list[dict]:
    """
    For each policy, check if any extracted conditions match known exclusions.
    Returns policies with an added `exclusion_flags` field.
    """
    flagged = []
    for policy in policies:
        exclusions = policy.get("exclusions", []) or []
        flags = []
        for condition in conditions:
            cname = condition.get("name", "").lower()
            for excl in exclusions:
                excl_lower = excl.lower()
                # Simple keyword matching — good enough for catalog exclusions
                keywords = cname.split()
                if any(kw in excl_lower for kw in keywords if len(kw) > 3):
                    flags.append({
                        "condition": condition["name"],
                        "exclusion": excl,
                        "risk": "This condition may be excluded or have extended waiting period",
                    })
        flagged.append({**policy, "exclusion_flags": flags})
    return flagged
