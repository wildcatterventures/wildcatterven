-- ============================================================================
-- CAMPUS UNCUT — MIGRATION 004: COLLEGE EMAIL VALIDATION & DOMAIN AFFILIATION
-- ============================================================================

-- 1. Add college_email to people (respondents) table
ALTER TABLE people ADD COLUMN IF NOT EXISTS college_email TEXT;

-- 2. Add email_domains to colleges table
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS email_domains TEXT;

-- 3. Populate known official institutional domains for seeded colleges
UPDATE colleges SET email_domains = 'sfit.ac.in' WHERE short_code = 'SFIT';
UPDATE colleges SET email_domains = 'iitb.ac.in' WHERE short_code = 'IITB';
UPDATE colleges SET email_domains = 'vjti.ac.in,vjti.edu.in' WHERE short_code = 'VJTI';
UPDATE colleges SET email_domains = 'coep.ac.in,coeptech.ac.in' WHERE short_code = 'COEP';
UPDATE colleges SET email_domains = 'spit.ac.in' WHERE short_code = 'SPIT';
UPDATE colleges SET email_domains = 'pict.edu' WHERE short_code = 'PICT';
UPDATE colleges SET email_domains = 'vit.edu.in,vit.ac.in' WHERE short_code = 'VIT-MUM';
UPDATE colleges SET email_domains = 'walchandsangli.ac.in,wce.ac.in' WHERE short_code = 'WCE';
UPDATE colleges SET email_domains = 'stjude.edu,demo.stjude.edu' WHERE id = 'c0000000-0000-0000-0000-000000000002';
UPDATE colleges SET email_domains = 'apex.edu,demo.apex.edu' WHERE id = 'c0000000-0000-0000-0000-000000000003';

-- 4. Update v_college_summary view with email_domains appended
CREATE OR REPLACE VIEW v_college_summary AS
SELECT 
    c.id AS college_id,
    c.name,
    c.short_code,
    c.city,
    c.state,
    c.is_demo,
    c.created_at,
    COALESCE(css.current_score, 100) AS current_score,
    COALESCE(css.total_qualifying_low, 0) AS total_qualifying_low,
    COALESCE(css.total_qualifying_neutral, 0) AS total_qualifying_neutral,
    COALESCE(css.total_qualifying_high, 0) AS total_qualifying_high,
    css.last_event_at,
    COUNT(rs.id) AS total_submitted_sessions,
    COUNT(CASE WHEN rs.respondent_role = 'current_student' THEN 1 END) AS current_student_submissions,
    COUNT(CASE WHEN rs.respondent_role = 'alumnus' THEN 1 END) AS alumni_submissions,
    c.email_domains
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
    c.email_domains;
