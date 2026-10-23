Campus Uncut
College life. Without the editing.

A student-powered college intelligence platform for exploring the experiences behind the official college brochure.

Campus Uncut lets current students and alumni share their experiences across academics, placements, campus culture, safety, facilities, hostel life, and more. Visitors can explore college scores and individual parameter ratings using natural-language text or voice.
[!IMPORTANT]
Confidential prototype. Keep the source code private. Do not publish the repository, screenshots, assignment details, or a publicly accessible copy of the application unless written permission has been obtained from the relevant rights holder. Share any demo only through an explicitly authorised submission channel.

Product principles
- Student perspective first: Surface lived experiences, not college marketing claims.
- Conversational by design: Users can type or speak naturally instead of navigating a complicated set of forms.
- Transparent scoring: Explain the score, rating counts, sample size, and data limitations.
- AI with guardrails: AI understands intent and orchestrates approved tools; application code validates data and calculates every official score.
- Responsive everywhere: A coherent mobile and laptop experience using the same backend.
- Honest verification status: The current prototype uses self-declared affiliation. It must not imply that a respondent is verified.
- Zero-cost development target: Use free tiers and browser-native capabilities only; do not enable paid upgrades or services.
Core user journeys
1. Explore a college
Anyone can search without signing in. A visitor can type or say things such as:
- “Show me the hostel and placement ratings at SFIT.”
- “What do students think of the faculty at ABC College?”
- “How many current students and alumni have contributed?”
- “Which parameters have the lowest average ratings?”
The AI identifies the college and requested information, calls backend tools, and presents results retrieved from the database. If data is missing or the sample is small, the app says so instead of inventing ratings.
2. Rate a college as a current student
1. The user says or types that they want to rate their college.
2. The app asks for the college and whether the person is a current student or alumnus if that information is not already clear.
3. The user self-declares their affiliation. Affiliation is unverified in the current prototype.
4. A conversational flow collects parameter ratings from 1–10 or No view.
5. The user can correct answers before submitting.
6. The backend validates and saves the completed session, calculates the overall rating, updates aggregates, applies any qualifying score adjustment, and returns the new result.
3. Rate a college as an alumnus
The flow is the same as the current-student flow, but the response records the person's self-declared status as alumnus. Future versions may add a suitable alumni-verification route.
4. Voice or text
Voice and text are two input methods for the same workflows. Browser speech recognition is optional and varies by browser; text input must always remain available. Spoken responses use browser speech synthesis when supported.
Rating parameters
The initial question bank covers:
- College food and affordability
- Ragging, bullying, discrimination, and harassment
- Professor quality, accessibility, and conduct
- Toilet and washroom quality
- Classroom, laboratory, and campus infrastructure
- Quality of fellow students and campus culture
- Campus placements, career support, and internship opportunities
- Women's safety and general campus safety
- Party scene and alcohol culture
- College management and complaint resolution
- Academic freedom and freedom of expression
- Hostel quality, cleanliness, room occupancy, and curfews
- Alumni interaction and networking
Additional categories can address realities at residential or remote campuses, including drinking water, electricity, internet/mobile connectivity, transport, access to healthcare and shops, emergency travel, laundry, counselling, and access to facilities.

Parameters are stored in the database so the question bank can evolve without rewriting the frontend. Every parameter supports a numeric score from 1 through 10 or No view. No view is not a zero and is excluded from numeric averages.
College scoring rules
Each college begins with a score of 100. The college score is distinct from the average ratings for individual parameters.
Submitted overall rating	Effect on the college score
Below 4	−1 for every complete block of 20 qualifying respondents
4 to below 8	No score change
8 or above	+1 for every complete block of 20 qualifying respondents


Overall rating
The prototype calculates a respondent's overall rating as the arithmetic mean of their numeric parameter answers, excluding No view. The unrounded mean determines the low, neutral, or high bucket; rounding is for display only. This is an explicit implementation assumption because the product brief does not define rounding or missing-answer behaviour in detail.

If every parameter is No view, there is no numeric overall rating, so the session cannot contribute to a score threshold. A session must be submitted before it affects official aggregates.
Distinct respondents and score integrity
For the MVP, only the first qualifying contribution from a respondent profile to a given college counts toward the college-score thresholds. This is enforced with a unique (college_id, respondent_id) constraint. This is a basic duplicate-submission safeguard, not proof of a person's identity; without authentication, users could create multiple profiles.

