-- ============================================================================
-- CAMPUS UNCUT — MIGRATION 003: SEED PARAMETERS & DEMONSTRATION SCENARIOS
-- ============================================================================
-- Description:
-- 1. Seeds all 25 approved rating parameters with question bank prompts.
-- 2. Seeds real college stub (St. Francis Institute of Technology - SFIT)
--    with 0 reviews/ratings (reviews are NEVER fabricated for real colleges).
-- 3. Seeds Demo College 1: St. Jude Institute of Technology (Demo) with 19
--    simulated low-rating contributions (score remains 100).
-- 4. Seeds Demo College 2: Apex Technical Academy (Demo) with 19 simulated
--    high-rating contributions (score remains 100).
-- IDEMPOTENCY: Safe to rerun multiple times without duplicating records.
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Starting Campus Uncut parameter and scenario seeding...';
END $$;

-- ----------------------------------------------------------------------------
-- 1. SEED ALL 25 RATING PARAMETERS
-- 18 core original parameters + 7 remote/residential campus parameters
-- ----------------------------------------------------------------------------
INSERT INTO parameters (id, key, name, category, description, display_order, is_active)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'food', 'College food and affordability', 'Campus Living', 'Quality, hygiene, variety, and cost of cafeteria and mess meals.', 1, TRUE),
    ('a0000000-0000-0000-0000-000000000002', 'ragging', 'Ragging prevention & safety', 'Campus Safety', 'Freedom from ragging, coercive senior rituals, and harassment (10 = Completely safe/zero ragging).', 2, TRUE),
    ('a0000000-0000-0000-0000-000000000003', 'professor_quality', 'Professor quality & accessibility', 'Academics', 'Faculty teaching standards, intellectual mentorship, and availability.', 3, TRUE),
    ('a0000000-0000-0000-0000-000000000004', 'toilet_quality', 'Toilet and washroom quality', 'Campus Living', 'Cleanliness, running water, hygiene supplies, and restroom maintenance.', 4, TRUE),
    ('a0000000-0000-0000-0000-000000000005', 'classroom_quality', 'Classroom & lab quality', 'Academics', 'Acoustics, ventilation, lab equipment, computing resources, and seating.', 5, TRUE),
    ('a0000000-0000-0000-0000-000000000006', 'student_culture', 'Quality of fellow students & culture', 'Campus Culture', 'Peer collaboration, diversity, intellectual drive, and community warmth.', 6, TRUE),
    ('a0000000-0000-0000-0000-000000000007', 'campus_placements', 'Campus placements & career support', 'Career', 'On-campus recruitment, internship assistance, CTC transparency, and career cell.', 7, TRUE),
    ('a0000000-0000-0000-0000-000000000008', 'womens_safety', 'Women''s safety & campus security', 'Campus Safety', 'Security guards, lighting, CCTV, night safety, and support for female students.', 8, TRUE),
    ('a0000000-0000-0000-0000-000000000009', 'professor_harassment', 'Harassment & discrimination by professors', 'Campus Safety', 'Freedom from academic victimisation, bias, or personal harassment (10 = Completely free).', 9, TRUE),
    ('a0000000-0000-0000-0000-000000000010', 'student_bullying', 'Student bullying & peer harassment', 'Campus Safety', 'Safety from ostracisation, physical/verbal bullying, and peer discrimination.', 10, TRUE),
    ('a0000000-0000-0000-0000-000000000011', 'party_scene', 'Party scene & nightlife', 'Campus Culture', 'Festivals, music culture, social life, and weekend vitality.', 11, TRUE),
    ('a0000000-0000-0000-0000-000000000012', 'alcohol_culture', 'Alcohol & substance culture', 'Campus Culture', 'Sensible, non-coercive social environment regarding alcohol and substance use.', 12, TRUE),
    ('a0000000-0000-0000-0000-000000000013', 'college_management', 'College management & complaint resolution', 'Governance', 'Administrative responsiveness, fee clarity, and willingness to resolve grievances.', 13, TRUE),
    ('a0000000-0000-0000-0000-000000000014', 'academic_freedom', 'Academic freedom & grading fairness', 'Academics', 'Open enquiry, fair examinations, objective grading, and intellectual discourse.', 14, TRUE),
    ('a0000000-0000-0000-0000-000000000015', 'freedom_of_expression', 'Freedom of expression & student voice', 'Governance', 'Ability to question decisions, publish independent media, and voice concerns.', 15, TRUE),
    ('a0000000-0000-0000-0000-000000000016', 'infrastructure', 'Campus infrastructure & utilities', 'Infrastructure', 'Libraries, sports grounds, green spaces, elevators, and general building upkeep.', 16, TRUE),
    ('a0000000-0000-0000-0000-000000000017', 'hostel_quality', 'Hostel quality & curfew policies', 'Campus Living', 'Room cleanliness, occupancy density, hostel amenities, and fairness of curfews.', 17, TRUE),
    ('a0000000-0000-0000-0000-000000000018', 'alumni_interaction', 'Alumni interaction & networking', 'Career', 'Active alumni mentoring, chapter events, and industry networking access.', 18, TRUE),
    ('a0000000-0000-0000-0000-000000000019', 'drinking_water', 'Clean drinking water access', 'Remote/Residential', 'Availability of safe RO drinking water, water coolers, and filter maintenance.', 19, TRUE),
    ('a0000000-0000-0000-0000-000000000020', 'internet', 'Internet & Wi-Fi connectivity', 'Remote/Residential', 'Campus Wi-Fi speed, reliability, hostel coverage, and cellular reception.', 20, TRUE),
    ('a0000000-0000-0000-0000-000000000021', 'electricity', 'Electricity & power backup', 'Remote/Residential', 'Power continuity, hostel backup generators, and protection against outages.', 21, TRUE),
    ('a0000000-0000-0000-0000-000000000022', 'transportation', 'Transportation & city connectivity', 'Remote/Residential', 'College shuttles, bus routes, proximity to rail/metro, and night transit.', 22, TRUE),
    ('a0000000-0000-0000-0000-000000000023', 'hospital_access', 'Emergency healthcare & hospital access', 'Remote/Residential', 'Campus dispensary, 24/7 ambulance, emergency protocol, and nearby hospitals.', 23, TRUE),
    ('a0000000-0000-0000-0000-000000000024', 'hostel_conditions', 'Hostel hygiene, maintenance & hot water', 'Remote/Residential', 'Geyser functioning, plumbing repairs, pest control, and laundry facilities.', 24, TRUE),
    ('a0000000-0000-0000-0000-000000000025', 'complaint_handling', 'Complaint handling & escalation speed', 'Remote/Residential', 'Turnaround time for hostel maintenance, safety issues, and student appeals.', 25, TRUE)
