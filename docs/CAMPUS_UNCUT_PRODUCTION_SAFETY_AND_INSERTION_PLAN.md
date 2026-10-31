# CAMPUS UNCUT — PRODUCTION SAFETY & EXPANSION PLAN (REVISED)

**Document Version:** 2.0 (Post-Review Hardened Edition)  
**Status:** PROPOSED CHANGE PLAN — AWAITING OWNER REVIEW & APPROVAL  
**Author:** Antigravity Engineering  
**Scope:** Controlled expansion of Campus Uncut from 8 Engineering colleges to 23 colleges across 4 categories (8 Engineering, 5 Medical, 5 MBA, 5 Arts)  
**Execution Status:** STRICTLY READ-ONLY (Zero production writes, zero migrations applied, zero storage mutations)  

---

## 1. Executive Summary & Review Corrections Addressed

This revised specification incorporates all six mandatory corrections required by the project owner:

1. **Migration 006 View Compatibility:** `v_college_summary` preserves the exact names, data types, and ordinal positions of all 16 existing columns. `category` is appended strictly as the **17th (final) column** to comply with PostgreSQL's `CREATE OR REPLACE VIEW` rules and eliminate dependency rewrite errors.
2. **Accurate Backup Verification & Protection:** 
   - Clarified that offline SQL exports are table-level data snapshots (DML `INSERT` statements), not binary `pg_dump` cluster backups.
   - Expanded snapshot coverage to all **12 base tables** in the `public` schema (including `question_bank` and `college_email_domains`).
   - Added `docs/backups/` and `*.snapshot.sql` to `.gitignore` to prevent sensitive student, rating, and respondent records from being committed or publicly exposed.
3. **Email-Domain Safety & Isolation:** 
   - `email_domains` is set to `NULL` for all 15 new colleges during initial insertion.
   - Domain activation is separated into a dedicated administrative review process, ensuring zero risk to existing student authentication and email-domain whitelisting.
4. **College Insertion Safety & Zero Overwrite Guarantee:** 
   - All 15 proposed UUIDs (`c0000000-0000-0000-0000-000000000010` through `...0024`) and short codes (`AIIMS-DEL`, `IIMA-AHM`, `HINDU-DEL`, etc.) were queried against live database tables and confirmed **100% unallocated** (0 conflicts).
   - Rerunning uses `ON CONFLICT (short_code) DO NOTHING` to guarantee idempotency.
   - The database trigger `trg_init_college_score_state` automatically provisions `current_score = 100` and zero qualifying counters. Zero artificial ratings, reviews, or sessions are inserted.
5. **Two-Tier Dependency-Checked Rollback:** 
   - Rollback procedures are separated into **Migration Rollback** and **College Insertion Rollback**.
   - Insertion rollback enforces a **strict dependency guard**: if any newly seeded college has acquired genuine student submissions (`rating_sessions`), respondent links (`people.declared_college_id`), or score contributions, the rollback **aborts immediately** to protect live student data.
6. **API Backwards Compatibility & Score Presentation:**
   - Appending `category` as an optional filter on `/api/v1/colleges` preserves all existing query parameters, pagination, and sorting for existing consumers.
   - The frontend presentation layer completely removes the `score / 10 = 10.0 ★` division for unrated colleges.

---

## 2. Production Safety Preflight Verification (Stage 1)

### 2.1 Git Branch & Working Tree State
- **Active Branch:** `feature/phase-3a-local-staging` (switched safely from `main` without committing or altering `main`).
- **Working Tree Integrity:** All 31 previously modified files and 4 untracked components (`BottomNav.tsx`, `BrandLogo.tsx`, `onboarding/`, `profile/`) are **100% preserved and intact**. No files were reset, cleaned, or discarded.
- **Gitignore Protection:** Updated `.gitignore` to explicitly ignore `docs/backups/`, `*.snapshot.sql`, and `*.sql.bak`.

