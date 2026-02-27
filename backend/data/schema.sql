-- PolicyAI Supabase Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ── Structured policy catalog ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insurance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  insurer TEXT NOT NULL,
  type TEXT CHECK (type IN ('individual','family_floater','senior_citizen','critical_illness')),
  premium_min INTEGER,
  premium_max INTEGER,
  sum_insured_min INTEGER,
  sum_insured_max INTEGER,
  waiting_period_general INTEGER DEFAULT 30,
  waiting_period_preexisting_years INTEGER DEFAULT 4,
  waiting_period_maternity_months INTEGER,
  co_pay_percent INTEGER DEFAULT 0,
  room_rent_limit TEXT,
  covers_maternity BOOLEAN DEFAULT FALSE,
  covers_opd BOOLEAN DEFAULT FALSE,
  covers_ayush BOOLEAN DEFAULT FALSE,
  covers_mental_health BOOLEAN DEFAULT FALSE,
  covers_dental BOOLEAN DEFAULT FALSE,
  daycare_procedures INTEGER DEFAULT 0,
  ncb_percent INTEGER DEFAULT 0,
  restoration_benefit BOOLEAN DEFAULT FALSE,
  network_hospitals INTEGER DEFAULT 0,
  exclusions TEXT[],
  highlights TEXT[],
  irda_uin TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Uploaded policy documents tracker ────────────────────────────────────
CREATE TABLE IF NOT EXISTS uploaded_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_policy_id UUID REFERENCES insurance_policies(id),
  user_label TEXT,
  filename TEXT NOT NULL,
  insurer TEXT DEFAULT '',
  chunk_count INTEGER DEFAULT 0,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Policy text chunks with dual search support ───────────────────────────
CREATE TABLE IF NOT EXISTS policy_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_policy_id UUID REFERENCES uploaded_policies(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  page_number INTEGER,
  chunk_index INTEGER,
  section_type TEXT DEFAULT 'general'
    CHECK (section_type IN ('definitions','exclusions','coverage','conditions','waiting_periods','limits','claims','general')),
  -- Auto-generated tsvector for keyword search (BM25-style)
  content_tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', content)) STORED
);

-- ── Indexes ───────────────────────────────────────────────────────────────
-- IVFFlat index for pgvector cosine similarity (fast ANN search)
CREATE INDEX IF NOT EXISTS policy_chunks_embedding_idx
  ON policy_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- GIN index for full-text keyword search
CREATE INDEX IF NOT EXISTS policy_chunks_tsv_idx
  ON policy_chunks USING GIN(content_tsv);

-- Composite index for section-filtered queries
CREATE INDEX IF NOT EXISTS policy_chunks_policy_section_idx
  ON policy_chunks (uploaded_policy_id, section_type);

-- ── RPC: Direct semantic similarity search ───────────────────────────────
CREATE OR REPLACE FUNCTION match_chunks_direct(
  query_embedding VECTOR(1536),
  policy_id_filter UUID,
  match_count INT DEFAULT 8
)
RETURNS TABLE(id UUID, content TEXT, page_number INT, section_type TEXT, similarity FLOAT)
LANGUAGE SQL STABLE AS $$
  SELECT id, content, page_number, section_type,
    1 - (embedding <=> query_embedding) AS similarity
  FROM policy_chunks
  WHERE uploaded_policy_id = policy_id_filter
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ── RPC: Section-filtered semantic search ────────────────────────────────
CREATE OR REPLACE FUNCTION match_chunks_by_section(
  query_embedding VECTOR(1536),
  policy_id_filter UUID,
  section_filter TEXT[],
  match_count INT DEFAULT 3
)
RETURNS TABLE(id UUID, content TEXT, page_number INT, section_type TEXT, similarity FLOAT)
LANGUAGE SQL STABLE AS $$
  SELECT id, content, page_number, section_type,
    1 - (embedding <=> query_embedding) AS similarity
  FROM policy_chunks
  WHERE uploaded_policy_id = policy_id_filter
    AND section_type = ANY(section_filter)
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ── RPC: Full-text keyword search ────────────────────────────────────────
CREATE OR REPLACE FUNCTION keyword_search_chunks(
  search_query TEXT,
  policy_id_filter UUID,
  match_count INT DEFAULT 8
)
RETURNS TABLE(id UUID, content TEXT, page_number INT, section_type TEXT, rank FLOAT)
LANGUAGE SQL STABLE AS $$
  SELECT id, content, page_number, section_type,
    ts_rank_cd(content_tsv, query) AS rank
  FROM policy_chunks,
    plainto_tsquery('english', search_query) query
  WHERE uploaded_policy_id = policy_id_filter
    AND content_tsv @@ query
  ORDER BY rank DESC
  LIMIT match_count;
$$;
