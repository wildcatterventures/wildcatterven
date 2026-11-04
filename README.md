# Campus Uncut

> **College life. Without the editing.**  
> A student-powered college intelligence and rating platform designed to surface authentic, lived campus experiences across academics, placements, facilities, hostel life, campus culture, and personal safety—replacing glossy promotional brochures with verified student reality.

---

## 🏛️ The 23-College Multi-Stream Catalogue

Campus Uncut features a comprehensive catalogue of **23 premier higher education institutions across India**, spanning four academic disciplines:

```
                                  CAMPUS UNCUT
                               23 Premier Colleges
                                       │
        ┌──────────────────┬───────────┴───────────┬──────────────────┐
        ▼                  ▼                       ▼                  ▼
   Engineering          Medical                 Business          Liberal Arts
   (8 Colleges)       (5 Colleges)            (5 Colleges)        (5 Colleges)
```

### 1. Engineering & Technology (8 Colleges)
* **IIT Bombay** — Indian Institute of Technology Bombay, Powai, Mumbai
* **COEP Technological University** — College of Engineering Pune, Shivajinagar, Pune
* **VJTI Mumbai** — Veermata Jijabai Technological Institute, Matunga, Mumbai
* **PICT Pune** — Pune Institute of Computer Technology, Dhankawadi, Pune
* **SPIT Mumbai** — Sardar Patel Institute of Technology, Andheri, Mumbai
* **Walchand College of Engineering** — Sangli, Maharashtra
* **SFIT Mumbai** — St. Francis Institute of Technology, Borivali, Mumbai
* **MKSSS Cummins College of Engineering for Women** — Karvenagar, Pune

### 2. Medical & Health Sciences (5 Colleges)
* **AIIMS New Delhi** — All India Institute of Medical Sciences, Ansari Nagar, New Delhi
* **CMC Vellore** — Christian Medical College, Vellore, Tamil Nadu
* **Seth GSMC & KEM Hospital** — Seth Gordhandas Sunderdas Medical College, Parel, Mumbai
* **Kasturba Medical College (KMC)** — Manipal Academy of Higher Education, Manipal, Karnataka
* **Grant Government Medical College & Sir JJ Group of Hospitals** — Byculla, Mumbai

### 3. Management & MBA Institutions (5 Colleges)
* **IIM Ahmedabad** — Indian Institute of Management Ahmedabad, Vastrapur, Ahmedabad, Gujarat
* **IIM Bangalore** — Indian Institute of Management Bangalore, Bannerghatta Road, Bengaluru, Karnataka
* **SPJIMR Mumbai** — S.P. Jain Institute of Management and Research, Andheri, Mumbai
* **JBIMS Mumbai** — Jamnalal Bajaj Institute of Management Studies, Churchgate, Mumbai
* **XLRI Jamshedpur** — Xavier School of Management, Circuit House Area, Jamshedpur, Jharkhand

### 4. Liberal Arts & Sciences (5 Colleges)
* **St. Stephen's College** — University Enclave, North Campus, Delhi University, Delhi
* **Loyola College** — Sterling Road, Nungambakkam, Chennai, Tamil Nadu
* **St. Xavier's College (Autonomous)** — Dhobi Talao, Fort, Mumbai, Maharashtra
* **Miranda House** — University Enclave, North Campus, Delhi University, Delhi
* **Fergusson College (Autonomous)** — FC Road, Shivajinagar, Pune, Maharashtra

---

## ⚖️ The Dual Scoring Model

Campus Uncut maintains two distinct, mathematically separated scoring metrics to prevent confusion between institutional track records and direct student feedback:

```
┌─────────────────────────────────────────┐   ┌─────────────────────────────────────────┐
│     100-Point Institutional Score       │   │    Student Experience Average (/10)     │
├─────────────────────────────────────────┤   ├─────────────────────────────────────────┤
│ • Baseline starts at 100 points         │   │ • Arithmetic mean of overall ratings    │
│ • Shifts by ±1 per 20 qualifying reviews│   │ • Derived from 25 evaluation parameters │
│ • Strict audit-trail event logging      │   │ • Dynamic live database aggregate       │
│ • Resistant to short-term brigading     │   │ • Differentiates students vs. alumni    │
└─────────────────────────────────────────┘   └─────────────────────────────────────────┘
```

### A. 100-Point Institutional Score
Every college starts with an unweighted baseline score of **100**. This institutional score functions as a longitudinal reputation index that updates only when verified threshold milestones are achieved:

| Submitted Overall Rating | Effect on College Score | Threshold Requirement |
| :--- | :---: | :--- |
| **Below 4.0** (Critical) | **−1 Point** | For every complete block of 20 unique qualifying respondents |
| **4.0 to below 8.0** (Neutral) | **No Change (0)** | Does not trigger threshold progression |
| **8.0 and Above** (Commendable) | **+1 Point** | For every complete block of 20 unique qualifying respondents |