ON CONFLICT (key) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active;

-- ----------------------------------------------------------------------------
-- 2. SEED QUESTION BANK PROMPTS
-- Structured conversational prompts for each of the 25 parameters.
-- ----------------------------------------------------------------------------
INSERT INTO question_bank (id, parameter_id, prompt_text, guidance_notes)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'How would you rate the quality, hygiene, and affordability of college canteen and mess food?', 'Consider meal prices, nutritional balance, cleanliness, and canteen options.'),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'How safe is the campus from ragging, intimidation, or coercive senior-junior practices?', '10 means completely safe with zero ragging; 1 indicates severe or tolerated ragging.'),
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'How accessible, knowledgeable, and supportive are faculty members outside lectures?', 'Consider mentorship quality, office hours availability, and pedagogical skill.'),
    ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'How clean, well-maintained, and adequately supplied are the campus restrooms?', 'Focus on running water, cleanliness frequency, soap availability, and hygiene standards.'),
    ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', 'How modern and functional are the classrooms, laboratories, and lecture halls?', 'Consider projectors, lab consumables, hardware age, air conditioning, and acoustics.'),
    ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000006', 'How collaborative, motivated, and inclusive is the peer student community?', 'Reflect on student teamwork, ambition, cultural inclusivity, and campus clubs.'),
    ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000007', 'How strong are the campus recruitment drives, internship support, and career guidance?', 'Assess recruiter quality, package transparency, placement cell help, and resume clinics.'),
    ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000008', 'How safe is the campus environment for female students across all hours?', 'Consider night escort policies, well-lit pathways, internal complaints committee, and security.'),
    ('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000009', 'How free is the environment from academic bias, harassment, or favoritism by staff?', '10 means completely fair with zero harassment; 1 indicates rampant bias or retaliation.'),
    ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000010', 'How effectively does the college prevent and address bullying or peer harassment?', 'Consider whether complaints are taken seriously and solved without victim-blaming.'),
    ('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000011', 'How vibrant and active are campus social gatherings, cultural events, and festivals?', 'Rate annual college fests, music gigs, society activities, and weekend social life.'),
    ('b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000012', 'How well-balanced and safe is the campus attitude toward alcohol and substance use?', 'Consider peer pressure levels, safety, and whether social life excludes non-drinkers.'),
    ('b0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000013', 'How transparent, efficient, and responsive is the administrative management?', 'Focus on office red tape, fee dispute handling, document issuance, and staff courtesy.'),
    ('b0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000014', 'How fair are grading standards and how encouraged are independent thinking and discourse?', 'Reflect on exam subjectivity, syllabus contemporary relevance, and freedom of research.'),
    ('b0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000015', 'How freely can students voice concerns, publish opinions, and organize forums?', 'Consider student union autonomy, freedom to protest, and absence of censorship.'),
    ('b0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000016', 'How reliable is overall campus physical infrastructure, libraries, and common spaces?', 'Assess library study spaces, digital journal access, gym, green lawns, and power points.'),
    ('b0000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000017', 'How comfortable and clean are student hostels, and how reasonable are curfew rules?', 'Reflect on room ventilation, roommate density, warden attitude, and entry curfew flexibility.'),
    ('b0000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000018', 'How active and accessible is the alumni network for mentoring and career guidance?', 'Rate alumni involvement in guest lectures, referrals, mentorship, and endowment support.'),
    ('b0000000-0000-0000-0000-000000000019', 'a0000000-0000-0000-0000-000000000019', 'How reliable and clean is the drinking water supply across campus and hostels?', 'Assess drinking water taste, safety from waterborne illnesses, and water cooler uptime.'),
    ('b0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000020', 'How fast and dependable is campus-wide Wi-Fi and mobile network reception?', 'Focus on hostel Wi-Fi bandwidth, signal dead-zones, and port blocking policies.'),
    ('b0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000021', 'How reliable is the electrical power supply and generator backup during outages?', 'Consider exam study continuity during power cuts, fan/AC support, and inverter coverage.'),
    ('b0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000022', 'How convenient are college buses, public transit, and emergency transportation links?', 'Rate ease of traveling between campus and city center, bus reliability, and auto availability.'),
    ('b0000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000023', 'How accessible are on-campus first aid, dispensaries, and nearby hospital facilities?', 'Assess medical doctor availability, basic medicines in dispensary, and ambulance readiness.'),
    ('b0000000-0000-0000-0000-000000000024', 'a0000000-0000-0000-0000-000000000024', 'How well-maintained are hostel washrooms, hot water supply, laundry, and pest control?', 'Reflect on morning hot water in winter, washing machine access, and absence of insects/pests.'),
    ('b0000000-0000-0000-0000-000000000025', 'a0000000-0000-0000-0000-000000000025', 'How quickly and fairly are student maintenance and welfare complaints resolved?', 'Assess speed of fixing electric/plumbing faults, responsiveness of wardens, and appeal processes.')
