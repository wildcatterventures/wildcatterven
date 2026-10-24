# Campus Uncut — Backend API

FastAPI backend for Campus Uncut, a student-powered college intelligence platform.

---

## 1. Local Development Setup (Windows PowerShell)

### Prerequisites
- Python 3.12+
- Supabase PostgreSQL instance (Free tier) with migrations 001–003 applied

### Step 1: Environment Activation & Dependency Installation
From the repository root (`d:\Maxwell\Projects\Campus_Uncut`):

```powershell
# Navigate to backend directory
cd backend

# If virtual environment is not already created:
python -m venv .venv

# Activate virtual environment
.venv\Scripts\Activate.ps1

# Install pinned dependencies
pip install -r requirements.txt
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:

```powershell
cp .env.example .env
```

Edit `backend/.env` with your actual settings:
```ini
APP_ENV=development
HOST=0.0.0.0
PORT=8000
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
LLM_PROVIDER=mock       # Set to "groq" when GROQ_API_KEY is configured
LLM_API_KEY=            # Your free-tier Groq API key
LLM_MODEL=llama-3.3-70b-versatile
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

---

## 2. Running the Backend Locally

Start the development server with live reload:

```powershell
# From backend directory with .venv active:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API Base URL: `http://localhost:8000`
- Interactive OpenAPI Swagger Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

---

## 3. Running Automated Tests

Run the complete automated test suite (scoring engine, API lifecycles, duplicate prevention, and AI tool orchestration):

```powershell
# From repository root or backend directory:
.venv\Scripts\pytest backend/tests -v
```

---

## 4. REST API Endpoint Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | System health and database connectivity check |
| `GET` | `/api/colleges?q=...&demo=...` | College directory search with partial matching and demo toggle |
| `POST` | `/api/colleges` | Create unknown college (initialized at score 100, 0 ratings) |
| `GET` | `/api/colleges/{id}` | College profile summary and threshold counters |
| `GET` | `/api/colleges/{id}/ratings` | Detailed parameter averages, counts, and score distributions |
| `POST` | `/api/respondents` | Upsert respondent profile with self-declared affiliation |
| `POST` | `/api/rating-sessions` | Start or resume in-progress rating session |
| `GET` | `/api/rating-sessions/{id}` | Retrieve session answers and completeness status |
| `PUT` | `/api/rating-sessions/{id}/answers/{param_id}` | Save or correct rating answer (`1-10` or `is_no_view=true`) |
| `POST` | `/api/rating-sessions/{id}/submit` | Single atomic PostgreSQL transaction submission and scoring |
| `POST` | `/api/assistant/message` | Conversational AI orchestration with 9 approved backend tools |
