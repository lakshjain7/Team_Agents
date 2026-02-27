"""
Claim Advisory, Medical Matching, and Coverage Gap Analysis routes.
Feature 4: Medical report → extract conditions → match against policies
Feature 5: Existing policy + diagnosis → claim eligibility verdict
Feature 6: Coverage gap analysis for any catalog policy
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional
from services import llm, vector_store
from services.skills import HiddenConditionsDetector, CoverageGapScanner
from services.medical_extractor import extract_from_text, extract_from_pdf_bytes, match_conditions_to_exclusions
from services.tools import run_tool

router = APIRouter(prefix="/api", tags=["claim"])
detector = HiddenConditionsDetector()
gap_scanner = CoverageGapScanner()


class ClaimCheckRequest(BaseModel):
    policy_id: str
    diagnosis: str
    treatment_type: Optional[str] = "hospitalization"


class ExtractConditionsRequest(BaseModel):
    text: str


class MatchConditionsRequest(BaseModel):
    conditions: list[dict]


# ── Feature 5: Claim Advisory ────────────────────────────────────────────────

@router.post("/claim-check")
async def claim_check(req: ClaimCheckRequest):
    """
    Determine claim eligibility for a given diagnosis/treatment.
    Uses Hybrid RAG to retrieve relevant policy clauses, then GPT analysis.
    """
    policy = vector_store.get_policy_by_id(req.policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found.")

    # Use HiddenConditionsDetector with a claim-framing question
    claim_question = (
        f"Is {req.diagnosis} covered under this policy? "
        f"What are the conditions, waiting periods, sub-limits, co-pay, and required pre-authorizations? "
        f"What documents are needed to file a claim?"
    )

    verdict_result = detector.detect(question=claim_question, policy_id=req.policy_id)

    # Calculate feasibility score
    has_pre_auth = any(
        hc.get("type") == "pre_auth_required"
        for hc in verdict_result.get("hidden_conditions", [])
    )
    has_sub_limit = any(
        hc.get("type") == "sub_limit"
        for hc in verdict_result.get("hidden_conditions", [])
    )
    has_waiting = any(
        hc.get("type") == "waiting_period"
        for hc in verdict_result.get("hidden_conditions", [])
    )

    score_result = run_tool("calculate_claim_score", {
        "verdict": verdict_result.get("verdict", "AMBIGUOUS"),
        "hidden_conditions_count": len(verdict_result.get("hidden_conditions", [])),
        "has_pre_auth_required": has_pre_auth,
        "has_sub_limit": has_sub_limit,
        "has_waiting_period": has_waiting,
    })

    # Get document checklist
    docs_result = run_tool("get_document_checklist", {
        "claim_type": req.treatment_type or "hospitalization",
    })

    return {
        "policy_name": policy.get("user_label", "Unknown Policy"),
        "diagnosis": req.diagnosis,
        "verdict": verdict_result.get("verdict"),
        "practical_claimability": verdict_result.get("practical_claimability"),
        "claim_feasibility_score": score_result.get("score", 50),
        "confidence": verdict_result.get("confidence"),
        "plain_answer": verdict_result.get("plain_answer"),
        "conditions": verdict_result.get("conditions", []),
        "hidden_conditions": verdict_result.get("hidden_conditions", []),
        "required_documents": docs_result.get("required_documents", []),
        "citations": verdict_result.get("citations", []),
        "recommendation": verdict_result.get("recommendation"),
    }


# ── Feature 4: Medical Report → Policy Matching ──────────────────────────────

@router.post("/extract-conditions")
async def extract_conditions_from_text_endpoint(req: ExtractConditionsRequest):
    """Extract medical conditions from free text input."""
    result = extract_from_text(req.text)
    return result


@router.post("/extract-conditions-file")
async def extract_conditions_from_file(file: UploadFile = File(...)):
    """Extract medical conditions from uploaded medical report PDF."""
    contents = await file.read()
    result = extract_from_pdf_bytes(contents)
    return result


@router.post("/match-conditions")
async def match_conditions(req: MatchConditionsRequest):
    """
    Given extracted conditions, rank all catalog policies by suitability.
    Flags policies where conditions may be excluded.
    """
    all_policies = vector_store.list_catalog_policies()
    flagged_policies = match_conditions_to_exclusions(req.conditions, all_policies)

    # Sort: fewer exclusion flags = better match
    sorted_policies = sorted(
        flagged_policies,
        key=lambda p: len(p.get("exclusion_flags", [])),
    )

    return {
        "extracted_conditions": req.conditions,
        "recommended_policies": sorted_policies[:6],
        "total_evaluated": len(sorted_policies),
    }


# ── Feature 6: Coverage Gap Analysis ────────────────────────────────────────

@router.get("/gap-analysis/{policy_id}")
async def gap_analysis(policy_id: str):
    """
    Identify coverage gaps in a catalog policy.
    Compares policy metadata against standard coverage checklist.
    """
    # Try catalog policy first
    catalog_policy = vector_store.get_catalog_policy(policy_id)
    if not catalog_policy:
        # Try uploaded policy — do LLM-based gap analysis from chunks
        uploaded = vector_store.get_policy_by_id(policy_id)
        if not uploaded:
            raise HTTPException(status_code=404, detail="Policy not found.")

        # Ask LLM to identify gaps from embedded chunks
        gap_question = (
            "What coverage gaps does this policy have? "
            "Does it lack maternity, OPD, mental health, dental, restoration, or NCB benefits? "
            "Are there any high waiting periods, room rent caps, or co-pay requirements?"
        )
        gap_result = detector.detect(gap_question, policy_id)

        return {
            "policy_name": uploaded.get("user_label", "Unknown Policy"),
            "analysis_type": "rag_based",
            "gaps": [],
            "ai_summary": gap_result.get("plain_answer"),
            "hidden_conditions": gap_result.get("hidden_conditions", []),
            "recommendation": gap_result.get("recommendation"),
        }

    gaps = gap_scanner.scan(catalog_policy)

    severity_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    gaps.sort(key=lambda g: severity_order.get(g["severity"], 3))

    return {
        "policy_name": catalog_policy.get("name"),
        "insurer": catalog_policy.get("insurer"),
        "analysis_type": "catalog_based",
        "gaps": gaps,
        "gap_count": len(gaps),
        "high_risk_count": sum(1 for g in gaps if g["severity"] == "HIGH"),
    }
