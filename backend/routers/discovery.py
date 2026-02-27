"""
Discovery & Comparison routes.
Feature 1: Natural language → hard filter → deterministic weighted ranking
Feature 2: Multi-policy comparison table
"""
from fastapi import APIRouter
from pydantic import BaseModel
from services import llm, vector_store
from services.skills import PolicyRanker, hard_filter

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

CHAT_SYSTEM = """You are a friendly health insurance advisor for Indian health insurance policies.
Analyze the conversation history and decide if you have enough information to recommend policies.
Return ONLY valid JSON:
{
  "ready": true or false,
  "follow_up": "ONE specific follow-up question if not ready, null if ready",
  "extracted": {
    "needs": ["maternity", "opd", "mental_health", "ayush", "dental", "critical_illness"],
    "budget_max": null or annual premium in INR as a number,
    "members": null or number of family members,
    "preexisting_conditions": ["diabetes", "hypertension"],
    "preferred_type": null or "individual" or "family_floater" or "senior_citizen"
  }
}
Rules:
- Set ready=true if user mentioned ANY of: a health coverage need, a medical condition, a budget, or a plan type
- Set ready=false ONLY for completely vague messages like "hi", "help me", "insurance", "hello"
- If ready=false, ask ONE warm and specific follow-up question about what they need
- Extract whatever partial info you can even from incomplete queries"""

CHAT_INTRO_SYSTEM = """You are a warm health insurance advisor. Write a friendly 1-2 sentence response acknowledging what the user asked for, right before showing their policy recommendations. Be specific about what you understood. Do not say "Great!" or "Sure!" — be natural.
Return ONLY valid JSON: {"message": "your response here"}"""

NO_RESULTS_MESSAGE = (
    "No policies in our catalog match all your hard requirements exactly. "
    "Try: relaxing your budget, removing a specific coverage requirement, "
    "or changing the plan type. I can help you find the closest match if you adjust any one criterion."
)


class DiscoverRequest(BaseModel):
    query: str


class CompareRequest(BaseModel):
    policy_ids: list[str]


class DiscoverChatRequest(BaseModel):
    messages: list[dict]  # [{role: "user"|"assistant", content: str}]


def _apply_hard_filter_and_rank(requirements: dict) -> tuple[list[dict], bool]:
    """
    Returns (ranked_policies, used_fallback).
    Applies hard_filter first. If 0 survive, returns ([], False).
    No silent fallback — caller decides how to handle empty.
    """
    requirements["needs"] = requirements.get("needs") or []
    requirements["preexisting_conditions"] = requirements.get("preexisting_conditions") or []

    all_policies = vector_store.list_catalog_policies()
    filtered = hard_filter(all_policies, requirements)

    if not filtered:
        return [], False

    ranked = ranker.rank(requirements, filtered)
    return ranked, False


@router.post("/discover")
async def discover_policies(req: DiscoverRequest):
    """Extract requirements from natural language, apply hard filter, return deterministic ranked list."""
    requirements = llm.chat_json(EXTRACT_REQUIREMENTS_SYSTEM, req.query)
    ranked, _ = _apply_hard_filter_and_rank(requirements)

    if not ranked:
        return {
            "extracted_requirements": requirements,
            "policies": [],
            "total_found": 0,
            "message": NO_RESULTS_MESSAGE,
        }

    return {
        "extracted_requirements": requirements,
        "policies": ranked[:6],
        "total_found": len(ranked),
    }


@router.post("/discover/chat")
async def discover_chat(req: DiscoverChatRequest):
    """
    Conversational policy discovery.
    - Vague input → asks ONE specific follow-up question
    - Specific input → hard filter → deterministic ranked results + AI intro sentence
    """
    if not req.messages:
        return {
            "type": "question",
            "message": "What health coverage are you looking for? Tell me your needs, budget, and family size.",
        }

    conversation = "\n".join([
        f"{m['role'].upper()}: {m['content']}" for m in req.messages
    ])
    result = llm.chat_json(CHAT_SYSTEM, f"Conversation:\n{conversation}")

    if not result.get("ready", False):
        follow_up = (
            result.get("follow_up")
            or "Could you tell me your health coverage needs, annual budget, and how many family members need coverage?"
        )
        return {"type": "question", "message": follow_up}

    requirements = result.get("extracted") or {}
    ranked, _ = _apply_hard_filter_and_rank(requirements)

    if not ranked:
        return {
            "type": "no_results",
            "message": NO_RESULTS_MESSAGE,
            "extracted_requirements": requirements,
            "policies": [],
            "total_found": 0,
        }

    last_user = next(
        (m["content"] for m in reversed(req.messages) if m["role"] == "user"), ""
    )
    intro_result = llm.chat_json(
        CHAT_INTRO_SYSTEM,
        f"User asked: {last_user}\nExtracted needs: {requirements}",
    )
    message = intro_result.get("message") or "Here are the best policies matching your needs:"

    return {
        "type": "results",
        "message": message,
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

    policies = [
        p for pid in req.policy_ids
        if (p := vector_store.get_catalog_policy(pid)) is not None
    ]

    if len(policies) < 2:
        return {"error": "Could not find the requested policies."}

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

    policy_summary = "\n\n".join([
        f"Policy: {p['name']} ({p['insurer']})\n"
        f"Premium: ₹{p.get('premium_min', 0):,}–{p.get('premium_max', 0):,}/yr | "
        f"PED wait: {p.get('waiting_period_preexisting_years', '?')} yrs | "
        f"Maternity: {'Yes' if p.get('covers_maternity') else 'No'} | "
        f"OPD: {'Yes' if p.get('covers_opd') else 'No'} | "
        f"Network: {p.get('network_hospitals', 0):,} hospitals | "
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
