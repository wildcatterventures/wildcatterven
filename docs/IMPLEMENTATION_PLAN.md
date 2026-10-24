# CAMPUS UNCUT — ARCHITECTURE AUDIT & REVISED IMPLEMENTATION PLAN (PHASE 1)

**Product Tagline:** *"College life. Without the editing."*  
**Architecture Classification:** Public College Intelligence Platform (FastAPI + Supabase PostgreSQL + React Vite + Configurable Free-Tier Tool-Calling LLM)  
**Author:** Senior Software Architect  
**Status:** Approved Architectural Specification & Revised Implementation Roadmap  
**Revision:** v3.0 (Targeted Architecture Review: Conversational Rating Tools, Duplicate Submission Prevention, Unknown College Support)  
**Date:** October 2026  

---

## 1. Executive Summary & Project Audit

### 1.1 Existing Workspace Inventory
Inspection of the current workspace directory (`d:\Maxwell\Projects\Campus_Uncut`) confirms:
- **Repository State:** Git repository on branch `main` at commit `3b548d7` ("Update README.md"), tracking `origin/main` (`https://github.com/Maxwell343/Campus_Uncut.git`).
- **Files Present:**
  - `.git/` (Git metadata and commit history)
  - `README.md` (16,433 bytes; core project brief, principles, scoring rules, and constraints)
  - `docs/IMPLEMENTATION_PLAN.md` (Phase 1 planning document)
- **Files Not Yet Created:**
  - No `.gitignore` file.
  - No application code (`frontend/` or `backend/` directories).
  - No environment configuration templates (`.env.example`).
  - No package manifests (`package.json`, `requirements.txt`).
- **Local Host Runtime Environment:**
  - **Node.js:** `v22.14.0` | **npm:** `11.3.0`
  - **Python:** `3.12.1`
  - **Operating System:** Windows x64 (PowerShell)

### 1.2 Targeted Architecture Review Directives Incorporated (v3.0)
This revised specification directly incorporates three final architectural requirements:
1. **Complete Conversational Rating Toolset:** Added `start_rating_session`, `get_rating_session`, `save_rating_answer`, and `submit_rating_session` to the approved AI tool-calling specification. These execute validated FastAPI services with strict respondent/session/college consistency checks. The LLM can never perform direct SQL or scoring mutations.
2. **Database-Enforced Duplicate Submission Prevention:** Specified a database-level partial unique index on `rating_sessions(college_id, respondent_id) WHERE status = 'submitted'`. Ensures that only one submitted rating session exists per respondent profile per college. Parameter aggregates query only submitted sessions, guaranteeing that repeat submissions cannot distort parameter averages. Editing submitted ratings is explicitly designated out of scope for the MVP.
3. **Safe Unknown College Onboarding Workflow:** Defined a structured college creation flow when search yields no match. Includes composite normalized name and location deduplication (`LOWER(TRIM(name))`, `LOWER(TRIM(city))`, `LOWER(TRIM(state))`), a mandatory user confirmation step for college name, city, and state, score initialization at 100, zero parameter counts, explicit "Ratings not available yet" UI badges, and safeguards against hallucinated reviews or implied verification.

---

## 2. Target Monorepo Architecture

The repository uses a monorepo structure separating the React frontend and FastAPI backend.