ON CONFLICT (parameter_id) DO UPDATE SET
    prompt_text = EXCLUDED.prompt_text,
    guidance_notes = EXCLUDED.guidance_notes;

-- ----------------------------------------------------------------------------
-- 3. SEED COLLEGES
-- Real college (SFIT) with 0 ratings + 2 demo colleges for threshold testing.
-- ----------------------------------------------------------------------------
INSERT INTO colleges (id, name, short_code, city, state, is_demo)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'St. Francis Institute of Technology', 'SFIT', 'Mumbai', 'Maharashtra', FALSE),
    ('c0000000-0000-0000-0000-000000000004', 'Veermata Jijabai Technological Institute', 'VJTI', 'Mumbai', 'Maharashtra', FALSE),
    ('c0000000-0000-0000-0000-000000000005', 'College of Engineering Pune', 'COEP', 'Pune', 'Maharashtra', FALSE),
    ('c0000000-0000-0000-0000-000000000006', 'Indian Institute of Technology Bombay', 'IITB', 'Mumbai', 'Maharashtra', FALSE),
    ('c0000000-0000-0000-0000-000000000007', 'Sardar Patel Institute of Technology', 'SPIT', 'Mumbai', 'Maharashtra', FALSE),
    ('c0000000-0000-0000-0000-000000000008', 'Vidyalankar Institute of Technology', 'VIT-MUM', 'Mumbai', 'Maharashtra', FALSE),
    ('c0000000-0000-0000-0000-000000000009', 'Pune Institute of Computer Technology', 'PICT', 'Pune', 'Maharashtra', FALSE),
    ('c0000000-0000-0000-0000-000000000011', 'Walchand College of Engineering', 'WCE', 'Sangli', 'Maharashtra', FALSE)
