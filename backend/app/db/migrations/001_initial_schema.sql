-- ============================================================================
-- CAMPUS UNCUT — MIGRATION 001: INITIAL RELATIONAL SCHEMA & CONSTRAINTS
-- ============================================================================
-- Description: Creates core 11 tables, constraints, check expressions,
-- composite normalized location index, partial unique index for submitted
-- sessions, and automatic score state initialization.
-- ============================================================================

-- Enable pgcrypto for gen_random_uuid() if not already loaded
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. COLLEGES TABLE
-- Stores institution identity, location, and simulated demo status.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS colleges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    short_code TEXT NOT NULL UNIQUE,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Composite unique expression index: enforces that college name is unique
-- within the same normalized city and state, allowing identical names across
-- different cities/states while preventing local duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS uq_colleges_normalized_name_location
ON colleges (
    LOWER(TRIM(name)),
    LOWER(TRIM(city)),
    LOWER(TRIM(state))
);

-- ----------------------------------------------------------------------------
-- 2. PEOPLE (RESPONDENTS) TABLE
-- Minimal respondent profile with unverified self-declared status.
-- client_uuid is generated in the browser and stored in localStorage.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_uuid UUID NOT NULL UNIQUE,
    display_name TEXT,
    declared_college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
    affiliation TEXT NOT NULL CHECK (affiliation IN ('current_student', 'alumnus')),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_people_declared_college ON people(declared_college_id);

-- ----------------------------------------------------------------------------
-- 3. RATING PARAMETERS TABLE
-- Stores all active rating parameters across academics, living, safety, etc.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parameters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parameters_order ON parameters(display_order);

-- ----------------------------------------------------------------------------
-- 4. QUESTION BANK TABLE
-- Prompts and guidance notes used by conversational & guided rating wizards.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS question_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parameter_id UUID NOT NULL REFERENCES parameters(id) ON DELETE CASCADE,
    prompt_text TEXT NOT NULL,
    guidance_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_question_bank_parameter UNIQUE (parameter_id)
);

CREATE INDEX IF NOT EXISTS idx_question_bank_parameter ON question_bank(parameter_id);

-- ----------------------------------------------------------------------------
-- 5. RATING SESSIONS TABLE
-- Tracks respondent rating attempts and preserves role at time of submission.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rating_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    respondent_id UUID NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
    respondent_role TEXT NOT NULL CHECK (respondent_role IN ('current_student', 'alumnus')),
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'abandoned')),
    calculated_overall_rating NUMERIC(5, 3), -- Unrounded arithmetic mean of numeric answers
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ
);

-- Partial unique index: strictly permits only ONE submitted rating session
-- per respondent profile per college.
CREATE UNIQUE INDEX IF NOT EXISTS uq_submitted_session_per_respondent_college 
ON rating_sessions (college_id, respondent_id) 
WHERE status = 'submitted';

CREATE INDEX IF NOT EXISTS idx_rating_sessions_respondent ON rating_sessions(respondent_id);
CREATE INDEX IF NOT EXISTS idx_rating_sessions_college_status ON rating_sessions(college_id, status);

-- ----------------------------------------------------------------------------
-- 6. RATING ANSWERS TABLE
-- Individual parameter scores (1-10) or explicit No view.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rating_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES rating_sessions(id) ON DELETE CASCADE,
    parameter_id UUID NOT NULL REFERENCES parameters(id) ON DELETE RESTRICT,
    score INT CHECK (score >= 1 AND score <= 10),
    is_no_view BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Enforce either an integer 1-10 OR an explicit No view (never both, never neither)
    CONSTRAINT chk_answer_validity CHECK (
        (is_no_view = TRUE AND score IS NULL) OR
        (is_no_view = FALSE AND score IS NOT NULL)
    ),
    -- Exactly one answer per parameter per session
    CONSTRAINT uq_session_parameter UNIQUE (session_id, parameter_id)
);