```
Campus_Uncut/
├── .gitignore                          # Root gitignore (.venv, node_modules, .env, dist)
├── README.md                           # Original project specification
├── docs/
│   └── IMPLEMENTATION_PLAN.md          # This approved architectural specification
├── backend/
│   ├── .env.example                    # Backend environment template (server-only secrets)
│   ├── requirements.txt                # Pinned dependencies (fastapi, uvicorn, asyncpg, pydantic, etc.)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                     # FastAPI app, CORS, lifespan, exception handlers
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py               # Pydantic BaseSettings (DATABASE_URL, LLM settings, CORS)
│   │   │   └── constants.py            # Threshold constants (BASE_SCORE=100, BLOCK_SIZE=20)
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   ├── session.py              # asyncpg connection pool initialization and health checks
│   │   │   └── migrations/             # Sequential SQL migration files
│   │   │       ├── 001_initial_schema.sql
│   │   │       ├── 002_views_and_functions.sql
│   │   │       └── 003_seed_parameters_and_demo.sql
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── college.py              # College summary, detail, search, and creation schemas
│   │   │   ├── rating.py               # Respondent, session, answer, submission schemas
│   │   │   └── assistant.py            # Chat messages, tool declarations, structured replies
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── colleges.py             # College search, profiles, creation, and parameter breakdowns
│   │   │   ├── scoring.py              # Atomic rating submission transaction & threshold engine
│   │   │   └── assistant.py            # AI tool orchestration and conversational responses
│   │   ├── agents/
│   │   │   ├── __init__.py
│   │   │   ├── base.py                 # Abstract BaseLLMProvider interface
│   │   │   ├── groq_provider.py        # Groq tool-calling provider (Llama 3.3/3.1)
│   │   │   ├── mock_provider.py        # Offline/fallback rule-based provider
│   │   │   └── tools.py                # Schema declarations for AI backend tools
│   │   └── api/
│   │       ├── __init__.py
│   │       ├── deps.py                 # Dependency injection (db connection pool)
│   │       ├── router.py               # Aggregated API router
│   │       └── v1/
│   │           ├── colleges.py         # /api/colleges (GET, POST), /{id}, /{id}/ratings
│   │           ├── ratings.py          # /api/respondents, /api/rating-sessions, answers, submit
│   │           └── assistant.py        # /api/assistant/message
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py                 # Pytest fixtures and mock database harness
│       ├── test_scoring.py             # Unit tests: arithmetic mean, thresholds, concurrency
│       ├── test_ratings_api.py         # Integration tests: session lifecycle, answer completeness, duplicate block
│       ├── test_colleges_api.py        # Integration tests: search, create unknown college, demo filtering
│       └── test_assistant_tools.py     # Integration tests: AI conversational rating tool executions
└── frontend/
    ├── .env.example                    # Frontend environment template (VITE_API_BASE_URL only)
    ├── index.html                      # HTML5 entry point with responsive meta & fonts
    ├── package.json                    # React 18/19, TypeScript, Vite, lucide-react
    ├── tsconfig.json                   # Strict TypeScript compiler configuration
    ├── tsconfig.node.json
    ├── vite.config.ts                  # Vite build setup with API proxy
    └── src/
        ├── main.tsx                    # React DOM entry point
        ├── App.tsx                     # Main layout, screen routing, conversational state
        ├── styles/
        │   ├── tokens.css              # Warm ivory, Charcoal, Muted olive, Warm grey tokens
        │   ├── base.css                # Typography, accessibility, CSS reset
        │   └── components.css          # Editorial cards, buttons, badges, parameter inputs
        ├── types/
        │   ├── college.ts              # College, score state, parameter stats types
        │   ├── rating.ts               # Respondent, session, answer, submit types
        │   └── assistant.ts            # Conversation messages, voice state, tool outputs
        ├── lib/
        │   ├── api.ts                  # Fetch client targeting FastAPI backend only
        │   ├── storage.ts              # LocalStorage wrapper for client_uuid & declared college
        │   └── voice.ts                # Web Speech API wrapper (SpeechRecognition & Synthesis)
        ├── components/
        │   ├── Header.tsx              # Editorial masthead, navigation, live status
        │   ├── NoticeBanner.tsx        # Persistent unverified affiliation disclaimer
        │   ├── EditorialCard.tsx       # Content card with warm grey border & subtle padding
        │   ├── ScoreBadge.tsx          # College score pill (base 100) with delta styling
        │   ├── VoiceMicButton.tsx      # Accessible speech-to-text toggle with visual audio states
        │   └── CollegeCreateModal.tsx  # Confirmation modal for adding an unknown college
        └── features/
            ├── home/
            │   ├── ConversationalHero.tsx # Primary voice/text interactive search prompt
            │   ├── DirectActions.tsx   # Quick action buttons: "Explore Colleges", "Rate Your College"
            │   └── FeaturedColleges.tsx # Curated college preview cards
            ├── search/
            │   ├── CollegeSearch.tsx   # College directory with instant query filtering
            │   ├── CollegeCard.tsx     # College summary card showing score and response counts
            │   └── UnknownCollegePrompt.tsx # "College not found? Add it here" fallback prompt
            ├── college-detail/
            │   ├── CollegeDetail.tsx   # Detailed college profile and parameter breakdown
            │   ├── ParameterGrid.tsx   # 25-parameter distribution bars and sample counts
            │   ├── UnratedNotice.tsx   # "Ratings not available yet. Be the first to rate" notice
            │   └── DemoBadge.tsx       # Prominent [SIMULATED DEMO DATA] pill
            └── rating/
                ├── RespondentSetup.tsx # College selection & unverified affiliation self-declaration
                ├── RatingWizard.tsx    # Multi-parameter guided rating form (1-10 or "No view")
                ├── ParameterControl.tsx # Discrete 1-10 numerical selector + "No view" toggle
                ├── ReviewSummary.tsx   # Answer completeness review before submission
                └── SubmissionSuccess.tsx # Score change feedback and threshold event indicator
```

---

## 3. Database Schema & Data Integrity Design

The PostgreSQL database (hosted on Supabase) is accessed exclusively by FastAPI via `asyncpg`. No frontend code communicates directly with the database.

### 3.1 Relational Schema DDL (`001_initial_schema.sql`)