ON CONFLICT (short_code) DO UPDATE SET
    name = EXCLUDED.name,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    is_demo = EXCLUDED.is_demo;

-- ----------------------------------------------------------------------------
-- 4. SEED DEMO RESPONDENTS (PEOPLE)
-- 19 distinct respondents for St. Jude + 19 distinct respondents for Apex.
-- Stored with stable UUIDs for idempotent reruns.
-- ----------------------------------------------------------------------------
-- 19 respondents for St. Jude (Demo)
INSERT INTO people (id, client_uuid, display_name, declared_college_id, affiliation, is_verified)
SELECT 
    ('d1000000-0000-0000-0000-' || LPAD(s::text, 12, '0'))::uuid AS id,
    ('b1000000-0000-0000-0000-' || LPAD(s::text, 12, '0'))::uuid AS client_uuid,
    'Demo Student ' || s AS display_name,
    'c0000000-0000-0000-0000-000000000002'::uuid AS declared_college_id,
    CASE WHEN s % 2 = 1 THEN 'current_student' ELSE 'alumnus' END AS affiliation,
    FALSE AS is_verified
FROM generate_series(1, 19) AS s
ON CONFLICT (client_uuid) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    declared_college_id = EXCLUDED.declared_college_id,
    affiliation = EXCLUDED.affiliation,
    is_verified = EXCLUDED.is_verified;

-- 19 respondents for Apex Technical Academy (Demo)
INSERT INTO people (id, client_uuid, display_name, declared_college_id, affiliation, is_verified)
SELECT 
    ('d2000000-0000-0000-0000-' || LPAD(s::text, 12, '0'))::uuid AS id,
    ('b2000000-0000-0000-0000-' || LPAD(s::text, 12, '0'))::uuid AS client_uuid,
    'Demo Scholar ' || s AS display_name,
    'c0000000-0000-0000-0000-000000000003'::uuid AS declared_college_id,
    CASE WHEN s % 2 = 1 THEN 'current_student' ELSE 'alumnus' END AS affiliation,
    FALSE AS is_verified
FROM generate_series(1, 19) AS s
ON CONFLICT (client_uuid) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    declared_college_id = EXCLUDED.declared_college_id,
    affiliation = EXCLUDED.affiliation,
    is_verified = EXCLUDED.is_verified;

-- ----------------------------------------------------------------------------
-- 5. SEED DEMO RATING SESSIONS
-- 19 submitted sessions for St. Jude + 19 submitted sessions for Apex.
-- ----------------------------------------------------------------------------
-- St. Jude Sessions (Demo)
INSERT INTO rating_sessions (id, college_id, respondent_id, respondent_role, status, is_demo, started_at, submitted_at)
SELECT
    ('e1000000-0000-0000-0000-' || LPAD(s::text, 12, '0'))::uuid AS id,
    'c0000000-0000-0000-0000-000000000002'::uuid AS college_id,
    ('d1000000-0000-0000-0000-' || LPAD(s::text, 12, '0'))::uuid AS respondent_id,
    CASE WHEN s % 2 = 1 THEN 'current_student' ELSE 'alumnus' END AS respondent_role,
    'submitted' AS status,
    TRUE AS is_demo,
    NOW() - INTERVAL '10 days' + (s * INTERVAL '2 hours') AS started_at,
    NOW() - INTERVAL '10 days' + (s * INTERVAL '2 hours') + INTERVAL '15 minutes' AS submitted_at
FROM generate_series(1, 19) AS s
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    is_demo = EXCLUDED.is_demo,
    respondent_role = EXCLUDED.respondent_role,
    submitted_at = EXCLUDED.submitted_at;

-- Apex Sessions (Demo)
INSERT INTO rating_sessions (id, college_id, respondent_id, respondent_role, status, is_demo, started_at, submitted_at)
SELECT
    ('e2000000-0000-0000-0000-' || LPAD(s::text, 12, '0'))::uuid AS id,
    'c0000000-0000-0000-0000-000000000003'::uuid AS college_id,
    ('d2000000-0000-0000-0000-' || LPAD(s::text, 12, '0'))::uuid AS respondent_id,
    CASE WHEN s % 2 = 1 THEN 'current_student' ELSE 'alumnus' END AS respondent_role,
    'submitted' AS status,
    TRUE AS is_demo,
    NOW() - INTERVAL '10 days' + (s * INTERVAL '2 hours') AS started_at,
    NOW() - INTERVAL '10 days' + (s * INTERVAL '2 hours') + INTERVAL '15 minutes' AS submitted_at