* **Transactional Integrity:** Score adjustments are computed in PostgreSQL transactions. Each adjustment writes an immutable record to `score_events`, and a unique constraint (`college_id`, `threshold_block_id`) guarantees that a block can never be awarded twice.
* **Distinct Respondent Safeguard:** Only the first qualifying submission per verified student/alumni profile per institution counts toward threshold progression (`score_contributions`).

### B. Student Experience Rating (Scale of 1.0 to 10.0★)
The student experience metric represents the unweighted arithmetic mean of actual respondent submissions:
$$\text{Student Experience Average} = \frac{1}{N} \sum_{i=1}^{N} \text{calculated\_overall\_rating}_i$$

* Evaluated across **25 granular parameters** (academics, professor accessibility, hostel quality, gender safety, placement reality, ragging, campus freedom, hygiene, etc.).
* **"No View" Handling:** Unanswered or "No View" choices do not carry a score of zero; they are completely excluded from the denominator.
* **Unrated Colleges:** Institutions with zero submitted reviews cleanly return `NULL` (displayed in the UI as an "Unrated" state rather than defaulting to 0 or 10).
* **Segmented Cohorts:** Supports real-time breakdown of ratings between currently enrolled students and graduated alumni.

---

## 🧭 Core User Journeys

1. **Conversational Multi-Stream Exploration:**
   Visitors can filter by stream (Engineering, Medical, Management, Arts), search by city or keyword, or query the conversational AI assistant in natural language (e.g., *"Compare placement reality between VJTI and PICT"* or *"Show me women's safety and hostel curfews at AIIMS New Delhi"*).
2. **Interactive College Dossiers:**
   Each college page surfaces verified placement evidence (median packages, highest packages, audited placement reports, verified recruiter rosters), parameter score distributions, cohort demographics, and official address/accreditation details.
3. **Conversational Rating Flow:**
   Students and alumni rate their campus across 25 targeted parameters via text or voice. Submissions require institutional email or affiliation declaration and update live aggregates transactionally upon completion.
4. **Isolated Scoring Progression Demo:**
   Built-in simulation environments (e.g., demonstrating the transition from 19 to 20 qualifying respondents on PICT and VJTI) demonstrate the mathematical transition of institutional scores from 100 to 99 or 101.


---

## 🛠️ Technology Stack & Architecture

Campus Uncut uses a modern, high-performance distributed web and native stack engineered for fast response times, zero tracking footprint, and edge deployments:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT / APPLICATION LAYER                      │
├───────────────────────────────────┬────────────────────────────────────┤
│           Web Client              │        Native Android App          │
│    React 18 + Vite + Tailwind     │     Capacitor 8.6 + Target SDK 36  │
│  (Vercel Production SPA Hosting)  │  (Play Console Closed Testing AAB) │
└─────────────────┬─────────────────┴──────────────────┬─────────────────┘
                  │                                    │
                  ▼                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        BACKEND SERVICES LAYER                          │
