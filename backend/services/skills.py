"""
Specialized reusable AI skills:
- HiddenConditionsDetector: 3-layer hybrid RAG to find implicit policy traps
- CoverageGapScanner: Identify missing coverage areas in a policy
- PolicyRanker: Score and rank catalog policies for a user profile
"""
from __future__ import annotations
from services import embedder, vector_store, llm


# ── Hidden Conditions Detector ───────────────────────────────────────────────

HIDDEN_CONDITIONS_SYSTEM = """You are a senior health insurance claims consultant acting on behalf of the policyholder.
You have access to actual policy wording clauses below (direct answer, definitions, exclusions, and conditions sections).

Your job: Find BOTH what is explicitly stated AND what is IMPLICITLY implied or hidden in the policy language.

Specifically look for these hidden traps:
- room_rent_trap: Room rent cap → proportional deduction of ALL associated charges (surgeon, ICU, medicines all cut proportionally)
- pre_auth_required: Pre-authorization requirement — if missed, claim denied even if procedure is covered
- proportional_deduction: Any clause that proportionally reduces total claim based on a sub-limit breach
- definition_trap: Key term (e.g. "Medically Necessary", "Hospitalization", "Pre-existing Disease") defined narrowly
- waiting_period: Specific illness waiting period or PED waiting period that may apply
- sub_limit: A cap on a specific treatment type even though hospitalization is broadly covered
- documentation: Specific documents required that are non-obvious or time-sensitive
- network_restriction: Non-network hospital co-pay or full exclusion

Return ONLY valid JSON in this exact format:
{
  "verdict": "COVERED | NOT_COVERED | PARTIALLY_COVERED | AMBIGUOUS",
  "practical_claimability": "GREEN | AMBER | RED",
  "confidence": 0-100,
  "plain_answer": "one clear sentence for a layperson",
  "conditions": ["list of explicit conditions that apply"],
  "hidden_conditions": [
    {
      "type": "room_rent_trap|pre_auth_required|proportional_deduction|definition_trap|waiting_period|sub_limit|documentation|network_restriction",
      "description": "plain English explanation of the hidden condition",
      "impact": "concrete impact on the actual claim payout or process"
    }
  ],
  "citations": [
    {"text": "exact quoted clause from policy", "page": 14, "section": "Exclusions"}
  ],
  "recommendation": "specific actionable next step for the policyholder"
}

CRITICAL RULES:
- Only report hidden_conditions where you found actual textual evidence in the provided clauses
- Do NOT hallucinate clauses that are not in the provided text
- If the policy text does not address the question, return AMBIGUOUS with confidence < 40
- GREEN = clearly covered, simple claim process
- AMBER = technically covered but conditions/traps make claiming difficult
- RED = not covered or likely to be denied"""


class HiddenConditionsDetector:
    """Performs 3-layer hybrid RAG and returns structured verdict with hidden conditions."""

    def detect(self, question: str, policy_id: str) -> dict:
        # Embed the question once
        query_emb = embedder.embed_text(question)

        # Layer 1: Hybrid search — semantic + keyword → RRF fusion
        semantic = vector_store.semantic_search(query_emb, policy_id, top_k=8)
        keyword = vector_store.keyword_search(question, policy_id, top_k=8)
        fused = vector_store.rrf_fusion(semantic, keyword, top_k=5)

        # Layer 2: Definitions section
        definitions = vector_store.section_search(
            query_emb, policy_id, ["definitions"], top_k=3
        )

        # Layer 3: Exclusions + Conditions + Limits sections
        exclusions = vector_store.section_search(
            query_emb, policy_id, ["exclusions", "conditions", "limits", "waiting_periods"], top_k=3
        )

        # Build context for LLM
        def format_chunks(chunks: list[dict], label: str) -> str:
            if not chunks:
                return ""
            parts = [f"[{label}]"]
            for c in chunks:
                parts.append(
                    f"[Page {c.get('page_number', '?')} | {c.get('section_type', 'general')}]\n{c['content']}"
                )
            return "\n\n".join(parts)

        context = "\n\n---\n\n".join(filter(None, [
            format_chunks(fused, "DIRECT ANSWER CLAUSES"),
            format_chunks(definitions, "DEFINITIONS"),
            format_chunks(exclusions, "EXCLUSIONS & CONDITIONS"),
        ]))

        user_prompt = f"""QUESTION: {question}

POLICY CLAUSES:
{context}

Analyze the above policy clauses and return the JSON verdict."""

        result = llm.chat_json(HIDDEN_CONDITIONS_SYSTEM, user_prompt)

        # Fallback defaults
        result.setdefault("verdict", "AMBIGUOUS")
        result.setdefault("practical_claimability", "AMBER")
        result.setdefault("confidence", 30)
        result.setdefault("plain_answer", "Unable to determine coverage from the available policy text.")
        result.setdefault("conditions", [])
        result.setdefault("hidden_conditions", [])
        result.setdefault("citations", [])
        result.setdefault("recommendation", "Contact your insurer directly for clarification.")

        return result


# ── Coverage Gap Scanner ─────────────────────────────────────────────────────