```sql
-- 1. COLLEGES TABLE
CREATE TABLE colleges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    short_code TEXT NOT NULL UNIQUE,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Composite unique expression index on normalized name, city, and state for duplicate prevention
CREATE UNIQUE INDEX uq_colleges_normalized_name_location
ON colleges (
    LOWER(TRIM(name)),
    LOWER(TRIM(city)),
    LOWER(TRIM(state))
);

-- 2. PEOPLE (RESPONDENTS) TABLE
-- Affiliation is self-declared and explicitly unverified in the prototype.
-- client_uuid is stored in browser localStorage for basic duplicate prevention.
CREATE TABLE people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_uuid TEXT NOT NULL UNIQUE,
    display_name TEXT,
    declared_college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
    affiliation TEXT NOT NULL CHECK (affiliation IN ('current_student', 'alumnus')),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. RATING PARAMETERS TABLE
-- Stores all 25 parameters (18 original + 7 remote/residential campus categories)
CREATE TABLE parameters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. QUESTION BANK TABLE
CREATE TABLE question_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parameter_id UUID NOT NULL REFERENCES parameters(id) ON DELETE CASCADE,
    prompt_text TEXT NOT NULL,
    guidance_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. RATING SESSIONS TABLE
-- Preserves respondent_role at submission to record historical state.
CREATE TABLE rating_sessions (
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

-- Partial unique index: strictly permits only ONE submitted rating session per respondent per college
CREATE UNIQUE INDEX uq_submitted_session_per_respondent_college 
ON rating_sessions (college_id, respondent_id) 
WHERE status = 'submitted';

-- 6. RATING ANSWERS TABLE
CREATE TABLE rating_answers (
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

-- 7. COLLEGE SCORE STATE TABLE
CREATE TABLE college_score_state (
    college_id UUID PRIMARY KEY REFERENCES colleges(id) ON DELETE CASCADE,
    current_score INT NOT NULL DEFAULT 100,
    total_qualifying_low INT NOT NULL DEFAULT 0,
    total_qualifying_neutral INT NOT NULL DEFAULT 0,
    total_qualifying_high INT NOT NULL DEFAULT 0,
    last_event_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. SCORE CONTRIBUTIONS TABLE
-- Records the single qualifying contribution per respondent per college
CREATE TABLE score_contributions (
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

-- 9. SCORE EVENTS TABLE (AUDIT LOG & IDEMPOTENT THRESHOLD TRACKING)
CREATE TABLE score_events (
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

-- 10. SEARCH EVENTS TABLE (PRIVACY-PRESERVING ANALYTICS)
CREATE TABLE search_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_session_id TEXT NOT NULL,
    query TEXT NOT NULL,
    resolved_college_id UUID REFERENCES colleges(id),
    requested_parameter_keys TEXT[],
    input_mode TEXT NOT NULL CHECK (input_mode IN ('text', 'voice')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. COLLEGE EMAIL DOMAINS TABLE (RESERVED FOR FUTURE INSTITUTIONAL VERIFICATION)
CREATE TABLE college_email_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    domain TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.2 Standard Aggregate View (`002_views_and_functions.sql`)

`v_college_parameter_stats` is a standard PostgreSQL view (not materialized).

```sql
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
GROUP BY rs.college_id, c.is_demo, ra.parameter_id, p.key, p.name, p.category, p.display_order;
```

**Observation Integrity Guarantee:**
Because `rating_sessions` enforces `UNIQUE (college_id, respondent_id) WHERE status = 'submitted'`, each respondent profile has at most **one** submitted session for any college. As a result, the aggregate query `WHERE rs.status = 'submitted'` will **never** count repeat submissions from the same respondent as separate observations in parameter averages or response counts.

---

## 4. The 25 Rating Parameters & Seed Data Specification

The question bank and rating engine support all 18 original parameters plus the 7 agreed remote/residential campus categories. Each parameter is seeded with a structured prompt in `003_seed_parameters_and_demo.sql`.

| # | Key | Parameter Name | Category | Question Prompt Text |
|---|---|---|---|---|
| **1** | `food` | College food and affordability | Campus Living | How would you rate the quality, hygiene, and affordability of college canteen and mess food? |
| **2** | `ragging` | Ragging prevention & safety | Campus Safety | How safe is the campus from ragging, intimidation, or coercive senior-junior practices? (10 = Completely safe/zero ragging) |
| **3** | `professor_quality` | Professor quality & accessibility | Academics | How accessible, knowledgeable, and supportive are faculty members outside lectures? |
| **4** | `toilet_quality` | Toilet and washroom quality | Campus Living | How clean, well-maintained, and adequately supplied are the campus restrooms? |
| **5** | `classroom_quality` | Classroom & lab quality | Academics | How modern and functional are the classrooms, laboratories, and lecture halls? |
| **6** | `student_culture` | Quality of fellow students & culture | Campus Culture | How collaborative, motivated, and inclusive is the peer student community? |
| **7** | `campus_placements` | Campus placements & career support | Career | How strong are the campus recruitment drives, internship support, and career guidance? |
| **8** | `womens_safety` | Women's safety & campus security | Campus Safety | How safe is the campus environment for female students across all hours? |
| **9** | `professor_harassment`| Harassment & discrimination by professors | Campus Safety | How free is the environment from academic bias, harassment, or favoritism by staff? (10 = Completely free) |
| **10**| `student_bullying` | Student bullying & peer harassment | Campus Safety | How effectively does the college prevent and address bullying or peer harassment? |
| **11**| `party_scene` | Party scene & nightlife | Campus Culture | How vibrant and active are campus social gatherings, cultural events, and festivals? |
| **12**| `alcohol_culture` | Alcohol & substance culture | Campus Culture | How well-balanced and safe is the campus attitude toward alcohol and substance use? |
| **13**| `college_management` | College management & complaint resolution | Governance | How transparent, efficient, and responsive is the administrative management? |
| **14**| `academic_freedom` | Academic freedom & grading fairness | Academics | How fair are grading standards and how encouraged are independent thinking and discourse? |
| **15**| `freedom_of_expression`| Freedom of expression & student voice | Governance | How freely can students voice concerns, publish opinions, and organize forums? |
| **16**| `infrastructure` | Campus infrastructure & utilities | Infrastructure | How reliable is overall campus physical infrastructure, libraries, and common spaces? |
| **17**| `hostel_quality` | Hostel quality & curfew policies | Campus Living | How comfortable and clean are student hostels, and how reasonable are curfew rules? |
| **18**| `alumni_interaction` | Alumni interaction & networking | Career | How active and accessible is the alumni network for mentoring and career guidance? |
| **19**| `drinking_water` | Clean drinking water access | Remote/Residential | How reliable and clean is the drinking water supply across campus and hostels? |
| **20**| `internet` | Internet & Wi-Fi connectivity | Remote/Residential | How fast and dependable is campus-wide Wi-Fi and mobile network reception? |
| **21**| `electricity` | Electricity & power backup | Remote/Residential | How reliable is the electrical power supply and generator backup during outages? |
| **22**| `transportation` | Transportation & city connectivity | Remote/Residential | How convenient are college buses, public transit, and emergency transportation links? |
| **23**| `hospital_access` | Emergency healthcare & hospital access | Remote/Residential | How accessible are on-campus first aid, dispensaries, and nearby hospital facilities? |
| **24**| `hostel_conditions` | Hostel hygiene, maintenance & hot water | Remote/Residential | How well-maintained are hostel washrooms, hot water supply, laundry, and pest control? |
| **25**| `complaint_handling` | Complaint handling & escalation speed | Remote/Residential | How quickly and fairly are student maintenance and welfare complaints resolved? |

---

## 5. Scoring Concurrency, Submission Integrity & Duplicate Prevention

Official scores and thresholds are governed by strict business logic and applied through an atomic database transaction.

### 5.1 Business Logic Rules
1. **Duplicate Submitted Rating Prevention:**
   A respondent profile can have only **one** submitted rating session per college. If a submitted session already exists for `(college_id, respondent_id)`, any subsequent submission attempt is rejected with HTTP 409 Conflict. Editing a submitted rating is explicitly **out of scope** for the MVP.
2. **Answer Completeness Requirement:**
   Every active parameter (all 25) must have either a numeric score (integer 1 to 10) or an explicit "No view" (`is_no_view = true`) before a rating session can be submitted. Incomplete sessions cannot be submitted and return HTTP 422 with missing parameter IDs.
3. **Respondent-College Validation:**
   Before submission, the backend verifies that `session.college_id == respondent.declared_college_id`. If mismatched, submission is rejected with HTTP 403.
4. **Unrounded Mean Calculation:**
   $$\text{Overall Mean} = \frac{\sum_{i=1}^{N_{\text{numeric}}} \text{score}_i}{N_{\text{numeric}}}$$
   - "No view" answers are excluded from both numerator and denominator.
   - If all 25 parameters are marked "No view" ($N_{\text{numeric}} = 0$), the session is marked `submitted`, but `calculated_overall_rating` is `NULL`. **It generates no score contribution and does not alter the college score.**
5. **Category Classification (Using Unrounded Mean):**
   - $\text{Overall Mean} < 4.0 \implies$ **low**
   - $4.0 \le \text{Overall Mean} < 8.0 \implies$ **neutral**
   - $\text{Overall Mean} \ge 8.0 \implies$ **high**
6. **Threshold Adjustments:**
   $$\text{Block Number} = \left\lfloor \frac{\text{Total Qualifying Category Count}}{20} \right\rfloor$$
   - Each completed block of 20 low contributions causes `-1` to the college score.
   - Each completed block of 20 high contributions causes `+1` to the college score.
   - Neutral contributions never alter the college score.

### 5.2 Atomic PostgreSQL Transaction Algorithm
When `POST /api/rating-sessions/{session_id}/submit` is called, FastAPI executes the transaction:

```
[Start Transaction]
  │
  ├─ 1. SELECT * FROM rating_sessions WHERE id = :session_id FOR UPDATE;
  │     (If not found -> 404; If status != 'in_progress' -> 409 Conflict)
  │
  ├─ 2. SELECT id FROM rating_sessions 
  │     WHERE college_id = session.college_id AND respondent_id = session.respondent_id 
  │       AND status = 'submitted' AND id != :session_id;
  │     (If exists -> 409 Conflict: "A rating has already been submitted for this college from this profile.")
  │
  ├─ 3. SELECT declared_college_id FROM people WHERE id = :respondent_id;
  │     (If declared_college_id != session.college_id -> 403 Forbidden)
  │
  ├─ 4. SELECT parameter_id, score, is_no_view FROM rating_answers WHERE session_id = :session_id;
  │     (Verify all 25 active parameters are answered. If incomplete -> 422 Unprocessable)
  │
  ├─ 5. Compute unrounded arithmetic mean of numeric answers.
  │     UPDATE rating_sessions 
  │     SET status = 'submitted', calculated_overall_rating = :mean, submitted_at = NOW()
  │     WHERE id = :session_id;
  │     (Trigger will enforce uq_submitted_session_per_respondent_college at DB level)
  │
  ├─ 6. If mean IS NOT NULL:
  │      INSERT INTO score_contributions (college_id, respondent_id, session_id, unrounded_rating, category)
  │      VALUES (:college_id, :respondent_id, :session_id, :mean, :category)
  │      ON CONFLICT (college_id, respondent_id) DO NOTHING
  │      RETURNING id;
  │
  ├─ 7. If contribution was inserted (First qualifying rating by this respondent):
  │      SELECT current_score, total_qualifying_low, total_qualifying_high 
  │      FROM college_score_state WHERE college_id = :college_id FOR UPDATE;
  │      
  │      Increment appropriate category counter;
  │      Compute block_number = floor(new_category_count / 20);
  │      
  │      If block_number > 0 AND category IN ('low', 'high'):
  │        delta = (category == 'high') ? +1 : -1;
  │        INSERT INTO score_events 
  │          (college_id, category, block_number, score_delta, score_before, score_after, triggered_by_session_id)
  │        VALUES 
  │          (:college_id, :category, :block_number, :delta, current_score, current_score + :delta, :session_id)
  │        ON CONFLICT (college_id, category, block_number) DO NOTHING
  │        RETURNING id;
  │        
  │        If score_event inserted:
  │          UPDATE college_score_state 
  │          SET current_score = current_score + :delta, updated_at = NOW() 
  │          WHERE college_id = :college_id;
  │
