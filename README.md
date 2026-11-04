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
