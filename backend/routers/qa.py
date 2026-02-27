"""
Policy Q&A routes — Hybrid RAG + Hidden Conditions Detector.
Feature 3: Upload policy PDF → ask coverage questions → structured verdict with citations.
"""
import os
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from services import pdf_parser, embedder, vector_store
from services.skills import HiddenConditionsDetector

router = APIRouter(prefix="/api", tags=["qa"])
detector = HiddenConditionsDetector()


class AskRequest(BaseModel):
    policy_id: str
    question: str


@router.get("/policies")
async def list_policies():
    """List all uploaded (embedded) policy documents."""
    policies = vector_store.list_uploaded_policies()
    return {"policies": policies}


@router.post("/upload")
async def upload_policy(file: UploadFile = File(...)):
    """Upload a policy PDF, chunk it, embed it, and store in Supabase."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    # Check if already embedded
    if vector_store.policy_already_embedded(file.filename):
        # Return existing policy_id
        policies = vector_store.list_uploaded_policies()
        existing = next((p for p in policies if p["filename"] == file.filename), None)
        if existing:
            return {"policy_id": existing["id"], "message": "Already embedded", "chunk_count": existing["chunk_count"]}

    # Save to temp file for PyMuPDF
    contents = await file.read()
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        # Parse PDF into section-aware chunks
        chunks = pdf_parser.parse_pdf(tmp_path)
        if not chunks:
            raise HTTPException(status_code=422, detail="No text could be extracted from this PDF.")

        policy_name = pdf_parser.extract_policy_name(tmp_path)

        # Register document
        policy_id = vector_store.create_uploaded_policy(
            name=policy_name,
            filename=file.filename,
        )

        # Embed and store chunks
        texts = [c.content for c in chunks]
        embeddings = embedder.embed_batch(texts)

        rows = [
            {
                "content": chunks[i].content,
                "embedding": embeddings[i],
                "page_number": chunks[i].page_number,
                "chunk_index": chunks[i].chunk_index,
                "section_type": chunks[i].section_type,
            }
            for i in range(len(chunks))
        ]

        vector_store.insert_chunks(policy_id, rows)
        vector_store.update_chunk_count(policy_id, len(rows))

        return {
            "policy_id": policy_id,
            "policy_name": policy_name,
            "chunk_count": len(chunks),
            "message": f"Successfully embedded {len(chunks)} chunks.",
        }
    finally:
        os.unlink(tmp_path)


@router.post("/ask")
async def ask_question(req: AskRequest):
    """
    Ask a coverage question about an uploaded policy.
    Uses 3-layer hybrid RAG + Hidden Conditions Detector.
    Returns structured verdict with explicit AND implicit conditions.
    """
    policy = vector_store.get_policy_by_id(req.policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found. Upload a PDF first.")

    result = detector.detect(question=req.question, policy_id=req.policy_id)

    return {
        "policy_name": policy.get("user_label", "Unknown Policy"),
        "question": req.question,
        **result,
    }
