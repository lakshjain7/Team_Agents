"""Supabase pgvector + tsvector hybrid search operations."""
import os
from supabase import create_client, Client

_client: Client | None = None


def get_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(
            os.getenv("SUPABASE_URL", ""),
            os.getenv("SUPABASE_SERVICE_KEY", ""),
        )
    return _client


# ── Policy metadata CRUD ────────────────────────────────────────────────────

def create_uploaded_policy(name: str, filename: str, insurer: str = "") -> str:
    """Insert a record into uploaded_policies and return its UUID."""
    client = get_client()
    result = client.table("uploaded_policies").insert({
        "user_label": name,
        "filename": filename,
        "insurer": insurer,
        "chunk_count": 0,
    }).execute()
    return result.data[0]["id"]


def update_chunk_count(policy_id: str, count: int):
    get_client().table("uploaded_policies").update(
        {"chunk_count": count}
    ).eq("id", policy_id).execute()


def list_uploaded_policies() -> list[dict]:
    result = get_client().table("uploaded_policies").select(
        "id, user_label, filename, insurer, chunk_count, uploaded_at"
    ).order("uploaded_at", desc=True).execute()
    return result.data


def policy_already_embedded(filename: str) -> bool:
    result = get_client().table("uploaded_policies").select("id").eq(
        "filename", filename
    ).execute()
    return len(result.data) > 0


def get_policy_by_id(policy_id: str) -> dict | None:
    result = get_client().table("uploaded_policies").select("*").eq(
        "id", policy_id
    ).execute()
    return result.data[0] if result.data else None


# ── Chunk insertion ──────────────────────────────────────────────────────────

def insert_chunks(policy_id: str, chunks: list[dict]):
    """Bulk insert chunks. Each dict: {content, embedding, page_number, chunk_index, section_type}"""
    client = get_client()
    rows = [
        {
            "uploaded_policy_id": policy_id,
            "content": c["content"],
            "embedding": c["embedding"],
            "page_number": c["page_number"],
            "chunk_index": c["chunk_index"],
            "section_type": c["section_type"],
        }
        for c in chunks
    ]
    # Insert in batches of 500 to stay under Supabase payload limits
    batch_size = 500
    for i in range(0, len(rows), batch_size):
        client.table("policy_chunks").insert(rows[i : i + batch_size]).execute()


# ── Semantic search (pgvector cosine similarity) ─────────────────────────────

def semantic_search(query_embedding: list[float], policy_id: str, top_k: int = 8) -> list[dict]:
    """Call Supabase RPC for cosine similarity search."""
    result = get_client().rpc("match_chunks_direct", {
        "query_embedding": query_embedding,
        "policy_id_filter": policy_id,
        "match_count": top_k,
    }).execute()
    return result.data or []


# ── Keyword search (PostgreSQL tsvector / BM25-style) ───────────────────────

def keyword_search(query_text: str, policy_id: str, top_k: int = 8) -> list[dict]:
    """Call Supabase RPC for full-text keyword search (plainto_tsquery — handles plain English)."""
    if not query_text.strip():
        return []
    try:
        result = get_client().rpc("keyword_search_chunks", {
            "search_query": query_text,
            "policy_id_filter": policy_id,
            "match_count": top_k,
        }).execute()
        return result.data or []
    except Exception:
        return []


# ── Section-filtered search ──────────────────────────────────────────────────

def section_search(
    query_embedding: list[float],
    policy_id: str,
    section_types: list[str],
    top_k: int = 3,
) -> list[dict]:
    """Semantic search restricted to specific section types."""
    result = get_client().rpc("match_chunks_by_section", {
        "query_embedding": query_embedding,
        "policy_id_filter": policy_id,
        "section_filter": section_types,
        "match_count": top_k,
    }).execute()
    return result.data or []


# ── Reciprocal Rank Fusion ───────────────────────────────────────────────────

def rrf_fusion(
    semantic_results: list[dict],
    keyword_results: list[dict],
    top_k: int = 5,
    k: int = 60,
) -> list[dict]:
    """Merge semantic and keyword results using Reciprocal Rank Fusion."""
    scores: dict[str, float] = {}
    chunks: dict[str, dict] = {}

    for rank, chunk in enumerate(semantic_results):
        cid = chunk["id"]
        scores[cid] = scores.get(cid, 0.0) + 1.0 / (k + rank + 1)
        chunks[cid] = chunk

    for rank, chunk in enumerate(keyword_results):
        cid = chunk["id"]
        scores[cid] = scores.get(cid, 0.0) + 1.0 / (k + rank + 1)
        chunks[cid] = chunk

    ranked_ids = sorted(scores, key=lambda x: scores[x], reverse=True)
    return [chunks[cid] for cid in ranked_ids[:top_k]]


# ── Catalog (structured policy metadata) ────────────────────────────────────

def list_catalog_policies(filters: dict | None = None) -> list[dict]:
    client = get_client()
    query = client.table("insurance_policies").select("*")
    if filters:
        if filters.get("covers_maternity"):
            query = query.eq("covers_maternity", True)
        if filters.get("covers_opd"):
            query = query.eq("covers_opd", True)
        if filters.get("covers_mental_health"):
            query = query.eq("covers_mental_health", True)
        if filters.get("max_premium"):
            query = query.lte("premium_max", filters["max_premium"])
        if filters.get("policy_type"):
            query = query.eq("type", filters["policy_type"])
    result = query.execute()
    return result.data or []


def get_catalog_policy(policy_id: str) -> dict | None:
    result = get_client().table("insurance_policies").select("*").eq(
        "id", policy_id
    ).execute()
    return result.data[0] if result.data else None


def insert_catalog_policy(policy: dict) -> str:
    result = get_client().table("insurance_policies").insert(policy).execute()
    return result.data[0]["id"]