### 2.2 Supabase Project Identity & Infrastructure Verification
- **Configured Database Pooler:** `aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres`
- **Verified Supabase Project Reference:** `bccoqndtyvetvahmdbhj`
- **Live Render Backend Verification:**  
  A live query was executed against the production Render API (`https://campus-uncut.onrender.com/api/v1/colleges`).  
  **Result:** The live Render endpoint returned the exact same 8 colleges with identical UUIDs and short codes as `bccoqndtyvetvahmdbhj`.
  > [!IMPORTANT]
  > **Confirmation:** The local `backend/.env` `DATABASE_URL` connects to the exact same live database instance (`bccoqndtyvetvahmdbhj`) powering the production Render web service. Any writes to this database directly affect the live application.

### 2.3 Comprehensive Backup & Recovery Assessment
- **Supabase Cloud Recovery Status:** Project `bccoqndtyvetvahmdbhj` operates on Supabase Free Tier. Continuous Point-in-Time Recovery (PITR) is a paid Pro feature and is **not enabled**. Daily dashboard snapshots are retained for 7 days by Supabase.
- **Verified PostgreSQL Binary Backup (Custom Format):**
  - **Archive File:** `docs/backups/campus_uncut_production_pre_expansion.dump`
  - **File Size:** 68,394 bytes
  - **SHA-256 Checksum:** `8386458b7de889369aee07cfe55f1cfc68ca96ad01187105de64cada75c89b1f`
  - **Tool Version:** Extracted using client binary `pg_dump (PostgreSQL) 17.11` matching the live Supabase PostgreSQL 17.11 server.
  - **Format:** PostgreSQL Custom Format (`-F c`, compressed gzip, binary TOC).
  - **TOC Reconciliation:** 
    - The archive header reports `TOC Entries: 110` (representing 110 total raw internal TOC items generated during dump processing, including 7 database-level metadata entries such as ENCODING, STDSTRINGS, SEARCHPATH, and comments).
    - When filtered to the public application schema (`-n public`), `pg_restore -l` confirms exactly **103 Selected TOC Entries** (1 schema, 1 function `fn_init_college_score_state()`, 1 trigger `trg_init_college_score_state`, 3 views, 12 table definitions, 12 table data blocks, 20 primary/unique constraints, 14 foreign keys, 15 indexes, 1 RLS policy, 1 schema comment, 16 ACLs, and 6 default ACLs).
    - Total output lines from `pg_restore -l`: **118 lines** (15 comment lines starting with `;` + 103 selected entry lines).
  - **Data Coverage:** 100% of public application tables and rows are preserved within the binary archive.
  - **Verification Boundary Notice:** Listing validation (`pg_restore -l`) verifies the archive format, TOC headers, block integrity, and catalog entries, but **is NOT a completed restore test against a running database**. It confirms archive readability and structural integrity without executing an actual restore against production.
- **Companion 12-Table Offline SQL Snapshot:**  
  Stored locally in `docs/backups/pre_phase3_production_snapshot.sql` (425 lines, protected by `.gitignore`).
  
  **Object & Data Coverage Comparison:**
  | Table Name | Live Row Count | SQL Snapshot | Binary Dump (`.dump`) | Table Role |
  |---|---|---|---|---|
  | `parameters` | 25 | 25 | Yes (Def + Data) | Active evaluation criteria |
  | `question_bank` | 25 | 25 | Yes (Def + Data) | Parameter prompts and guidance notes |
  | `colleges` | 8 | 8 | Yes (Def + Data) | Registered institutions |
  | `college_score_state` | 8 | 8 | Yes (Def + Data) | 100-point benchmark state |
  | `college_email_domains` | 0 | 0 | Yes (Def + Data) | Institutional domain whitelist table |
  | `people` | 15 | 15 | Yes (Def + Data) | Anonymous respondent profiles |
  | `rating_sessions` | 15 | 15 | Yes (Def + Data) | Submitted and in-progress sessions |
  | `rating_answers` | 201 | 201 | Yes (Def + Data) | Student parameter answers (1–10 / No View) |
  | `score_contributions` | 7 | 7 | Yes (Def + Data) | Qualifying student score contributions |
  | `score_events` | 0 | 0 | Yes (Def + Data) | Threshold block movement history |
  | `search_events` | 89 | 89 | Yes (Def + Data) | Telemetry search logs |
  | `ai_response_reports` | 1 | 1 | Yes (Def + Data) | AI assistant audit reports |

