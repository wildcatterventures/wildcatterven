# CAMPUS UNCUT — DATABASE SETUP GUIDE & SCORING SPECIFICATION

**Product Tagline:** *"College life. Without the editing."*  
**Database Engine:** PostgreSQL 15+ (Hosted on Supabase Free Tier)  
**Access Model:** Exclusive server-side access via FastAPI (`DATABASE_URL`). The frontend never connects directly to Supabase.  
**Author:** Senior Software Architect  
**Status:** Implementation Guide (Phase 2)  
**Date:** October 2026  

---

## 1. Overview & Architecture

Campus Uncut uses a relational database schema designed for strict mathematical scoring integrity, concurrency safety, and privacy.

### Core Guarantees
- **No Direct Frontend Access:** The React frontend communicates strictly with the FastAPI backend REST API. No Supabase keys, service-role keys, or database passwords are ever provided to the frontend client.
- **Relational Integrity:** All 11 tables enforce foreign keys, check constraints on answer bounds (`1 <= score <= 10` or explicit `is_no_view = true`), and uniqueness rules.
- **Single Observation Per Respondent Per College:** A database-level partial unique index (`uq_submitted_session_per_respondent_college`) guarantees only one submitted session exists per respondent profile per college. Parameter aggregates never count duplicate submissions from the same respondent as separate observations.
- **Location-Aware College Deduplication:** The composite unique expression index `uq_colleges_normalized_name_location` on `(LOWER(TRIM(name)), LOWER(TRIM(city)), LOWER(TRIM(state)))` prevents duplicate entries in the same city and state while allowing multi-campus institutions with identical names.
- **Zero-Contamination Demo Data:** Simulated demo colleges are explicitly flagged (`is_demo = true`). Non-demo queries filter out demo data, guaranteeing genuine college metrics are never contaminated.

---

## 2. Core Scoring Rules & Mathematical Assumptions

Official college scores are governed by the following mathematical and architectural rules:

### 2.1 Arithmetic Mean & Answer Exclusion
1. **Unrounded Arithmetic Mean:**
   $$\text{Overall Rating} = \frac{\sum_{i=1}^{N_{\text{numeric}}} \text{score}_i}{N_{\text{numeric}}}$$
2. **Exclusion of "No view":**
   Any answer where `is_no_view = TRUE` is excluded from both the numerator and the denominator. It is never treated as zero.
3. **All "No view" Sessions:**
   If a respondent marks all 25 parameters as "No view" ($N_{\text{numeric}} = 0$), the session is marked `submitted`, but `calculated_overall_rating` is `NULL`. **It generates no score contribution and does not alter the college score.**

### 2.2 Category Classification
Classification uses the exact unrounded floating-point mean:
- $\text{Overall Rating} < 4.0 \implies$ **low**
- $4.0 \le \text{Overall Rating} < 8.0 \implies$ **neutral**
- $\text{Overall Rating} \ge 8.0 \implies$ **high**

*Note on display rounding:* Display rounding (e.g. formatting `3.96` to `4.0`) is strictly visual and must **never** influence category assignment. In this example, `3.96` is mathematically `low`.

### 2.3 Threshold Calculation Formula
Every college begins with an official base score of **100**.
$$\text{Target Block} = \left\lfloor \frac{\text{Total Qualifying Category Count}}{20} \right\rfloor$$
- **Low Category:** Each complete block of 20 distinct qualifying low contributions decreases the college score by **1**.
- **High Category:** Each complete block of 20 distinct qualifying high contributions increases the college score by **1**.
- **Neutral Category:** Neutral contributions do not alter the college score.
- **Idempotent Application:** Each threshold block is recorded in `score_events` with constraint `UNIQUE (college_id, category, block_number)`, preventing duplicate score deductions under concurrent submissions.

### 2.4 Demonstrator Scenarios
The database seed prepares two demo institutions to verify scoring transitions:
- **St. Jude Institute of Technology (Demo):** Seeded with **19 qualifying low contributions**; score remains **100** ($19 < 20$). The next qualifying low contribution (the 20th) triggers Block 1, shifting the score from **100 to 99**.
- **Apex Technical Academy (Demo):** Seeded with **19 qualifying high contributions**; score remains **100** ($19 < 20$). The next qualifying high contribution (the 20th) triggers Block 1, shifting the score from **100 to 101**.
- **St. Francis Institute of Technology (SFIT):** Real college stub seeded with score **100**, **0** sessions, and **0** reviews. Reviews are never fabricated for real institutions.