CREATE INDEX IF NOT EXISTS idx_rating_answers_session ON rating_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_rating_answers_parameter ON rating_answers(parameter_id);

-- ----------------------------------------------------------------------------
-- 7. COLLEGE SCORE STATE TABLE
-- Maintains current score (starts at 100) and threshold counters for low,
-- neutral, and high categories.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS college_score_state (
    college_id UUID PRIMARY KEY REFERENCES colleges(id) ON DELETE CASCADE,
    current_score INT NOT NULL DEFAULT 100,
    total_qualifying_low INT NOT NULL DEFAULT 0,
    total_qualifying_neutral INT NOT NULL DEFAULT 0,
    total_qualifying_high INT NOT NULL DEFAULT 0,
    last_event_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. SCORE CONTRIBUTIONS TABLE
-- Records the single qualifying contribution per respondent per college.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS score_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    respondent_id UUID NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
    session_id UUID NOT NULL REFERENCES rating_sessions(id) ON DELETE RESTRICT,
    unrounded_rating NUMERIC(5, 3) NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('low', 'neutral', 'high')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Enforces that a respondent profile can only contribute once to a college's score
    CONSTRAINT uq_college_respondent_contribution UNIQUE (college_id, respondent_id)
);

CREATE INDEX IF NOT EXISTS idx_score_contributions_college ON score_contributions(college_id);

-- ----------------------------------------------------------------------------
-- 9. SCORE EVENTS TABLE (AUDIT LOG & IDEMPOTENT THRESHOLD TRACKING)
-- Auditable record of each +/- 1 point threshold adjustment.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS score_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('low', 'high')),
    block_number INT NOT NULL CHECK (block_number > 0),
    score_delta INT NOT NULL CHECK (score_delta IN (-1, 1)),
    score_before INT NOT NULL,
    score_after INT NOT NULL,
    triggered_by_session_id UUID REFERENCES rating_sessions(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Hard idempotency: block N for a college & category can only ever be recorded once
    CONSTRAINT uq_college_category_block UNIQUE (college_id, category, block_number)
);

CREATE INDEX IF NOT EXISTS idx_score_events_college ON score_events(college_id);

-- ----------------------------------------------------------------------------
-- 10. SEARCH EVENTS TABLE (PRIVACY-PRESERVING ANALYTICS)
-- Records query intent and input mode without storing personal identifiers.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS search_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_session_id UUID NOT NULL,
    query TEXT NOT NULL,
    resolved_college_id UUID REFERENCES colleges(id) ON DELETE SET NULL,
    requested_parameter_keys TEXT[],
    input_mode TEXT NOT NULL CHECK (input_mode IN ('text', 'voice')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_events_created_at ON search_events(created_at DESC);

-- ----------------------------------------------------------------------------
-- 11. COLLEGE EMAIL DOMAINS TABLE (RESERVED FOR FUTURE VERIFICATION)
-- Prepared mapping for institutional domain verification in future phases.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS college_email_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    domain TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_college_email_domains_college ON college_email_domains(college_id);

-- ----------------------------------------------------------------------------
-- AUTOMATIC COLLEGE SCORE STATE INITIALIZATION TRIGGER
-- Ensures that whenever a college is inserted, a corresponding score state row
-- is initialized with base score 100 and zero counters.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_init_college_score_state()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO college_score_state (
        college_id,
        current_score,
        total_qualifying_low,
        total_qualifying_neutral,
        total_qualifying_high,
        last_event_at,
        updated_at
    )
    VALUES (
        NEW.id,
        100,
        0,
        0,
        0,
        NOW(),
        NOW()
    )
    ON CONFLICT (college_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_init_college_score_state ON colleges;
CREATE TRIGGER trg_init_college_score_state
AFTER INSERT ON colleges
FOR EACH ROW
EXECUTE FUNCTION fn_init_college_score_state();