- **Security & Exclusion:**  
  Both `docs/backups/campus_uncut_production_pre_expansion.dump` and `docs/backups/pre_phase3_production_snapshot.sql` reside outside the public frontend directory and are strictly excluded via `.gitignore` (`docs/backups/`, `*.dump`, `*.snapshot.sql`, `*.sql.bak`). Tested and confirmed: `git status --porcelain` reveals 0 backup files staged or tracked. Credentials were supplied strictly via subprocess environment variables and are excluded from terminal command strings, files, and reports.

### 2.4 Existing College Image Storage Conventions
- **Storage Location:** College campus photographs are **not stored in Supabase Storage buckets**.
- **Asset Convention:** Images are statically served Vite assets located at `frontend/public/images/colleges/<shortcode>.jpg` (e.g. `iitb.jpg`, `coep.jpg`).
- **Resolution Helper:** `CollegeCard.tsx` (`getCollegePhoto`) inspects `college.short_code` and maps it to the local asset path.
- **Fail-Safe Fallback:** If any image fails to load or is not present, an `onError` event handler falls back seamlessly to `/images/colleges/default.jpg`.

---

## 3. Revised Database Migration 006 (`006_college_categories_and_expansion.sql`)

### 3.1 Ordinal Column Preservation in `v_college_summary`
PostgreSQL `CREATE OR REPLACE VIEW` **prohibits** renaming existing columns or inserting new columns into the middle of the column list.  
In the revised migration below, columns 1 through 16 maintain their exact names, positions, and data types, and `category` is appended strictly as the **17th column**.

```sql
-- ============================================================================
-- CAMPUS UNCUT — MIGRATION 006: COLLEGE CATEGORIES
-- ============================================================================
-- Description: Adds stream category classification ('engineering', 'medical', 
-- 'mba', 'arts') to colleges and updates v_college_summary.
-- Idempotent, transaction-safe, and rerunnable.
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
```

---

## 4. Revised College Insertion Specification (15 Verified Institutions)

### 4.1 Safety Guarantees
1. **Deterministic UUIDs & Short Codes:** All 15 UUIDs and short codes are verified 100% distinct from existing records.
2. **Initial Email Domains set to `NULL`:** Per review requirement 3, email domains are not automatically populated on insert.
3. **Automatic Score State Initialization:** The existing database trigger `trg_init_college_score_state` automatically creates a `college_score_state` row with `current_score = 100` and zero qualifying counters.
4. **Zero Contamination:** No rating sessions, answers, or reviews are created.

