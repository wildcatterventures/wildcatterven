-- ============================================================================
-- CAMPUS UNCUT MIGRATION 007: COLLEGE STUDENT EXPERIENCE AVERAGE AGGREGATE
-- ============================================================================
-- Description:
--   Updates v_college_summary view to append student_experience_average as
--   column 18, calculating AVG(rs.calculated_overall_rating) rounded to 2 decimal places
--   strictly for submitted rating sessions with valid, non-null overall ratings.
--
-- Safety Guarantees:
--   1. Preserves existing columns 1-17 in identical order, naming, and data types.
--   2. Appends column 18 at the end: CREATE OR REPLACE VIEW safe.
--   3. Does NOT alter underlying tables, constraints, or historical data.
--   4. Preserves view owner (postgres) and permissions (anon, authenticated, service_role).
--   5. Returns NULL when no valid submitted session ratings exist.
-- ============================================================================

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
    c.category,                                                                       -- 17. text
    ROUND(AVG(rs.calculated_overall_rating)::numeric, 2) AS student_experience_average -- 18. numeric
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

-- Restore view owner and access privileges
ALTER VIEW v_college_summary OWNER TO postgres;
GRANT ALL ON v_college_summary TO postgres;
GRANT SELECT ON v_college_summary TO anon, authenticated, service_role;