[Commit Transaction]
```

---

## 6. Unknown College Onboarding Workflow

When a visitor searches for a college that does not exist in the database, the system provides a safe, guided creation workflow via either the search UI or conversational assistant.

### 6.1 Workflow Steps
1. **Search Miss:** Public search (`GET /api/colleges?q=...`) returns `[]`.
2. **Onboarding Prompt:** The UI / assistant presents:  
   *"We couldn't find '[Query]'. Would you like to add it to Campus Uncut?"*
3. **Information Collection:** The user is asked to specify:
   - **College Full Name** (e.g., "National Institute of Design")
   - **City** (e.g., "Ahmedabad")
   - **State** (e.g., "Gujarat")
4. **Duplicate Safeguard (Normalized Name & Location Matching):**
   - The backend runs composite normalized matching using `LOWER(TRIM(name))`, `LOWER(TRIM(city))`, and `LOWER(TRIM(state))` against `colleges` (enforced by `uq_colleges_normalized_name_location`).
   - If an existing college matches the name, city, and state (e.g. "national institute of design" in "ahmedabad", "gujarat"), the backend returns the existing record or HTTP 409 Conflict instead of creating a duplicate.
   - If similar colleges exist in the same city or state, the frontend displays: *"Did you mean one of these existing colleges?"*
5. **Confirmation Step:**
   - The user must explicitly confirm: *"Confirm adding National Institute of Design (Ahmedabad, Gujarat)?"*
6. **Record Creation (`POST /api/colleges`):**
   - Generates a unique short code from initials/city.
   - Sets `is_demo = FALSE`.
   - Inserts initial `college_score_state` with `current_score = 100`, `total_qualifying_low = 0`, `total_qualifying_neutral = 0`, `total_qualifying_high = 0`.
7. **Immediate Presentation & Disclaimer:**
   - The college profile displays:
     - Base Score: `100`
     - Response counts: `0`
     - Prominent Notice: *"Ratings are not available yet. Be the first student or alumnus to rate this college."*
   - **Crucial Rule:** The system **never** fabricates reviews, parameters, or testimonials, and explicitly displays that this new record is community-added and unverified.

---

## 7. Demonstration Data Specification

Two distinct demo colleges are seeded in `003_seed_parameters_and_demo.sql` to verify threshold transitions during demonstrations.

### 7.1 Demo College 1: Decrement Scenario (100 -> 99)
- **Institution Name:** `St. Jude Institute of Technology (Demo)`
- **Short Code:** `JUDE-DEMO`
- **Initial College Score:** `100`
- **Seeded Contributions:** Exactly **19 simulated low contributions** (`is_demo = true`, each with arithmetic mean `< 4.0`, e.g., scores of 2 and 3).
- **Current Counter State:** `total_qualifying_low = 19`, `total_qualifying_high = 0`.
- **Demonstration Walkthrough:**
  1. Visitor opens St. Jude Institute in UI; score displays `100` with pill `[SIMULATED DEMO DATA]`.
  2. Visitor self-declares as student of St. Jude and submits a low rating (scores 2–3 across parameters).
  3. This represents the **20th distinct qualifying low contribution**.
  4. The atomic transaction triggers Block 1 (`score_delta = -1`).
  5. UI updates in real-time: college score decreases from **100 to 99**.

### 7.2 Demo College 2: Increment Scenario (100 -> 101)
- **Institution Name:** `Apex Technical Academy (Demo)`
- **Short Code:** `APEX-DEMO`
- **Initial College Score:** `100`
- **Seeded Contributions:** Exactly **19 simulated high contributions** (`is_demo = true`, each with arithmetic mean $\ge 8.0$, e.g., scores of 8, 9, 10).
- **Current Counter State:** `total_qualifying_low = 0`, `total_qualifying_high = 19`.
- **Demonstration Walkthrough:**
  1. Visitor opens Apex Technical Academy; score displays `100` with pill `[SIMULATED DEMO DATA]`.
  2. Visitor self-declares as student of Apex and submits a high rating (scores 8–10 across parameters).
  3. This represents the **20th distinct qualifying high contribution**.
  4. The atomic transaction triggers Block 1 (`score_delta = +1`).
  5. UI updates in real-time: college score increases from **100 to 101**.

---

## 8. Backend Module Boundaries & API Specification

The FastAPI backend is the only application layer accessing the database or executing AI tools.

| HTTP Method | Route Path | Request Body | Response Body | Description & Security |
|---|---|---|---|---|
| `GET` | `/health` | None | `{"status": "ok", "db": "connected"}` | Health and connection pool check. |
| `GET` | `/api/colleges` | Query: `?q={str}&demo={bool}` | `List[CollegeSummary]` | Public college search. Supports partial matching. |
| `POST` | `/api/colleges` | `CreateCollegeRequest` | `CollegeDetail` | **Creates unknown college.** Validates composite normalized name/city/state uniqueness, sets score 100, zero counts. |
| `GET` | `/api/colleges/{id}` | None | `CollegeDetail` | College profile, score state, and simulated demo flag. |
| `GET` | `/api/colleges/{id}/ratings` | None | `CollegeRatingReport` | Parameter averages, distribution, and response counts. |
| `POST` | `/api/respondents` | `CreateRespondentRequest` | `RespondentResponse` | Upserts `people` record using `client_uuid`, `declared_college_id`, and `affiliation`. |
| `POST` | `/api/rating-sessions` | `CreateSessionRequest` | `RatingSessionResponse` | Creates session. Validates `college_id == respondent.declared_college_id`. Blocks if already submitted. |
| `GET` | `/api/rating-sessions/{id}` | None | `RatingSessionDetail` | Retrieves session, current answers, and completeness status. |
| `PUT` | `/api/rating-sessions/{id}/answers/{param_id}` | `SaveAnswerRequest` | `RatingAnswerResponse` | Upserts answer (`1-10` or `is_no_view=true`). Replaces existing answer. |
| `POST` | `/api/rating-sessions/{id}/submit` | None | `SubmitSessionResult` | **Atomic transaction:** Enforces all 25 answered, enforces 1-submit-per-respondent, computes mean, updates score. |
| `POST` | `/api/assistant/message` | `AssistantMessageRequest` | `AssistantMessageResponse` | Executes approved AI tools against backend services; returns message + structured card payloads. |

---

## 9. AI Tool Calling & Voice Pipeline

### 9.1 Architecture & Safety Boundaries
The AI runtime acts purely as an intent interpreter and tool orchestrator. It receives approved tools, generates tool arguments, and FastAPI executes validated backend services.

```
                    ┌─────────────────────────┐
                    │  POST /assistant/message│
                    └────────────┬────────────┘
                                 │
                   ┌─────────────▼─────────────┐
                   │    BaseLLMProvider        │
                   │  (Groq Llama 3.3 / Mock)  │
                   └─────────────┬─────────────┘
                                 │ Tool Calls
        ┌────────────────────────┴────────────────────────┐
        ▼                                                 ▼
┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│     Discovery Tools             │     │   Conversational Rating Tools   │
│ - search_colleges               │     │ - start_rating_session          │
│ - get_college_summary           │     │ - get_rating_session            │
│ - get_parameter_ratings         │     │ - save_rating_answer            │
│ - get_active_parameters         │     │ - submit_rating_session         │
│ - create_unknown_college        │     │                                 │
└────────────────┬────────────────┘     └────────────────┬────────────────┘
                 │                                       │
                 └───────────────────┬───────────────────┘
                                     │ Validated Calls
                       ┌─────────────▼─────────────┐
                       │     FastAPI Services      │
                       │   (scoring.py, etc.)      │
                       └─────────────┬─────────────┘
                                     │ Row-Locked SQL
                       ┌─────────────▼─────────────┐
                       │    Supabase PostgreSQL    │
                       └───────────────────────────┘
```

**Non-Negotiable Guardrails:**
- The LLM **never** has direct database connection credentials.
- The LLM **never** executes SQL queries or calculates official scores.
- All session, respondent, and parameter operations are verified by FastAPI services before modifying state.

### 9.2 Complete Approved AI Tools Specification

#### A. Discovery & College Creation Tools
1. `search_colleges(query: str) -> List[Dict]`  
   Searches for colleges by name, city, or state. Returns matches with current scores.
2. `create_unknown_college(name: str, city: str, state: str, confirmed: bool) -> Dict`  
   If `confirmed = false`, returns a confirmation request prompt. If `confirmed = true`, calls `POST /api/colleges` service to initialize a new college at score 100 with zero ratings.
3. `get_college_summary(college_name_or_id: str) -> Dict`  
   Retrieves official score, respondent count breakdown, and verification disclaimer.
4. `get_parameter_ratings(college_id: str, parameter_keys: Optional[List[str]]) -> Dict`  
   Fetches average ratings, sample sizes, and distributions for specified parameters.
5. `get_active_parameters() -> List[Dict]`  
   Lists the 25 active parameters and question prompts.

#### B. Conversational Rating Tools
6. `start_rating_session(college_id: str, respondent_client_uuid: str, affiliation: str, respondent_role: str, respondent_name: Optional[str]) -> Dict`  
   - Validates that the respondent profile does not already have a `submitted` session for this college (returns HTTP 409 if true).
   - Upserts respondent with `declared_college_id = college_id` and creates an `in_progress` rating session.
   - Returns `session_id`, first unrated parameter, and question prompt.
7. `get_rating_session(session_id: str) -> Dict`  
   - Retrieves session progress: list of answered parameters, unanswered parameters, and completeness percentage.
8. `save_rating_answer(session_id: str, parameter_key: str, score: Optional[int], is_no_view: bool) -> Dict`  
   - Validates that `session_id` is `in_progress`.
   - Validates answer: either `1 <= score <= 10` or `is_no_view = true`.
   - Upserts answer in `rating_answers`. Returns next unanswered parameter prompt.
9. `submit_rating_session(session_id: str) -> Dict`  
   - Invokes the backend transactional submit service.
   - Enforces 25-parameter completeness and checks for duplicate submitted sessions.
   - Returns submission result, unrounded mean, category, and any score adjustment triggered.

### 9.3 Voice Pipeline (Web Speech API)
- **Speech-to-Text:** Browser-native `SpeechRecognition` / `webkitSpeechRecognition`.
- **Speech Synthesis:** Browser-native `window.speechSynthesis`.
- **Fallback:** If voice is unsupported or microphone access is denied, voice controls hide cleanly and typed text works everywhere.

---

## 10. Ordered Implementation Roadmap

```
  Phase 1: Project Audit & Planning (Complete)
      │
      ▼
  Phase 2: Database Schema & Migration Scripts
      │
      ▼
  Phase 3: Backend Core, Scoring Engine & API Endpoints
      │
      ▼
  Phase 4: Conversational-First Frontend & User Journeys
      │
      ▼
  Phase 5: AI Tool Orchestration & Voice Integration
      │
      ▼
  Phase 6: Seed Scenarios, End-to-End Verification & Documentation