Score updates must run transactionally. Each threshold adjustment is recorded in a score-event history, and a unique constraint prevents the same block from being applied twice. The AI must never calculate or directly change the official score.
Live updates
Every submitted rating can update:
- Parameter averages
- Number of submitted ratings and numeric responses
- Current-student versus alumnus contribution counts
- Overall-rating distribution
- The college score, but only when a threshold is crossed
Demonstration data
A private demo scenario will use a clearly labelled demo college with 19 simulated qualifying low ratings. Submitting the 20th qualifying low rating through the normal UI should demonstrate the score changing from 100 to 99. A separate scenario should demonstrate the increase from 100 to 101 after 20 qualifying high ratings.

All seeded entries must be flagged as simulated (is_demo = true) and clearly distinguished in the interface. Simulated entries must never be presented as genuine student or alumni feedback or mixed into real-world college claims.
Technology stack
The target stack is designed for the requested ₹0 development and demonstration budget.
Layer	Choice	Responsibility
Frontend	React, TypeScript, Vite, CSS	Responsive application and conversational UI
Backend	Python, FastAPI	APIs, validation, rating workflows, scoring, AI tool execution
Database	Supabase PostgreSQL Free tier	Relational storage, constraints, aggregate queries, score history
AI	Configurable tool-calling LLM using an available free tier (initial candidate: Groq)	Intent recognition, natural-language conversation, approved tool selection
Voice input	Browser Web Speech API where supported	Speech-to-text without a paid transcription service
Voice output	Browser speechSynthesis where supported	Spoken responses without a paid text-to-speech service
Frontend hosting	Cloudflare Pages Free tier	Static frontend hosting
Backend hosting	Render Free tier	FastAPI hosting for the prototype


Free-tier caveat: Provider limits and availability can change. The project must not enable billing or paid upgrades. Free hosting may sleep, restart, or have usage limits. If a free AI quota is exhausted, show a useful error or use a limited deterministic fallback rather than silently claiming an AI response succeeded. No paid domain, OTP delivery, or email-sending integration is part of the current scope.
Identity and verification status
Email OTP verification is deferred. For the current prototype:
- Respondents select a college and declare current_student or alumnus.
- The interface displays a clear notice that affiliation has not been verified.
- A prepared college_email_domains table can map institutional domains to colleges in a future phase, but is not active in the current workflow.
- Searching is public and does not require a profile.
- Do not collect unnecessary personal data. Keep respondent details separate from public college aggregates.
Mailbox verification, if added later, would prove access to an institutional mailbox; it would not necessarily prove current enrolment. Alumni may require a different route.
Database design
The planned PostgreSQL schema contains the following core tables:
Table	Purpose
colleges	College identity, location, and demo flag
people	Minimal respondent profile and self-declared status
parameters	Configurable rating parameters and categories
question_bank	Prompts used by the conversational rating flow
rating_sessions	Rating attempts, status, overall rating, timestamps, and demo flag
rating_answers	One score or No view answer per parameter per session
college_score_state	Current college score and threshold counters
score_contributions	One qualifying contribution per respondent/college in the MVP
score_events	Auditable score adjustments and triggering threshold blocks
search_events	Search intent and requested college/parameters with timestamps
college_email_domains	Reserved domain-to-college mapping for future verification


Suggested database constraints include:
- Scores must be integers between 1 and 10 when numeric.
- No view must store a null score and an explicit no-view flag.
- A session has at most one current answer per parameter.
- Only submitted sessions affect official aggregates.
- One qualifying contribution per respondent profile per college.
- Each score threshold block can be applied only once.
Public results should be produced from safe aggregate queries or views, not by exposing respondent records. The API must never send privileged database credentials to the browser.
AI architecture
The AI is an orchestrator, not the source of truth. It can call narrowly scoped backend tools such as:
- search_colleges
- get_college_summary
- get_parameter_ratings
- get_rating_question
- start_rating_session
- save_rating_answer
- submit_rating_session
The backend validates each tool request, checks required state, writes to the database, and returns structured results. The AI must not fabricate ratings, bypass submission checks, or write directly to the database. Prompts sent to external LLM providers should contain the minimum information required and should not include unnecessary personal data.
Planned API surface
These are intended endpoints and may be adjusted during implementation:
Method	Endpoint	Purpose
GET	/health	Service health check
GET	/api/colleges?q=	Search colleges
GET	/api/colleges/{college_id}	College summary and current score
GET	/api/colleges/{college_id}/ratings	Parameter averages, counts, and rating distribution
POST	/api/rating-sessions	Start a rating session
PUT	/api/rating-sessions/{session_id}/answers/{parameter_id}	Save or correct one answer
POST	/api/rating-sessions/{session_id}/submit	Validate and submit the session transactionally
POST	/api/assistant/message	Process a text message and execute approved AI tools