COVERAGE_CHECKLIST = [
    ("maternity", "covers_maternity", "Maternity benefit", "HIGH",
     "Maternity hospitalization is a common need. Without this, deliveries are fully out-of-pocket."),
    ("opd", "covers_opd", "OPD (outpatient) coverage", "MEDIUM",
     "Regular doctor visits and prescriptions are not covered. Adds significant annual expense."),
    ("mental_health", "covers_mental_health", "Mental health coverage", "MEDIUM",
     "Psychiatric treatment not covered. IRDAI mandates this but many policies have sub-limits."),
    ("ayush", "covers_ayush", "AYUSH (Ayurveda, Yoga, Unani, Siddha, Homeopathy)", "LOW",
     "Alternative medicine treatments not covered."),
    ("dental", "covers_dental", "Dental treatment", "LOW",
     "Dental procedures (except accident-related) not covered."),
    ("restoration", "restoration_benefit", "Sum insured restoration", "HIGH",
     "If SI is exhausted mid-year, no coverage remains for the rest of the year."),
    ("ncb", "ncb_percent", "No Claim Bonus", "MEDIUM",
     "Policy does not reward claim-free years with coverage increase."),
]


class CoverageGapScanner:
    """Identifies coverage gaps in a catalog policy by comparing metadata against checklist."""

    def scan(self, catalog_policy: dict) -> list[dict]:
        gaps = []
        for feature_key, field, label, severity, description in COVERAGE_CHECKLIST:
            value = catalog_policy.get(field)
            is_missing = (value is False) or (value is None) or (value == 0)
            if is_missing:
                gaps.append({
                    "feature": feature_key,
                    "label": label,
                    "severity": severity,
                    "description": description,
                    "recommendation": f"Consider adding {label} as a rider or switching to a plan that includes it.",
                })

        # Check waiting periods
        ped_years = catalog_policy.get("waiting_period_preexisting_years", 0)
        if ped_years and ped_years >= 4:
            gaps.append({
                "feature": "long_ped_wait",
                "label": "Very long pre-existing disease waiting period",
                "severity": "HIGH",
                "description": f"Pre-existing conditions have a {ped_years}-year waiting period. Any known conditions won't be covered for {ped_years} years.",
                "recommendation": "Look for policies with reduced PED waiting period (2 years) or portability options.",
            })

        # Check room rent
        room_rent = catalog_policy.get("room_rent_limit", "")
        if room_rent and "%" in room_rent:
            gaps.append({
                "feature": "room_rent_cap",
                "label": "Room rent cap (proportional deduction risk)",
                "severity": "HIGH",
                "description": f"Room rent is capped at {room_rent}. If you choose a higher-category room, ALL charges (surgeon, ICU, nursing) are proportionally reduced.",
                "recommendation": "Choose a room within the policy limit, or upgrade to a plan with no room rent restriction.",
            })

        # Check co-pay
        co_pay = catalog_policy.get("co_pay_percent", 0)
        if co_pay and co_pay > 0:
            gaps.append({
                "feature": "co_pay",
                "label": f"Co-payment of {co_pay}%",
                "severity": "MEDIUM",
                "description": f"You pay {co_pay}% of every claim out-of-pocket. On a ₹5L claim, that's ₹{co_pay * 5000:,}.",
                "recommendation": "Consider a plan with 0% co-pay unless the premium saving justifies the risk.",
            })

        return gaps


# ── Policy Ranker ────────────────────────────────────────────────────────────

class PolicyRanker:
    """Scores and ranks catalog policies for a user's extracted requirements."""

    def rank(self, requirements: dict, policies: list[dict]) -> list[dict]:
        scored = []
        for policy in policies:
            score, reasons = self._score(requirements, policy)
            scored.append({**policy, "match_score": score, "match_reasons": reasons})
        return sorted(scored, key=lambda x: x["match_score"], reverse=True)

    def _score(self, req: dict, policy: dict) -> tuple[int, list[str]]:
        score = 50
        reasons = []

        # Budget fit
        budget = req.get("budget_max", 0)
        if budget and policy.get("premium_min"):
            if policy["premium_min"] <= budget:
                score += 15
                reasons.append(f"Within budget (from ₹{policy['premium_min']:,}/yr)")
            else:
                score -= 20
                reasons.append(f"Exceeds budget (starts ₹{policy['premium_min']:,}/yr)")

        # Coverage needs matching
        needs = req.get("needs", [])
        need_map = {
            "maternity": ("covers_maternity", 20),
            "opd": ("covers_opd", 10),
            "mental_health": ("covers_mental_health", 8),
            "ayush": ("covers_ayush", 5),
            "dental": ("covers_dental", 5),
            "critical_illness": ("covers_critical_illness", 15),
        }
        for need in needs:
            for keyword, (field, points) in need_map.items():
                if keyword in need.lower() and policy.get(field):
                    score += points
                    reasons.append(f"Covers {need}")

        # Pre-existing conditions
        preexisting = req.get("preexisting_conditions") or []
        exclusions = policy.get("exclusions") or []
        for condition in preexisting:
            for excl in exclusions:
                if condition.lower() in excl.lower():
                    score -= 25
                    reasons.append(f"May exclude {condition} (check exclusions list)")

        # Waiting period penalty
        ped_years = policy.get("waiting_period_preexisting_years", 4)
        if ped_years <= 2:
            score += 10
            reasons.append(f"Short pre-existing wait ({ped_years} years)")
        elif ped_years >= 4:
            score -= 10
            reasons.append(f"Long pre-existing wait ({ped_years} years)")

        # Network hospitals bonus
        network = policy.get("network_hospitals", 0)
        if network >= 15000:
            score += 8
            reasons.append(f"Large network ({network:,} hospitals)")

        # Restoration benefit
        if policy.get("restoration_benefit"):
            score += 8
            reasons.append("Restoration benefit included")

        return max(0, min(100, score)), reasons