```

### Phase 2: Database Schema & Migration Scripts
- **Deliverables:**
  - `001_initial_schema.sql` (11 tables with partial unique index on submitted sessions and composite normalized name/location unique index).
  - `002_views_and_functions.sql` (Standard `v_college_parameter_stats` view).
  - `003_seed_parameters_and_demo.sql` (All 25 parameters, question bank prompts, real colleges, and the two 19-rating demo colleges).
- **Acceptance Criteria:**
  - Attempting to insert a second `submitted` session for the same `(college_id, respondent_id)` fails with unique violation.
  - Attempting to insert a duplicate college with matching normalized name, city, and state fails (`uq_colleges_normalized_name_location`).

### Phase 3: Backend Core, Scoring Engine & API
- **Deliverables:**
  - Pydantic models for colleges, creation, sessions, answers, and tool schemas.
  - `asyncpg` connection pool with health check.
  - Scoring engine service (`scoring.py`) with atomic row locking and duplicate submission checks.
  - College service (`colleges.py`) supporting composite normalized name and location validation and initial score 100.
  - REST endpoints for colleges, respondents, rating sessions, answers, and submissions.
- **Acceptance Criteria:**
  - `POST /api/colleges` creates unrated college with score 100.
  - Submitting twice from same respondent returns HTTP 409 Conflict.
  - 20th low rating drops St. Jude score from 100 to 99; 20th high rating increments Apex from 100 to 101.

### Phase 4: Conversational-First Frontend & User Journeys
- **Deliverables:**
  - React + TypeScript + Vite app with editorial visual tokens.
  - Conversational-first homepage with voice/text input and direct action links.
  - College search with "Unknown college? Add it here" fallback modal.
  - Detailed college view with 25-parameter breakdown and "Ratings not available yet" state for new colleges.
  - Guided rating wizard with 1–10 selector, "No view" toggle, completeness check, and review screen.
- **Acceptance Criteria:**
  - Responsive layouts on mobile (375px) and desktop (1440px).
  - Creating an unknown college requires explicit confirmation and displays unrated status.

### Phase 5: AI Tool Orchestration & Voice Integration
- **Deliverables:**
  - `BaseLLMProvider` interface, `GroqProvider` adapter, and `MockProvider` fallback.
  - Complete 9 approved AI tools declared and wired to FastAPI services.
  - `/api/assistant/message` endpoint handling tool calls in conversational loops.
  - Web Speech API integration (`lib/voice.ts`).
- **Acceptance Criteria:**
  - User can rate a college end-to-end conversationally via AI tools.
  - Voice recognition and synthesis work where supported, with seamless text fallback.

### Phase 6: Seed Scenarios, End-to-End Verification & Polish
- **Deliverables:**
  - Live verification of Demo 1 (St. Jude: 100 -> 99 on 20th low rating).
  - Live verification of Demo 2 (Apex: 100 -> 101 on 20th high rating).
  - Code audit confirming zero server secrets in frontend network traffic or bundles.
- **Acceptance Criteria:**
  - Both demo threshold transitions verified.
  - Zero server secrets leaked.

---

## 11. High-Risk Issues & Architectural Mitigations

| Risk Area | Specific Failure Mode | Architectural Mitigation |
|---|---|---|
| **Duplicate Submitted Ratings** | A user submits multiple rating sessions for the same college to manipulate parameters or score. | Database-level partial unique index: `uq_submitted_session_per_respondent_college ON rating_sessions(college_id, respondent_id) WHERE status = 'submitted'`. Backend catches conflicts and returns HTTP 409. |
| **Spam / Duplicate College Creation** | Users create multiple slight variations of the same college in the same city/state ("IIT Bombay", "iit bombay"). | Composite unique expression index: `uq_colleges_normalized_name_location` on `(LOWER(TRIM(name)), LOWER(TRIM(city)), LOWER(TRIM(state)))` + backend fuzzy pre-check + mandatory user confirmation step. |
| **Scoring Concurrency** | Simultaneous submissions for the 20th low rating trigger duplicate -1 deductions. | Strict PostgreSQL transaction: row lock via `SELECT ... FOR UPDATE` on `college_score_state` plus unique constraint `(college_id, category, block_number)` in `score_events`. |
| **Demo Data Contamination** | Seeded demo ratings distort real-world college averages. | Demo records flagged with `is_demo = true` on `colleges` and `rating_sessions`. View filters demo colleges from standard search, and UI renders bold `[SIMULATED DEMO DATA]` badges. |
| **Secret Leakage** | Database credentials or LLM keys bundled into frontend client. | Frontend `.env` contains only `VITE_API_BASE_URL`. All database connections and AI keys reside strictly in backend `.env` accessed only by FastAPI. |
| **Free-Tier Limits & Cold Starts** | Render backend sleeps after inactivity; Groq API hits rate limits. | 1. Frontend displays a clean "Connecting to intelligence engine..." state during cold starts. <br>2. Backend catches LLM rate limits and falls back to deterministic `MockProvider` queries. |

---

## 12. Minimal Testing Strategy

1. **Unit Tests (Backend `pytest`):**
   - Arithmetic mean calculation with mixed numeric and "No view" values.
   - Category boundary checks: `3.999` (low), `4.000` (neutral), `7.999` (neutral), `8.000` (high).
   - Block threshold formula: `floor(count / 20)`.
   - Normalized name and location generator function (stripping punctuation, whitespace, lowercase for name, city, and state).
2. **API Integration Tests (Backend `pytest` + `httpx`):**
   - Unknown college creation: `POST /api/colleges` creates college with score 100, zero counts; second identical call with matching normalized name, city, and state returns 409 Conflict; same college name in a different city/state succeeds.
   - Rating session lifecycle: start -> answer active parameters -> submit.
   - Duplicate submission prevention: attempting a second `submit` for the same college and respondent returns 409 Conflict.
   - Answer completeness validation: submitting with 24 answered parameters fails with 422.
   - Mismatched college check: submitting for college B when respondent declared college A fails with 403.
   - Seed threshold verification: 20th low rating decrements St. Jude from 100 to 99; 20th high rating increments Apex from 100 to 101.
   - AI conversational tools: testing tool execution handlers for `start_rating_session`, `save_rating_answer`, and `submit_rating_session`.
3. **Browser Verification Checklist:**
   - Homepage conversational input responds to text query.
   - Unknown college search prompts user to create college, asks for confirmation, and displays unrated detail page.
   - Voice microphone button records speech and transcribes to query input where supported.
   - Rating wizard 1–10 selector and "No view" toggle update answer state immediately.
   - Duplicate rating attempt displays clear alert that the profile has already submitted.
   - Demo badges visible on demo college cards and detail pages.

---

## 13. Manual Setup Tasks for the Developer

Before Phase 2 execution begins, the developer must complete the following external service setups:
1. **Supabase PostgreSQL Free Tier:**
   - Create a free project at [supabase.com](https://supabase.com).
   - In Project Settings -> Database, copy the PostgreSQL Connection String (`DATABASE_URL`).
2. **Groq Free LLM API Key (or Alternative Free Tool-Calling Provider):**
   - Create a free account at [console.groq.com](https://console.groq.com).
   - Generate an API key (`GROQ_API_KEY`).
3. **Environment Configuration Files:**
   - Create `backend/.env` containing:
     ```env
     APP_ENV=development
     DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
     LLM_PROVIDER=groq
     GROQ_API_KEY=gsk_...
     LLM_MODEL=llama-3.3-70b-versatile
     CORS_ORIGINS=http://localhost:5173
     ```
   - Create `frontend/.env.local` containing:
     ```env
     VITE_API_BASE_URL=http://localhost:8000
     ```
4. **Database Migration Execution:**
   - Run the SQL migration scripts in the Supabase SQL Editor in sequence:
     `001_initial_schema.sql` -> `002_views_and_functions.sql` -> `003_seed_parameters_and_demo.sql`.

---

## 14. Documented Assumptions & Explicit Design Decisions

1. **One Submitted Rating Per Respondent Per College:** Enforced by partial unique index `uq_submitted_session_per_respondent_college`. Re-submitting returns HTTP 409. Editing submitted ratings is out of scope for the prototype.
2. **Prototype Identity Limitation:** Respondent deduplication relies on client UUID in browser `localStorage`. Clearing browser storage or using private browsing allows creating another profile. This is documented and accepted for the prototype; no cryptographic identity claims are made.
3. **Unknown College Score Initialization & Location Deduplication:** Newly onboarded colleges start at official score `100` with `0` ratings, explicitly marked unrated. Zero ratings are invented. Deduplication is enforced at the database level by the composite expression index `uq_colleges_normalized_name_location` on `(LOWER(TRIM(name)), LOWER(TRIM(city)), LOWER(TRIM(state)))`, preventing duplicate entries within the same city and state while allowing legitimate multi-city campuses with identical names.
4. **Active Parameter Completeness:** All 25 active parameters must have a recorded answer (either integer 1–10 or `is_no_view = true`) before final submission is accepted.
5. **Unrounded Mean for Thresholds:** Arithmetic mean is evaluated in floating-point precision against boundaries (`< 4.0`, `4.0 <= x < 8.0`, `>= 8.0`). Rounding to 1 decimal place is reserved strictly for display.
6. **All "No view" Submissions:** If all 25 parameters are marked "No view", the session submits with `calculated_overall_rating = NULL`. It contributes to parameter counts but creates zero score contributions and does not alter the college score.