Development-only demo seeding must be disabled or inaccessible in production.
Proposed repository structure
campus-uncut/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── assistant/
│   │   │   ├── college-search/
│   │   │   └── rating/
│   │   ├── lib/
│   │   ├── styles/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── agents/
│   │   ├── core/
│   │   ├── db/
│   │   ├── schemas/
│   │   ├── services/
│   │   │   ├── scoring.py
│   │   │   └── aggregates.py
│   │   └── main.py
│   ├── migrations/
│   ├── tests/
│   ├── .env.example
│   └── requirements.txt
├── docs/
├── .gitignore
└── README.md
Local development setup
The exact commands may be refined once the initial project structure is created.
Prerequisites
- Node.js LTS and npm
- Python 3.11 or a compatible version supported by the selected dependencies
- A Supabase project on the Free tier
- An available free-tier LLM API key for tool calling, if the AI workflow is enabled
Frontend
cd frontend
npm install
npm run dev
Create frontend/.env.local based on .env.example. Only public client configuration belongs in frontend variables. Never place server secrets or a Supabase service-role key in frontend code.
Backend
cd backend
python -m venv .venv
Activate the environment, then install dependencies and start the FastAPI server:
# Windows PowerShell activation:
.venv\Scripts\Activate.ps1

pip install -r requirements.txt
uvicorn app.main:app --reload
Create backend/.env based on .env.example. Keep database service keys and LLM API keys on the server only. Never commit .env files or real credentials.
Environment configuration
Example placeholders only; do not commit real values.

Frontend .env.example:
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_public_anon_key
Backend .env.example:
APP_ENV=development
DATABASE_URL=your_supabase_postgres_connection_string
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=server_only_secret
LLM_PROVIDER=groq
GROQ_API_KEY=server_only_secret
LLM_MODEL=your_available_free_tool_calling_model
CORS_ORIGINS=http://localhost:5173
If a variable or integration is not used by the actual implementation, remove it instead of keeping unused configuration. Do not enable paid billing to obtain a key or exceed a free quota.
Testing and acceptance criteria
Before demonstrating the prototype, verify at least the following:
1. A visitor can search for a college without signing in.
2. A current student and an alumnus can use the rating workflow after declaring their status, with an explicit unverified-affiliation notice.
3. Every active parameter accepts 1–10 or No view.
4. Corrections replace the current answer rather than duplicating it.
5. No view is excluded from numeric averages.
6. An all-No view session cannot contribute to a threshold.
7. A submitted rating updates parameter averages and counts immediately.
8. Nineteen simulated qualifying low ratings leave the demo score at 100; the 20th distinct qualifying low contribution changes it to 99.
9. A separate high-rating scenario applies the corresponding +1 at the 20th distinct qualifying high contribution.
10. The same score threshold cannot be applied twice, including when submissions occur close together.
11. The model retrieves ratings through backend tools and never invents aggregate values.
12. Text interaction remains usable if voice input is unsupported or microphone access is denied.
13. Layout and core flows work on both a phone-sized viewport and a laptop-sized viewport.
14. Simulated demo data is visibly labelled and separated from non-demo records.
15. No secrets appear in frontend bundles, committed files, logs, or user-visible errors.
Build priorities
1. Create the schema and parameter seed data.
2. Implement and test the scoring engine and transactional submit operation.
3. Build the responsive UI and complete rating/search journeys.
4. Add the tool-calling AI workflow and browser-native voice support.
5. Add clearly labelled demo data, deploy on free tiers, test on phone and laptop, and prepare the submission walkthrough.
The priority is one reliable end-to-end product—not a large collection of disconnected screens.