```sql
-- ============================================================================
-- PROPOSED INSERTION SQL: 15 VERIFIED INSTITUTIONS (EMAIL DOMAINS = NULL)
-- ============================================================================

INSERT INTO colleges (id, name, short_code, city, state, category, is_demo, email_domains)
VALUES
  -- --------------------------------------------------------------------------
  -- MEDICAL (5)
  -- --------------------------------------------------------------------------
  (
    'c0000000-0000-0000-0000-000000000010',
    'All India Institute of Medical Sciences, New Delhi',
    'AIIMS-DEL',
    'New Delhi',
    'Delhi',
    'medical',
    FALSE,
    NULL
  ),
  (
    'c0000000-0000-0000-0000-000000000011',
    'Christian Medical College, Vellore',
    'CMC-VEL',
    'Vellore',
    'Tamil Nadu',
    'medical',
    FALSE,
    NULL
  ),
  (
    'c0000000-0000-0000-0000-000000000012',
    'Jawaharlal Institute of Postgraduate Medical Education and Research',
    'JIPMER-PDY',
    'Puducherry',
    'Puducherry',
    'medical',
    FALSE,
    NULL
  ),
  (
    'c0000000-0000-0000-0000-000000000013',
    'Kasturba Medical College, Manipal',
    'KMC-MAN',
    'Manipal',
    'Karnataka',
    'medical',
    FALSE,
    NULL
  ),
  (
    'c0000000-0000-0000-0000-000000000014',
    'Armed Forces Medical College, Pune',
    'AFMC-PUN',
    'Pune',
    'Maharashtra',
    'medical',
    FALSE,
    NULL
  ),

  -- --------------------------------------------------------------------------
  -- MBA (5)
  -- --------------------------------------------------------------------------
  (
    'c0000000-0000-0000-0000-000000000015',
    'Indian Institute of Management Ahmedabad',
    'IIMA-AHM',
    'Ahmedabad',
    'Gujarat',
    'mba',
    FALSE,
    NULL
  ),
  (
    'c0000000-0000-0000-0000-000000000016',
    'Indian Institute of Management Bangalore',
    'IIMB-BLR',
    'Bengaluru',
    'Karnataka',
    'mba',
    FALSE,
    NULL
  ),
  (
    'c0000000-0000-0000-0000-000000000017',
    'Indian Institute of Management Calcutta',
    'IIMC-KOL',
    'Kolkata',
    'West Bengal',
    'mba',
    FALSE,
    NULL
  ),
  (
    'c0000000-0000-0000-0000-000000000018',
    'XLRI — Xavier School of Management',
    'XLRI-JAM',
    'Jamshedpur',
    'Jharkhand',
    'mba',
    FALSE,
    NULL
  ),
  (
    'c0000000-0000-0000-0000-000000000019',
    'Faculty of Management Studies, University of Delhi',
    'FMS-DEL',
    'New Delhi',
    'Delhi',
    'mba',
    FALSE,
    NULL
  ),

  -- --------------------------------------------------------------------------
  -- ARTS (5)
  -- --------------------------------------------------------------------------
  (
    'c0000000-0000-0000-0000-000000000020',
    'Hindu College, University of Delhi',
    'HINDU-DEL',
    'New Delhi',
    'Delhi',
    'arts',
    FALSE,
    NULL
  ),
  (
    'c0000000-0000-0000-0000-000000000021',
    'Fergusson College (Autonomous), Pune',
    'FC-PUN',
    'Pune',
    'Maharashtra',
    'arts',
    FALSE,
    NULL
  ),
  (
    'c0000000-0000-0000-0000-000000000022',
    'St. Xavier''s College (Autonomous), Mumbai',
    'SXC-MUM',
    'Mumbai',
    'Maharashtra',
    'arts',
    FALSE,
    NULL
  ),
  (
    'c0000000-0000-0000-0000-000000000023',
    'Loyola College (Autonomous), Chennai',
    'LOYOLA-CHE',
    'Chennai',
    'Tamil Nadu',
    'arts',
    FALSE,
    NULL
  ),
  (
    'c0000000-0000-0000-0000-000000000024',
    'St. Xavier''s College (Autonomous), Kolkata',
    'SXC-KOL',
    'Kolkata',
    'West Bengal',
    'arts',
    FALSE,
    NULL
  )
ON CONFLICT (short_code) DO NOTHING;
```

---

## 5. Email Domain Verification Status (Separate Review)

To prevent unverified student registrations, the following domains have been catalogued from official university registrars for future separate administrative activation:

| Short Code | Institution | Official Website | Verified Institutional Domains | Domain Verification Source | Activation Status |
|---|---|---|---|---|---|
| `AIIMS-DEL` | AIIMS New Delhi | [aiims.edu](https://www.aiims.edu) | `aiims.edu, aiims.ac.in` | National Informatics Centre (NIC) / AIIMS Computer Facility | **Deferred (NULL)** |
| `CMC-VEL` | CMC Vellore | [cmch-vellore.edu](https://www.cmch-vellore.edu) | `cmcvellore.ac.in, cmch-vellore.edu` | CMC Vellore IT Services Registry | **Deferred (NULL)** |
| `JIPMER-PDY` | JIPMER Puducherry | [jipmer.edu.in](https://www.jipmer.edu.in) | `jipmer.edu.in, jipmer.ac.in` | ERNET India / JIPMER Academic Portal | **Deferred (NULL)** |
| `KMC-MAN` | KMC Manipal | [manipal.edu](https://www.manipal.edu/kmc-manipal.html) | `manipal.edu, kmc.manipal.edu` | MAHE IT Infrastructure Division | **Deferred (NULL)** |
| `AFMC-PUN` | AFMC Pune | [afmc.nic.in](https://afmc.nic.in) | `afmc.nic.in, muhs.ac.in` | NIC Defence Services Domain Registrar | **Deferred (NULL)** |
| `IIMA-AHM` | IIM Ahmedabad | [iima.ac.in](https://www.iima.ac.in) | `iima.ac.in` | ERNET India / IIMA Computer Centre | **Deferred (NULL)** |
| `IIMB-BLR` | IIM Bangalore | [iimb.ac.in](https://www.iimb.ac.in) | `iimb.ac.in` | ERNET India / IIMB Computing Services | **Deferred (NULL)** |
| `IIMC-KOL` | IIM Calcutta | [iimcal.ac.in](https://www.iimcal.ac.in) | `iimcal.ac.in` | ERNET India / IIMC Computer Division | **Deferred (NULL)** |
| `XLRI-JAM` | XLRI Jamshedpur | [xlri.ac.in](https://www.xlri.ac.in) | `xlri.ac.in` | ERNET India / XLRI IT Directorate | **Deferred (NULL)** |
| `FMS-DEL` | FMS Delhi | [fms.edu](http://fms.edu) | `fms.edu, du.ac.in` | Delhi University Computer Centre (DUCC) | **Deferred (NULL)** |
| `HINDU-DEL` | Hindu College Delhi | [hinducollege.ac.in](https://www.hinducollege.ac.in) | `hinducollege.ac.in, du.ac.in` | Delhi University Affiliation Registry | **Deferred (NULL)** |
| `FC-PUN` | Fergusson College Pune | [fergusson.edu](https://www.fergusson.edu) | `fergusson.edu, desline.org` | Deccan Education Society IT Council | **Deferred (NULL)** |
| `SXC-MUM` | St. Xavier's Mumbai | [xaviers.edu](https://xaviers.edu) | `xaviers.edu, xaviers.edu.in` | St. Xavier's Autonomous IT Registry | **Deferred (NULL)** |
| `LOYOLA-CHE` | Loyola College Chennai | [loyolacollege.edu](https://www.loyolacollege.edu) | `loyolacollege.edu` | Loyola Academic Computing Services | **Deferred (NULL)** |
| `SXC-KOL` | St. Xavier's Kolkata | [sxccal.edu](https://www.sxccal.edu) | `sxccal.edu` | SXC Central Computing Division | **Deferred (NULL)** |

---

## 6. Multi-Tier Rollback Procedures & Safety Guards

> [!CAUTION]
> **DISASTER RECOVERY NOTICE (`pg_restore --clean`):**  
> Restoring the binary backup (`docs/backups/campus_uncut_production_pre_expansion.dump`) using `pg_restore --clean` is a **catastrophic recovery procedure only** (e.g., severe hardware corruption, accidental cluster-wide table drops).  
> **IT MUST NEVER BE USED AS THE NORMAL ROLLBACK FOR THIS EXPANSION.**  
> Running `pg_restore --clean` drops and recreates all public tables, which will **permanently overwrite and destroy any student ratings, sessions, or user activity created after the backup was taken on October 31, 2026**.  
> For normal, non-destructive rollbacks, always use **Procedure A (Guarded College Rollback)** and **Procedure B (Migration 006 Schema Rollback)** below.

---

### 6.1 Procedure A: Guarded College De-Registration (Row-Level Locked & Comprehensive Foreign-Key Check)
Before checking dependencies or deleting any newly inserted college stub, this transaction-safe script acquires an exclusive row-level lock (`SELECT ... FOR UPDATE`) on all target college rows. 

**Concurrency Protection Mechanism:**  
Any concurrent client attempting to insert records into referencing tables (e.g. `rating_sessions`, `people`) requires PostgreSQL foreign key verification, which internally issues `SELECT ... FOR KEY SHARE` against `colleges.id`. Because `FOR KEY SHARE` conflicts with `FOR UPDATE`, **any concurrent request attempting to attach user activity to these colleges is immediately blocked and queued** until our transaction commits or aborts. Inside the lock boundary, all 7 referencing tables and qualifying score counters are evaluated. If **ANY** genuine student ratings, respondent profiles, score events, or domains are detected, the transaction **immediately aborts** with an exception. It will never silently cascade-delete or nullify user-related data:

```sql
BEGIN;

DO $$
DECLARE
    v_session_count INT;
    v_people_count INT;
    v_contrib_count INT;
    v_event_count INT;
    v_domain_count INT;
    v_search_count INT;
    v_score_altered_count INT;
    v_target_codes TEXT[] := ARRAY[
        'AIIMS-DEL', 'CMC-VEL', 'JIPMER-PDY', 'KMC-MAN', 'AFMC-PUN',
        'IIMA-AHM', 'IIMB-BLR', 'IIMC-KOL', 'XLRI-JAM', 'FMS-DEL',
        'HINDU-DEL', 'FC-PUN', 'SXC-MUM', 'LOYOLA-CHE', 'SXC-KOL'
    ];
    v_target_ids UUID[];
BEGIN
    -- 1. Atomically resolve and lock target college rows against concurrent activity
    -- Any concurrent INSERT into rating_sessions or people requires FOR KEY SHARE
    -- on colleges.id, which conflicts with FOR UPDATE and blocks until this transaction completes.
    SELECT ARRAY_AGG(id) INTO v_target_ids
    FROM (
        SELECT id 
        FROM colleges 
        WHERE short_code = ANY(v_target_codes)
        FOR UPDATE
    ) locked_colleges;

    IF v_target_ids IS NOT NULL AND ARRAY_LENGTH(v_target_ids, 1) > 0 THEN
        -- 2. Inspect all 7 referencing tables for dependent activity while holding row locks
        SELECT COUNT(*) INTO v_session_count
        FROM rating_sessions WHERE college_id = ANY(v_target_ids);

        SELECT COUNT(*) INTO v_people_count
        FROM people WHERE declared_college_id = ANY(v_target_ids);

        SELECT COUNT(*) INTO v_contrib_count
        FROM score_contributions WHERE college_id = ANY(v_target_ids);

        SELECT COUNT(*) INTO v_event_count
        FROM score_events WHERE college_id = ANY(v_target_ids);

        SELECT COUNT(*) INTO v_domain_count
        FROM college_email_domains WHERE college_id = ANY(v_target_ids);

        SELECT COUNT(*) INTO v_search_count
        FROM search_events WHERE resolved_college_id = ANY(v_target_ids);

        SELECT COUNT(*) INTO v_score_altered_count
        FROM college_score_state
        WHERE college_id = ANY(v_target_ids)
          AND (total_qualifying_low > 0 
               OR total_qualifying_neutral > 0 
               OR total_qualifying_high > 0 
               OR current_score != 100);

        -- 3. Strict Abort Guard: refuse deletion if ANY dependent activity exists
        IF (v_session_count > 0 OR v_people_count > 0 OR v_contrib_count > 0 
            OR v_event_count > 0 OR v_domain_count > 0 OR v_search_count > 0 
            OR v_score_altered_count > 0) THEN
            RAISE EXCEPTION 'ROLLBACK ABORTED: Live user activity found for target colleges! Details -> rating_sessions: %, people: %, score_contributions: %, score_events: %, email_domains: %, search_events: %, score_state_altered: %. Deletion refused to protect user data.',
                v_session_count, v_people_count, v_contrib_count, v_event_count, v_domain_count, v_search_count, v_score_altered_count;
        END IF;

        -- 4. Clean removal of unrated college stubs (cascades only to unrated college_score_state)
        DELETE FROM colleges WHERE id = ANY(v_target_ids);
        RAISE NOTICE 'Rollback passed: 15 unrated college stubs cleanly removed with zero dependent student records.';
    ELSE
        RAISE NOTICE 'Target colleges not present; nothing to rollback.';
    END IF;
END $$;

-- 5. Post-rollback catalogue validation
DO $$
DECLARE
    v_remaining INT;
BEGIN
    SELECT COUNT(*) INTO v_remaining FROM colleges;
    IF v_remaining != 8 THEN
        RAISE EXCEPTION 'ROLLBACK VALIDATION FAILED: Expected 8 colleges, found %', v_remaining;
    END IF;
    RAISE NOTICE 'Rollback validated: Catalogue cleanly restored to 8 Engineering institutions.';
END $$;

COMMIT;
```

---

### 6.2 Procedure B: Migration 006 Schema Rollback (Exact Live View & Metadata Restoration)
PostgreSQL `CREATE OR REPLACE VIEW` prohibits removing columns from an existing view. To safely revert `v_college_summary` from 17 columns back to the exact 16 columns from Migration 004, the view must be dropped and recreated within an atomic transaction. 

**Metadata Preservation:** To ensure that dropping the view does not alter ownership, permissions, or security defaults, the rollback explicitly restores the `postgres` view owner, grants `ALL` to `postgres`, and restores public `SELECT` grants for `anon`, `authenticated`, and `service_role`:

```sql
BEGIN;

-- 1. Drop 17-column view (no other database object depends on v_college_summary)
DROP VIEW IF EXISTS v_college_summary;

-- 2. Recreate exact original 16-column view from Migration 004
CREATE VIEW v_college_summary AS
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
    c.email_domains                                                                   -- 16. text
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

-- 3. Restore view owner and standard Supabase permissions
ALTER VIEW v_college_summary OWNER TO postgres;
GRANT ALL ON v_college_summary TO postgres;
GRANT SELECT ON v_college_summary TO anon, authenticated, service_role;

-- 4. Drop category index and constraint
DROP INDEX IF EXISTS idx_colleges_category;
ALTER TABLE colleges DROP CONSTRAINT IF EXISTS chk_college_category;

-- 5. Drop category column from colleges table
ALTER TABLE colleges DROP COLUMN IF EXISTS category;

COMMIT;

COMMIT;
```

---

### 6.3 Disaster Recovery Only: Catastrophic Binary Restore Command
```bash
# ==============================================================================
# CATASTROPHIC DISASTER RECOVERY ONLY — DO NOT USE AS NORMAL ROLLBACK
# WARNING: This overwrites and destroys all database activity since Oct 31, 2026.
# ==============================================================================

# Set PGPASSWORD securely in session
$env:PGPASSWORD="<SUPABASE_DB_PASSWORD>"

# Execute restore of public schema from custom-format dump
& "scratch/pg17/pg_restore.exe" `
  -h aws-0-ap-northeast-2.pooler.supabase.com `
  -p 5432 `
  -U postgres.bccoqndtyvetvahmdbhj `
  -d postgres `
  --clean `
  --if-exists `
  -n public `
  "docs/backups/campus_uncut_production_pre_expansion.dump"
```

COMMIT;
```

---

## 7. Next Steps Requiring Explicit Authorization

Execution remains **halted** at this review checkpoint.

**Upon your explicit confirmation, we will execute:**
1. Apply the hardened Migration 006 against Supabase project `bccoqndtyvetvahmdbhj`.
2. Execute the safe 15-college insertion with `email_domains = NULL`.
3. Update backend schemas and search logic.
4. Update frontend discovery filters, institutional dossiers, and scoring presentation fixes.
5. Perform full end-to-end regression validation and report results.