---

## 3. Migration Files Inventory

| Migration File | Purpose | Key Relational Artifacts |
|---|---|---|
| `backend/app/db/migrations/001_initial_schema.sql` | Schema, constraints, triggers | 11 tables, `uq_colleges_normalized_name_location`, `uq_submitted_session_per_respondent_college`, `chk_answer_validity`, `fn_init_college_score_state` trigger. |
| `backend/app/db/migrations/002_views_and_functions.sql` | Reporting & live query contracts | Standard views: `v_college_parameter_stats`, `v_college_parameter_distributions`, and `v_college_summary`. |
| `backend/app/db/migrations/003_seed_parameters_and_demo.sql` | Canonical seed data | 25 parameters, 25 question bank prompts, SFIT stub, St. Jude (19 low ratings), Apex (19 high ratings), 950 answers. Idempotent rerun safe. |

---

## 4. Step-by-Step Supabase Manual Setup Instructions

Follow these steps to set up the free PostgreSQL database on Supabase:

### Step 1: Create a Free Supabase Project
1. Log in to [supabase.com](https://supabase.com).
2. Click **New Project**.
3. Choose an organization and enter:
   - **Name:** `campus-uncut` (or similar)
   - **Database Password:** Generate and store a strong password securely.
   - **Region:** Choose a region close to your deployment (e.g., `ap-south-1` Mumbai or `us-east-1`).
   - **Pricing Plan:** Free.
4. Click **Create new project** and wait ~1–2 minutes for the database cluster to provision.

### Step 2: Retrieve the PostgreSQL Connection String
1. In your Supabase project dashboard, navigate to **Project Settings** (gear icon in sidebar).
2. Go to **Database**.
3. Under **Connection string**, select **URI**.
4. Mode: Select **Session** or **Transaction** (for direct server-side connection with asyncpg, standard URI: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres` or connection pooling URI: `postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`).
5. Copy this URI. This value is used exclusively for the `DATABASE_URL` environment variable in `backend/.env` during Phase 3. **Never commit this URI to source control.**

### Step 3: Run the Migrations in Order via the Supabase SQL Editor
1. In the Supabase sidebar, open the **SQL Editor** (icon: `>_`).
2. Click **+ New Query**.

#### 3A. Run Migration 001
- Copy the entire contents of [001_initial_schema.sql](file:///D:/Maxwell/Projects/Campus_Uncut/backend/app/db/migrations/001_initial_schema.sql).
- Paste it into the SQL Editor.
- Click **Run** (or `Ctrl+Enter`).
- Confirm output: *"Success. No rows returned."*

#### 3B. Run Migration 002
- Click **+ New Query**.
- Copy the entire contents of [002_views_and_functions.sql](file:///D:/Maxwell/Projects/Campus_Uncut/backend/app/db/migrations/002_views_and_functions.sql).
- Paste it into the SQL Editor.
- Click **Run**.
- Confirm output: *"Success. No rows returned."*

#### 3C. Run Migration 003
- Click **+ New Query**.
- Copy the entire contents of [003_seed_parameters_and_demo.sql](file:///D:/Maxwell/Projects/Campus_Uncut/backend/app/db/migrations/003_seed_parameters_and_demo.sql).
- Paste it into the SQL Editor.
- Click **Run**.
- Check the **Messages** tab in the SQL Editor. You should see:
  ```
  NOTICE: Starting Campus Uncut parameter and scenario seeding...
  NOTICE: =========================================================
  NOTICE: CAMPUS UNCUT DATABASE SEEDING VERIFIED:
  NOTICE: Parameters Seeded: 25 (Expected: 25)
  NOTICE: SFIT Reviews/Sessions: 0 (Expected: 0)
  NOTICE: St. Jude (Demo): 19 low contributions, Score: 100 (Expected: 19 low, Score: 100)
  NOTICE: Apex (Demo): 19 high contributions, Score: 100 (Expected: 19 high, Score: 100)
  NOTICE: =========================================================
  ```

---

## 5. Verification SQL Queries

Run the following queries in the Supabase SQL Editor to verify complete database integrity:

### Verification Query 1: Table & View Row Counts
```sql
SELECT 
    'parameters' AS entity, COUNT(*) AS total_records FROM parameters
UNION ALL
SELECT 'question_bank', COUNT(*) FROM question_bank
UNION ALL
SELECT 'colleges', COUNT(*) FROM colleges
UNION ALL
SELECT 'people', COUNT(*) FROM people
UNION ALL
SELECT 'rating_sessions', COUNT(*) FROM rating_sessions
UNION ALL
SELECT 'rating_answers', COUNT(*) FROM rating_answers
UNION ALL
SELECT 'score_contributions', COUNT(*) FROM score_contributions
UNION ALL
SELECT 'college_score_state', COUNT(*) FROM college_score_state;
```
**Expected Results:**
- `parameters`: 25
- `question_bank`: 25
- `colleges`: 3 (SFIT, St. Jude Demo, Apex Demo)
- `people`: 38 (19 St. Jude respondents + 19 Apex respondents)
- `rating_sessions`: 38 (19 submitted for St. Jude + 19 submitted for Apex)
- `rating_answers`: 950 (38 sessions * 25 parameters)
- `score_contributions`: 38 (19 low + 19 high)
- `college_score_state`: 3

---

### Verification Query 2: College Summary & Threshold Counters
```sql
SELECT 
    name, 
    short_code, 
    is_demo, 
    current_score, 
    total_qualifying_low, 
    total_qualifying_high, 
    total_submitted_sessions,
    current_student_submissions,
    alumni_submissions
FROM v_college_summary
ORDER BY name;
```
**Expected Results:**
| name | short_code | is_demo | current_score | total_qualifying_low | total_qualifying_high | total_submitted_sessions | current_student_submissions | alumni_submissions |
|---|---|---|---|---|---|---|---|---|
| Apex Technical Academy (Demo) | APEX-DEMO | true | 100 | 0 | 19 | 19 | 10 | 9 |
| St. Francis Institute of Technology | SFIT | false | 100 | 0 | 0 | 0 | 0 | 0 |
| St. Jude Institute of Technology (Demo) | JUDE-DEMO | true | 100 | 19 | 0 | 19 | 10 | 9 |

---

### Verification Query 3: St. Jude vs Apex Parameter Averages & Demo Isolation
```sql
SELECT 
    is_demo_college,
    COUNT(DISTINCT college_id) AS college_count,
    COUNT(*) AS total_parameter_rows,
    ROUND(MIN(average_score), 2) AS min_average,
    ROUND(MAX(average_score), 2) AS max_average
FROM v_college_parameter_stats
GROUP BY is_demo_college;
```
**Expected Results:**
- `is_demo_college = false`: 0 rows returned (SFIT has 0 reviews).
- `is_demo_college = true`: 50 rows returned (25 parameters for St. Jude + 25 parameters for Apex). St. Jude parameter averages are in the ~2.0–3.0 range; Apex parameter averages are in the ~8.5–9.5 range.

---

### Verification Query 4: Safe Rerun (Idempotency) Test
To verify that the seed migration is completely safe to rerun:
1. Re-execute the entire content of `003_seed_parameters_and_demo.sql` in the SQL Editor.
2. Re-run Verification Query 1.
3. **Verify:** Record counts remain strictly at **25 parameters, 3 colleges, 38 respondents, 38 sessions, 950 answers, 38 contributions**. Zero duplicate records or primary key violations occur.

---

## 6. Security & Secret Management Guidelines

- **Never commit `.env` files or credentials.**
- **Server-Only Access:** The Supabase database connection URI belongs strictly in `backend/.env` under `DATABASE_URL`.
- **Frontend Isolation:** The frontend requires only `VITE_API_BASE_URL=http://localhost:8000` to point to the FastAPI backend. It never connects directly to Supabase.
- **Unverified Status Notice:** In accordance with product principles, all seeded and newly created respondent affiliations remain explicitly labeled unverified in the prototype.
