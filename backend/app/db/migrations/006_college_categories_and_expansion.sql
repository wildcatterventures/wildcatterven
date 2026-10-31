-- ============================================================================
-- CAMPUS UNCUT — MIGRATION 006: COLLEGE CATEGORIES & EXPANSION
-- ============================================================================
-- Description: Adds stream category classification ('engineering', 'medical', 
-- 'mba', 'arts') to colleges and updates v_college_summary view.
-- Idempotent, transaction-safe, and rerunnable.
-- Executed on production: October 31, 2026
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. ADD CATEGORY COLUMN WITH SAFE DEFAULT
-- ----------------------------------------------------------------------------
ALTER TABLE colleges 
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'engineering';

-- ----------------------------------------------------------------------------
-- 2. ADD CHECK CONSTRAINT FOR VALID CATEGORY VALUES
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_college_category'
    ) THEN
        ALTER TABLE colleges 
        ADD CONSTRAINT chk_college_category 
        CHECK (category IN ('engineering', 'medical', 'mba', 'arts'));
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. ENSURE ALL EXISTING COLLEGES ARE TAGGED AS 'engineering'
-- ----------------------------------------------------------------------------
UPDATE colleges 
SET category = 'engineering' 
WHERE category IS NULL OR category = 'engineering';

-- ----------------------------------------------------------------------------
-- 4. CREATE ACCELERATION INDEX
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_colleges_category ON colleges(category);

-- ----------------------------------------------------------------------------
-- 5. UPDATE PUBLIC VIEW (v_college_summary)
-- NOTE: Preserves existing columns 1-16 in exact order; appends category as column 17.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_college_summary AS
SELECT 
    c.id AS college_id,                                                               -- 1. uuid
    c.name,                                                                           -- 2. text
    c.short_code,                                                                     -- 3. text
    c.city,                                                                           -- 4. text
    c.state,                                                                          -- 5. text
    c.is_demo,                                                                        -- 6. boolean
    c.created_at,                                                                     -- 7. timestamptz
    COALESCE(css.current_score, 100) AS current_score,                                 -- 8. integer
    COALESCE(css.total_qualifying_low, 0) AS total_qualifying_low,                     -- 9. integer
    COALESCE(css.total_qualifying_neutral, 0) AS total_qualifying_neutral,             -- 10. integer
    COALESCE(css.total_qualifying_high, 0) AS total_qualifying_high,                   -- 11. integer
    css.last_event_at,                                                                -- 12. timestamptz
    COUNT(rs.id) AS total_submitted_sessions,                                         -- 13. bigint
    COUNT(CASE WHEN rs.respondent_role = 'current_student' THEN 1 END) AS current_student_submissions, -- 14. bigint
    COUNT(CASE WHEN rs.respondent_role = 'alumnus' THEN 1 END) AS alumni_submissions,  -- 15. bigint
    c.email_domains,                                                                  -- 16. text
    c.category                                                                        -- 17. text (NEW FINAL COLUMN)
FROM colleges c
LEFT JOIN college_score_state css ON css.college_id = c.id
LEFT JOIN rating_sessions rs ON rs.college_id = c.id AND rs.status = 'submitted'
GROUP BY 
    c.id, 
    c.name, 
    c.short_code, 
    c.city, 
    c.state, 
    c.is_demo, 
    c.created_at,
    css.current_score, 
    css.total_qualifying_low, 
    css.total_qualifying_neutral, 
    css.total_qualifying_high, 
    css.last_event_at,
    c.email_domains,
    c.category;

-- ----------------------------------------------------------------------------
-- 6. PRESERVE VIEW OWNER AND PERMISSIONS
-- ----------------------------------------------------------------------------
ALTER VIEW v_college_summary OWNER TO postgres;
GRANT ALL ON v_college_summary TO postgres;
GRANT SELECT ON v_college_summary TO anon, authenticated, service_role;

COMMIT;

