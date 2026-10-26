-- ============================================================================
-- MIGRATION 004: OPTIONAL SEED DEMO COLLEGES (REVIEW ONLY - DO NOT AUTO-EXECUTE)
-- ============================================================================
-- This migration is an optional, separately reviewable script documenting the
-- intended seed data for the two simulated demo campuses (St. Jude and Apex)
-- referenced in Migration 003.
--
-- Per project instructions, this migration is NOT executed against the live
-- database. The live database preserves genuine production institutions only.
-- ============================================================================

-- 1. INSERT DEMO COLLEGES (IF DESIRED FOR EVALUATOR SHOWCASE)
INSERT INTO colleges (id, name, short_code, city, state, is_demo, email_domains)
VALUES
    (
        'c0000000-0000-0000-0000-000000000002',
        'St. Jude Institute of Technology (Demo)',
        'JUDE-DEMO',
        'Mumbai',
        'Maharashtra',
        TRUE,
        'stjude.demo.edu.in'
    ),
    (
        'c0000000-0000-0000-0000-000000000003',
        'Apex Technical Academy (Demo)',
        'APEX-DEMO',
        'Pune',
        'Maharashtra',
        TRUE,
        'apex.demo.edu.in'
    )
ON CONFLICT (short_code) DO UPDATE SET
    name = EXCLUDED.name,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    is_demo = EXCLUDED.is_demo;

-- 2. INITIALIZE DEMO SCORE STATES (IF SEEDING DEMO DATA)
INSERT INTO college_score_state (
    college_id, current_score, total_qualifying_low, total_qualifying_neutral,
    total_qualifying_high, last_event_at, updated_at
)
VALUES
    ('c0000000-0000-0000-0000-000000000002'::uuid, 100, 19, 0, 0, NOW(), NOW()),
    ('c0000000-0000-0000-0000-000000000003'::uuid, 100, 0, 0, 19, NOW(), NOW())
ON CONFLICT (college_id) DO UPDATE SET
    current_score = EXCLUDED.current_score,
    total_qualifying_low = EXCLUDED.total_qualifying_low,
    total_qualifying_neutral = EXCLUDED.total_qualifying_neutral,
    total_qualifying_high = EXCLUDED.total_qualifying_high,
    updated_at = NOW();
