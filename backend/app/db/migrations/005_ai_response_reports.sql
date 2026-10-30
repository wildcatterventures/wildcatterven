-- ============================================================================
-- CAMPUS UNCUT — MIGRATION 005: AI ASSISTANT USER REPORTS (SAFETY & COMPLIANCE)
-- ============================================================================
-- Description: Lightweight table to store user-submitted reports for
-- objectionable or policy-violating AI assistant responses. Fulfills Google Play
-- Generative AI Policy compliance requirements without third-party data tracking.
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_response_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_content TEXT NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('sexually_explicit', 'hate_or_harassment', 'violence_or_harm', 'inappropriate', 'other')),
    user_notes TEXT,
    client_uuid UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for auditing recent reports
CREATE INDEX IF NOT EXISTS idx_ai_response_reports_created ON ai_response_reports(created_at DESC);

-- Index for client abuse prevention and lookup
CREATE INDEX IF NOT EXISTS idx_ai_response_reports_client ON ai_response_reports(client_uuid);

-- ----------------------------------------------------------------------------
-- SECURITY & ACCESS RESTRICTIONS (SUPABASE POSTGREST HARDENING)
-- ----------------------------------------------------------------------------
-- Enable Row Level Security (RLS) with zero public policies. This ensures that
-- Supabase's auto-generated Data API (PostgREST) strictly rejects any anonymous
-- or authenticated HTTP requests to this table. The FastAPI backend connects
-- via direct asyncpg connection pool as the privileged database owner role,
-- bypassing RLS to safely record user reports.
ALTER TABLE public.ai_response_reports ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.ai_response_reports
FROM PUBLIC, anon, authenticated;
