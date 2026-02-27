"""
Tool implementations exposed as OpenAI function-call schemas.
Each tool is a Python function + its JSON schema for the LLM to call.
"""
from __future__ import annotations
import json
from services import vector_store, embedder, llm

# ── OpenAI function-call schemas ─────────────────────────────────────────────

TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "semantic_search",
            "description": "Find policy chunks semantically similar to query using pgvector cosine similarity.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query text"},
                    "policy_id": {"type": "string", "description": "UUID of the uploaded policy document"},
                    "top_k": {"type": "integer", "description": "Number of results to return", "default": 8},
                },
                "required": ["query", "policy_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "keyword_search",
            "description": "Find policy chunks by exact keyword match using PostgreSQL full-text search. Best for legal terms, clause codes, procedure names.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Keywords to search for"},
                    "policy_id": {"type": "string", "description": "UUID of the uploaded policy document"},
                    "top_k": {"type": "integer", "description": "Number of results to return", "default": 8},
                },
                "required": ["query", "policy_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "section_search",
            "description": "Find chunks from specific policy sections (definitions, exclusions, conditions, limits). Use for cross-referencing definitions and exclusions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                    "policy_id": {"type": "string"},
                    "section_types": {
                        "type": "array",
                        "items": {"type": "string", "enum": ["definitions", "exclusions", "conditions", "waiting_periods", "limits", "coverage", "claims", "general"]},
                        "description": "Section types to restrict search to",
                    },
                    "top_k": {"type": "integer", "default": 3},
                },
                "required": ["query", "policy_id", "section_types"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "filter_catalog",
            "description": "Filter insurance catalog policies by structured requirements.",
            "parameters": {
                "type": "object",
                "properties": {
                    "covers_maternity": {"type": "boolean"},
                    "covers_opd": {"type": "boolean"},
                    "covers_mental_health": {"type": "boolean"},
                    "max_premium": {"type": "integer", "description": "Maximum annual premium in INR"},
                    "policy_type": {"type": "string", "enum": ["individual", "family_floater", "senior_citizen", "critical_illness"]},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_policy_metadata",
            "description": "Fetch full structured metadata for a catalog policy (premiums, waiting periods, exclusions, features).",
            "parameters": {
                "type": "object",
                "properties": {
                    "policy_id": {"type": "string", "description": "UUID from insurance_policies catalog table"},
                },
                "required": ["policy_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "extract_conditions",
            "description": "Extract diagnosed medical conditions and pre-existing diseases from free text or medical report content.",
            "parameters": {
                "type": "object",
                "properties": {
                    "text": {"type": "string", "description": "Medical report text or user-described conditions"},
                },
                "required": ["text"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "calculate_claim_score",
            "description": "Compute a claim feasibility score (0-100) based on verdict and analysis results.",
            "parameters": {
                "type": "object",
                "properties": {
                    "verdict": {"type": "string", "enum": ["COVERED", "NOT_COVERED", "PARTIALLY_COVERED", "AMBIGUOUS"]},
                    "hidden_conditions_count": {"type": "integer"},
                    "has_pre_auth_required": {"type": "boolean"},
                    "has_sub_limit": {"type": "boolean"},
                    "has_waiting_period": {"type": "boolean"},
                },
                "required": ["verdict"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_document_checklist",
            "description": "Return standard required documents list for a given claim type.",
            "parameters": {
                "type": "object",
                "properties": {
                    "claim_type": {"type": "string", "description": "e.g. hospitalization, surgery, OPD, maternity, critical_illness"},
                },
                "required": ["claim_type"],
            },
        },
    },
]


# ── Tool implementations ─────────────────────────────────────────────────────

def run_tool(name: str, args: dict) -> dict:
    """Dispatch tool call by name and return result as dict."""
    if name == "semantic_search":
        emb = embedder.embed_text(args["query"])
        results = vector_store.semantic_search(emb, args["policy_id"], args.get("top_k", 8))
        return {"chunks": results}

    if name == "keyword_search":
        results = vector_store.keyword_search(args["query"], args["policy_id"], args.get("top_k", 8))
        return {"chunks": results}

    if name == "section_search":
        emb = embedder.embed_text(args["query"])
        results = vector_store.section_search(emb, args["policy_id"], args["section_types"], args.get("top_k", 3))
        return {"chunks": results}

    if name == "filter_catalog":
        policies = vector_store.list_catalog_policies(filters=args)
        return {"policies": policies}

    if name == "get_policy_metadata":
        policy = vector_store.get_catalog_policy(args["policy_id"])
        return {"policy": policy}

    if name == "extract_conditions":
        result = llm.chat_json(
            system=(
                "You are a medical coding specialist. Extract all diagnosed medical conditions, "
                "pre-existing diseases, and chronic conditions from the text. "
                "Return JSON: {conditions: [{name: string, icd_hint: string, severity: 'chronic'|'acute'|'unknown'}]}"
            ),
            user=args["text"],
        )
        return result

    if name == "calculate_claim_score":
        verdict = args.get("verdict", "AMBIGUOUS")
        base = {"COVERED": 85, "PARTIALLY_COVERED": 55, "AMBIGUOUS": 35, "NOT_COVERED": 10}.get(verdict, 35)
        deductions = 0
        if args.get("has_pre_auth_required"):
            deductions += 10
        if args.get("has_sub_limit"):
            deductions += 8
        if args.get("has_waiting_period"):
            deductions += 12
        hidden = args.get("hidden_conditions_count", 0)
        deductions += min(hidden * 5, 20)
        score = max(5, min(98, base - deductions))
        return {"score": score}

    if name == "get_document_checklist":
        claim_type = args.get("claim_type", "hospitalization").lower()
        checklists = {
            "hospitalization": [
                "Duly filled claim form",
                "Discharge summary with diagnosis",
                "All original hospital bills and receipts",
                "Doctor's prescription and treatment notes",
                "Investigation reports (lab, radiology)",
                "Pre-authorization approval letter (if cashless)",
                "Policy copy and photo ID",
            ],
            "surgery": [
                "Duly filled claim form",
                "Surgeon's notes and operation notes",
                "Anesthesiologist's report",
                "Discharge summary",
                "All original bills (hospital, surgeon, anesthesia)",
                "Pre-authorization approval",
                "Histopathology report (if applicable)",
                "Policy copy and photo ID",
            ],
            "maternity": [
                "Duly filled claim form",
                "Delivery summary / discharge summary",
                "Pediatrician's certificate for newborn",
                "All original bills",
                "Doctor's certificate of delivery",
                "Policy copy and photo ID",
            ],
            "opd": [
                "Doctor's prescription",
                "OPD receipt/bill",
                "Investigation reports (if any)",
                "Policy copy",
            ],
            "critical_illness": [
                "Duly filled claim form",
                "Specialist's diagnosis certificate",
                "Histopathology / biopsy reports",
                "Hospital records confirming diagnosis",
                "Policy copy and photo ID",
            ],
        }
        docs = checklists.get(claim_type, checklists["hospitalization"])
        return {"required_documents": docs}

    return {"error": f"Unknown tool: {name}"}
