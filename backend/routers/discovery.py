"""
Discovery & Comparison routes.
Feature 1: Natural language → structured requirements → ranked policies
Feature 2: Multi-policy comparison table
"""
from fastapi import APIRouter
from pydantic import BaseModel
from services import llm, vector_store
from services.skills import PolicyRanker

router = APIRouter(prefix="/api", tags=["discovery"])
ranker = PolicyRanker()

EXTRACT_REQUIREMENTS_SYSTEM = """Extract health insurance requirements from user query.
Return ONLY valid JSON:
{
  "needs": ["maternity", "diabetes_management", "opd"],
  "budget_max": 18000,
  "members": 3,
  "preexisting_conditions": ["type_2_diabetes"],
  "preferred_type": "family_floater",
  "sum_insured_min": 500000
}
If a field is not mentioned, omit it or use null. needs can include: maternity, opd, mental_health, ayush, dental, critical_illness, restoration, ncb."""

COMPARISON_SYSTEM = """You are a health insurance advisor. Given structured data for 2-3 policies, generate a plain English comparison summary.
Focus on key differences in coverage, waiting periods, and value. Keep it under 150 words. Be specific with numbers.
Return JSON: {"summary": "your comparison text", "best_for": {"policy_name": "reason"}}"""


class DiscoverRequest(BaseModel):
    query: str


class CompareRequest(BaseModel):
    policy_ids: list[str]


@router.post("/discover")
async def discover_policies(req: DiscoverRequest):
    """Extract requirements from natural language and return ranked policy list."""
    # Step 1: Extract structured requirements from free text
    requirements = llm.chat_json(EXTRACT_REQUIREMENTS_SYSTEM, req.query)
    # Normalize — GPT may return null for optional fields
    requirements["needs"] = requirements.get("needs") or []
    requirements["preexisting_conditions"] = requirements.get("preexisting_conditions") or []

    # Step 2: Build catalog filters
    filters = {}
    needs = requirements.get("needs", [])
    if "maternity" in needs:
        filters["covers_maternity"] = True
    if "opd" in needs:
        filters["covers_opd"] = True
    if "mental_health" in needs:
        filters["covers_mental_health"] = True
    if requirements.get("budget_max"):
        filters["max_premium"] = requirements["budget_max"]
    if requirements.get("preferred_type"):
        filters["policy_type"] = requirements["preferred_type"]

    # Step 3: Fetch and rank policies (filters pre-narrow the catalog)
    all_policies = vector_store.list_catalog_policies(filters if filters else None)
    if not all_policies:
        # Retry without filters if none match (e.g. strict maternity filter on small catalog)
        all_policies = vector_store.list_catalog_policies()
    ranked = ranker.rank(requirements, all_policies)

    return {
        "extracted_requirements": requirements,
        "policies": ranked[:6],
        "total_found": len(ranked),
    }


@router.post("/compare")
async def compare_policies(req: CompareRequest):
    """Return side-by-side comparison of 2-3 policies."""
    if len(req.policy_ids) < 2:
        return {"error": "Please provide at least 2 policy IDs to compare."}
    if len(req.policy_ids) > 3:
        req.policy_ids = req.policy_ids[:3]

    policies = []
    for pid in req.policy_ids:
        policy = vector_store.get_catalog_policy(pid)
        if policy:
            policies.append(policy)

    if len(policies) < 2:
        return {"error": "Could not find the requested policies."}

    # Build comparison matrix
    fields = [
        ("insurer", "Insurer"),
        ("type", "Plan Type"),
        ("premium_min", "Min Premium (₹/yr)"),
        ("premium_max", "Max Premium (₹/yr)"),
        ("sum_insured_min", "Min Sum Insured (₹)"),
        ("sum_insured_max", "Max Sum Insured (₹)"),
        ("waiting_period_preexisting_years", "Pre-existing Wait (years)"),
        ("waiting_period_maternity_months", "Maternity Wait (months)"),
        ("co_pay_percent", "Co-pay (%)"),
        ("room_rent_limit", "Room Rent Limit"),
        ("covers_maternity", "Maternity Coverage"),
        ("covers_opd", "OPD Coverage"),
        ("covers_mental_health", "Mental Health"),
        ("covers_ayush", "AYUSH Coverage"),
        ("covers_dental", "Dental Coverage"),
        ("daycare_procedures", "Daycare Procedures"),
        ("ncb_percent", "No Claim Bonus (%)"),
        ("restoration_benefit", "Restoration Benefit"),
        ("network_hospitals", "Network Hospitals"),
    ]

    comparison_rows = []
    for field_key, field_label in fields:
        row = {"dimension": field_label}
        for p in policies:
            val = p.get(field_key)
            if isinstance(val, bool):
                val = "Yes" if val else "No"
            elif val is None:
                val = "—"
            row[p["name"]] = val
        comparison_rows.append(row)

    # Get GPT comparison summary
    policy_summary = "\n\n".join([
        f"Policy: {p['name']} ({p['insurer']})\n"
        f"Premium: ₹{p.get('premium_min',0):,}–{p.get('premium_max',0):,}/yr | "
        f"PED wait: {p.get('waiting_period_preexisting_years','?')} yrs | "
        f"Maternity: {'Yes' if p.get('covers_maternity') else 'No'} | "
        f"OPD: {'Yes' if p.get('covers_opd') else 'No'} | "
        f"Network: {p.get('network_hospitals',0):,} hospitals | "
        f"Restoration: {'Yes' if p.get('restoration_benefit') else 'No'}"
        for p in policies
    ])

    ai_summary = llm.chat_json(COMPARISON_SYSTEM, f"Compare these policies:\n{policy_summary}")

    return {
        "policies": [{"id": p["id"], "name": p["name"], "insurer": p["insurer"]} for p in policies],
        "comparison_table": comparison_rows,
        "ai_summary": ai_summary.get("summary", ""),
        "best_for": ai_summary.get("best_for", {}),
    }