FROM generate_series(1, 19) AS s
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    is_demo = EXCLUDED.is_demo,
    respondent_role = EXCLUDED.respondent_role,
    submitted_at = EXCLUDED.submitted_at;

-- ----------------------------------------------------------------------------
-- 6. SEED RATING ANSWERS (ALL 25 PARAMETERS PER SESSION)
-- Total answers: 19 * 25 = 475 for St. Jude; 19 * 25 = 475 for Apex.
-- St. Jude: deterministic scores between 1 and 4 (arithmetic mean strictly < 4.0).
-- Apex: deterministic scores between 8 and 10 (arithmetic mean strictly >= 8.0).
-- ----------------------------------------------------------------------------
-- St. Jude Answers (475 answers)
INSERT INTO rating_answers (id, session_id, parameter_id, score, is_no_view)
SELECT 
    ('a1000000-0000-0000-0000-' || LPAD(((s - 1) * 25 + p.display_order)::text, 12, '0'))::uuid AS id,
    ('e1000000-0000-0000-0000-' || LPAD(s::text, 12, '0'))::uuid AS session_id,
    p.id AS parameter_id,
    (1 + ((s * 7 + p.display_order * 3) % 4)) AS score, -- Generates scores in {1, 2, 3, 4}
    FALSE AS is_no_view
FROM generate_series(1, 19) AS s
CROSS JOIN parameters p
ON CONFLICT (session_id, parameter_id) DO UPDATE SET
    score = EXCLUDED.score,
    is_no_view = EXCLUDED.is_no_view,
    updated_at = NOW();

-- Apex Answers (475 answers)
INSERT INTO rating_answers (id, session_id, parameter_id, score, is_no_view)
SELECT 
    ('a2000000-0000-0000-0000-' || LPAD(((s - 1) * 25 + p.display_order)::text, 12, '0'))::uuid AS id,
    ('e2000000-0000-0000-0000-' || LPAD(s::text, 12, '0'))::uuid AS session_id,
    p.id AS parameter_id,
    (8 + ((s * 3 + p.display_order * 5) % 3)) AS score, -- Generates scores in {8, 9, 10}
    FALSE AS is_no_view
FROM generate_series(1, 19) AS s
CROSS JOIN parameters p
ON CONFLICT (session_id, parameter_id) DO UPDATE SET
    score = EXCLUDED.score,
    is_no_view = EXCLUDED.is_no_view,
    updated_at = NOW();

-- ----------------------------------------------------------------------------
-- 7. UPDATE SESSIONS' CALCULATED OVERALL RATING
-- Calculates the exact arithmetic mean of numeric answers for each session.
-- ----------------------------------------------------------------------------
UPDATE rating_sessions rs
SET calculated_overall_rating = sub.unrounded_mean
FROM (
    SELECT session_id, ROUND(AVG(score)::numeric, 3) AS unrounded_mean
    FROM rating_answers
    WHERE score IS NOT NULL
    GROUP BY session_id
) sub
WHERE rs.id = sub.session_id
  AND rs.college_id IN (
      'c0000000-0000-0000-0000-000000000002'::uuid,
      'c0000000-0000-0000-0000-000000000003'::uuid
  );

-- ----------------------------------------------------------------------------
-- 8. SEED SCORE CONTRIBUTIONS
-- Exactly 19 low contributions for St. Jude; 19 high contributions for Apex.
-- ----------------------------------------------------------------------------
-- St. Jude Contributions (19 Low contributions)
INSERT INTO score_contributions (id, college_id, respondent_id, session_id, unrounded_rating, category)
SELECT 
    ('f1000000-0000-0000-0000-' || LPAD(s::text, 12, '0'))::uuid AS id,
    'c0000000-0000-0000-0000-000000000002'::uuid AS college_id,
    rs.respondent_id,
    rs.id AS session_id,
    rs.calculated_overall_rating AS unrounded_rating,
    'low' AS category
FROM rating_sessions rs
JOIN generate_series(1, 19) AS s 
  ON rs.id = ('e1000000-0000-0000-0000-' || LPAD(s::text, 12, '0'))::uuid
ON CONFLICT (college_id, respondent_id) DO UPDATE SET
    unrounded_rating = EXCLUDED.unrounded_rating,
    category = EXCLUDED.category;