├────────────────────────────────────────────────────────────────────────┤
│           FastAPI (Python 3.11) on Render Cloud Container              │
│  • Pydantic v2 Contract Validation    • Tool-Calling AI Orchestrator   │
│  • Transactional Scoring Service      • Institutional Domain Guard     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         DATA & STORAGE LAYER                           │
├────────────────────────────────────────────────────────────────────────┤
│                      Supabase PostgreSQL Instance                      │
│  • Immutable `score_events` Audit     • Materialized `v_college_summary`│
│  • 25 Question Parameter Engine       • Strict Row-Level Foreign Keys  │
└────────────────────────────────────────────────────────────────────────┘
```

### Core Technologies
* **Frontend Application:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Context State Management.
* **Android Native Runtime:** Capacitor 8.6 with Java 21, Android API Level 36 (`compileSdk 36`, `targetSdk 36`, `minSdk 24`), and native speech recognition plugin (`@capgo/capacitor-speech-recognition`).
* **Backend API Engine:** Python 3.11, FastAPI, Pydantic v2, Uvicorn, Async HTTPX client.
* **Database & Persistence:** Supabase PostgreSQL with custom aggregate functions, relational constraints, and SQL migrations (`001` through `007`).
* **AI Orchestration:** Configurable tool-calling LLM engine (Groq / Gemini models) strictly operating within deterministic backend tool boundaries.
* **Production Hosting:** Vercel (Frontend Global CDN) + Render (Backend API Service) + Google Play Console (Android App Bundle).

---

## 📁 Repository Directory Structure

```
Campus_Uncut/
├── frontend/                               # React + Vite + Capacitor Frontend
│   ├── android/                            # Native Android Capacitor Studio Project
│   │   ├── app/
│   │   │   ├── src/main/
│   │   │   │   ├── AndroidManifest.xml     # Clean permissions (INTERNET, RECORD_AUDIO only)
│   │   │   │   ├── java/.../MainActivity.java
│   │   │   │   └── res/values/strings.xml  # App title: "Campus Uncut"
│   │   │   ├── build.gradle                # targetSdk 36, versionCode 10001, v1.1.0
│   │   │   └── keystore.properties         # Protected local release signing config
│   │   └── build.gradle
│   ├── src/
│   │   ├── components/                     # Header, navigation, alerts, voice badges
│   │   ├── features/
│   │   │   ├── assistant/                  # Natural language conversational AI interface
│   │   │   ├── colleges/                   # 23-College grid, stream filters, intelligence dossier
│   │   │   ├── demo/                       # Isolated 19-to-20 threshold scoring simulations
│   │   │   ├── home/                       # Conversational hero & value proposition
│   │   │   ├── match/                      # Student campus affinity matcher
│   │   │   └── rating/                     # 25-Parameter conversational rating workflow
│   │   ├── lib/                            # API client, voice recognition, scoring logic
│   │   ├── types/                          # TypeScript contracts (colleges, streams, ratings)
│   │   ├── App.tsx                         # Client-side SPA routing
│   │   └── main.tsx
│   ├── capacitor.config.ts                 # appId: com.wildcatterventures.campusuncut
│   ├── package.json
│   └── vite.config.ts
├── backend/                                # FastAPI Python Backend
│   ├── app/
│   │   ├── agents/                         # AI assistant prompt templates & tool execution
│   │   ├── api/v1/                         # REST endpoints (colleges, ratings, assistant, health)
│   │   ├── core/                           # Configuration, CORS security, database connection
│   │   ├── db/
│   │   │   └── migrations/                 # Migrations 001 through 007
│   │   ├── schemas/                        # Pydantic validation models
│   │   ├── services/                       # Scoring recalculations & domain validation
│   │   └── main.py                         # Application entrypoint & middleware
│   ├── tests/                              # Comprehensive pytest test suite
│   └── requirements.txt
├── docs/                                   # Architectural specifications & audits
└── README.md
```

---

## 🗄️ Database Design & Applied Migrations

The database schema is organized around transactional integrity and zero data leakage:

| Migration | Title | Purpose |
| :---: | :--- | :--- |
| **`001`** | Core Schema & Seed Data | Initial tables: `colleges`, `parameters`, `question_bank`, `people`, `rating_sessions`, `rating_answers`, `college_score_state`, `score_events`, and `score_contributions`. |
| **`002`** | Views & Aggregates | Created base `v_college_summary` view aggregating respondent counts and parameter metrics. |
| **`003`** | Seed Parameters & Demo | Populated the 25 evaluation parameters and demo test fixtures. |
| **`004`** | College Email Validation | Added `college_email_domains` table and domain affinity validation rules. |
| **`005`** | College Expansion | Expanded institutional directory to 23 colleges across Engineering, Medicine, Management, and Arts. |
| **`006`** | Performance Indexing | Added composite indexes on `rating_sessions(college_id, status)` and `score_events(college_id)`. |
| **`007`** | Dynamic Student Experience | Added column 18 (`student_experience_average`) to `v_college_summary` calculated dynamically via `AVG(rs.calculated_overall_rating)`. |

---

## 🔌 REST API Specification

### 1. System Health
```http
GET /health
```
* **Response:** `200 OK` `{"status": "healthy", "service": "campus-uncut-api", "version": "1.1.0"}`

### 2. Colleges & Discovery
```http
GET /api/v1/colleges
GET /api/v1/colleges?stream=engineering
GET /api/v1/colleges?q=IIT
```
* **Response:** Array of college summaries:
```json
[
  {
    "id": "c1a2b3c4-...",
    "name": "IIT Bombay",
    "short_name": "IITB",
    "stream": "engineering",
    "city": "Mumbai",
    "state": "Maharashtra",
    "current_score": 100,
    "student_experience_average": 8.75,
    "total_ratings": 42,
    "verified_reviews_count": 42
  }
]
```

### 3. Detailed College Ratings
```http
GET /api/v1/colleges/{college_id}/ratings
```
* Returns full parameter breakdown across all 25 categories, excluding "No View" entries from numeric calculations.

### 4. Rating Session Lifecycle
```http
POST /api/v1/rating-sessions            # Initialize anonymous session with college affinity
PUT  /api/v1/rating-sessions/{id}/answer # Record/amend parameter answer (1-10 or "No View")
POST /api/v1/rating-sessions/{id}/submit # Transactionally finalize and recalculate scores
```

### 5. Conversational AI Assistant
```http
POST /api/v1/assistant/chat
```
* Accepts natural language queries. Uses tool-calling to fetch database facts and returns synthesized, factual intelligence dossiers.
