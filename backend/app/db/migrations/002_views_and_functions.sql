-- ============================================================================
-- CAMPUS UNCUT — MIGRATION 002: STANDARD VIEWS & REPORTING CONTRACTS
-- ============================================================================
-- Description: Creates standard PostgreSQL views for public college statistics,
-- parameter-level rating aggregates, and score distribution profiles.
-- NOTE: Uses standard CREATE VIEW (not materialized views) to ensure live updates
-- without requiring REFRESH statements.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PARAMETER STATS VIEW (v_college_parameter_stats)
-- Aggregates parameter metrics across all submitted rating sessions.
-- Excludes 'in_progress' and 'abandoned' sessions.
-- Separates numeric response counts from explicit No View counts.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_college_parameter_stats AS
SELECT 
    rs.college_id,
    c.is_demo AS is_demo_college,
    ra.parameter_id,
    p.key AS parameter_key,
    p.name AS parameter_name,
    p.category AS parameter_category,
    p.display_order,
    COUNT(ra.score) AS numeric_response_count,
    COUNT(CASE WHEN ra.is_no_view THEN 1 END) AS no_view_count,
    ROUND(AVG(ra.score)::numeric, 2) AS average_score
FROM rating_answers ra
JOIN rating_sessions rs ON rs.id = ra.session_id
JOIN colleges c ON c.id = rs.college_id
JOIN parameters p ON p.id = ra.parameter_id
WHERE rs.status = 'submitted'
GROUP BY 
    rs.college_id, 
    c.is_demo, 
    ra.parameter_id, 
    p.key, 
    p.name, 
    p.category, 
    p.display_order;

-- ----------------------------------------------------------------------------
-- 2. PARAMETER SCORE DISTRIBUTIONS VIEW (v_college_parameter_distributions)
-- Provides breakdown of score frequencies (1 through 10) per parameter
-- per college for submitted sessions. Enables rendering distribution histograms.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_college_parameter_distributions AS
SELECT 
    rs.college_id,
    c.is_demo AS is_demo_college,
    ra.parameter_id,
    p.key AS parameter_key,
    ra.score AS rating_score,
    COUNT(*) AS frequency
FROM rating_answers ra
JOIN rating_sessions rs ON rs.id = ra.session_id
JOIN colleges c ON c.id = rs.college_id
JOIN parameters p ON p.id = ra.parameter_id
WHERE rs.status = 'submitted' 
  AND ra.score IS NOT NULL
GROUP BY 
    rs.college_id, 
    c.is_demo, 
    ra.parameter_id, 
    p.key, 
    ra.score;

-- ----------------------------------------------------------------------------
-- 3. COLLEGE SUMMARY VIEW (v_college_summary)
-- Combines college metadata, score state, and submission counts partitioned
-- by student vs alumni role.
-- ----------------------------------------------------------------------------
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
    COUNT(CASE WHEN rs.respondent_role = 'alumnus' THEN 1 END) AS alumni_submissions
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
    css.last_event_at;