-- Apex Contributions (19 High contributions)
INSERT INTO score_contributions (id, college_id, respondent_id, session_id, unrounded_rating, category)
SELECT 
    ('f2000000-0000-0000-0000-' || LPAD(s::text, 12, '0'))::uuid AS id,
    'c0000000-0000-0000-0000-000000000003'::uuid AS college_id,
    rs.respondent_id,
    rs.id AS session_id,
    rs.calculated_overall_rating AS unrounded_rating,
    'high' AS category
FROM rating_sessions rs
JOIN generate_series(1, 19) AS s 
  ON rs.id = ('e2000000-0000-0000-0000-' || LPAD(s::text, 12, '0'))::uuid
ON CONFLICT (college_id, respondent_id) DO UPDATE SET
    unrounded_rating = EXCLUDED.unrounded_rating,
    category = EXCLUDED.category;

-- ----------------------------------------------------------------------------
-- 9. SYNC COLLEGE SCORE STATE COUNTERS
-- St. Jude: 19 low contributions (score stays at 100 because 19 < 20).
-- Apex: 19 high contributions (score stays at 100 because 19 < 20).
-- SFIT: 0 contributions, score 100.
-- ----------------------------------------------------------------------------
-- SFIT (Real college stub - 0 reviews)
INSERT INTO college_score_state (college_id, current_score, total_qualifying_low, total_qualifying_neutral, total_qualifying_high, last_event_at, updated_at)
VALUES ('c0000000-0000-0000-0000-000000000001'::uuid, 100, 0, 0, 0, NOW(), NOW())
ON CONFLICT (college_id) DO UPDATE SET
    current_score = 100,
    total_qualifying_low = 0,
    total_qualifying_neutral = 0,
    total_qualifying_high = 0,
    updated_at = NOW();

-- St. Jude (Demo - 19 low contributions)
INSERT INTO college_score_state (college_id, current_score, total_qualifying_low, total_qualifying_neutral, total_qualifying_high, last_event_at, updated_at)
VALUES ('c0000000-0000-0000-0000-000000000002'::uuid, 100, 19, 0, 0, NOW(), NOW())
ON CONFLICT (college_id) DO UPDATE SET
    current_score = 100,
    total_qualifying_low = 19,
    total_qualifying_neutral = 0,
    total_qualifying_high = 0,
    updated_at = NOW();

-- Apex (Demo - 19 high contributions)
INSERT INTO college_score_state (college_id, current_score, total_qualifying_low, total_qualifying_neutral, total_qualifying_high, last_event_at, updated_at)
VALUES ('c0000000-0000-0000-0000-000000000003'::uuid, 100, 0, 0, 19, NOW(), NOW())
ON CONFLICT (college_id) DO UPDATE SET
    current_score = 100,
    total_qualifying_low = 0,
    total_qualifying_neutral = 0,
    total_qualifying_high = 19,
    updated_at = NOW();

-- ----------------------------------------------------------------------------
-- 10. VERIFICATION REPORT NOTICE
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_param_count INT;
    v_sfit_sessions INT;
    v_jude_contributions INT;
    v_apex_contributions INT;
    v_jude_score INT;
    v_apex_score INT;
BEGIN
    SELECT COUNT(*) INTO v_param_count FROM parameters;
    SELECT COUNT(*) INTO v_sfit_sessions FROM rating_sessions WHERE college_id = 'c0000000-0000-0000-0000-000000000001'::uuid;
    SELECT total_qualifying_low, current_score INTO v_jude_contributions, v_jude_score FROM college_score_state WHERE college_id = 'c0000000-0000-0000-0000-000000000002'::uuid;
    SELECT total_qualifying_high, current_score INTO v_apex_contributions, v_apex_score FROM college_score_state WHERE college_id = 'c0000000-0000-0000-0000-000000000003'::uuid;

    RAISE NOTICE '=========================================================';
    RAISE NOTICE 'CAMPUS UNCUT DATABASE SEEDING VERIFIED:';
    RAISE NOTICE 'Parameters Seeded: % (Expected: 25)', v_param_count;
    RAISE NOTICE 'SFIT Reviews/Sessions: % (Expected: 0)', v_sfit_sessions;
    RAISE NOTICE 'St. Jude (Demo): % low contributions, Score: % (Expected: 19 low, Score: 100)', v_jude_contributions, v_jude_score;
    RAISE NOTICE 'Apex (Demo): % high contributions, Score: % (Expected: 19 high, Score: 100)', v_apex_contributions, v_apex_score;
    RAISE NOTICE '=========================================================';
END $$;
