# PathForge AI — CYBERSTARS
## Implementation brief for OpenAI Codex

**Hackathon:** Seva First Innovation Challenge — Maharashtra Zone (2026)
**Category:** General | **Sector:** Education and Employability
**Sub-theme:** AI-based career guidance, skill-gap identification and learning-to-career pathways
**Team:** CYBERSTARS (solo developer)
**Status:** Proposed concept / development brief. This document does not claim a built prototype or validated results.

## 0. Mission and non-negotiable scope

Build a polished, accessible, low-bandwidth-friendly web prototype that helps students understand their existing skills, compare suitable career pathways, identify gaps, and create realistic weekly plans based on time, devices, and budget.

**Core demo:** Profile -> top 3 career recommendations -> transparent skill-gap analysis -> personalized weekly roadmap -> micro-assessment -> progress update.

**Differentiator:** Two students with the same career goal but different constraints get different practical learning pathways, not generic AI advice.

**Target users:** Students in Maharashtra and similar regions, including BTech, polytechnic, ITI, and first-generation job seekers. Never imply that an LLM determines the student's future. Recommendations are advisory and revisable.

**Priority:** Build one complete, tested journey over many unfinished features. Guest mode is mandatory. Login, PDF parsing, live job scraping, fully offline inference, and video interviews are NOT part of MVP.

## 1. Stack and technical decisions

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router), React, TypeScript |
| Styling | Tailwind CSS, shadcn/ui, lucide-react |
| Visualizations | Recharts, kept lightweight |
| State/validation | React Hook Form + Zod, typed API client |
| Backend | Python 3.12+, FastAPI, Pydantic v2 |
| Local database | SQLite, SQLAlchemy 2, Alembic |
| Production DB | Postgres using DATABASE_URL and SQLAlchemy (optional for demo) |
| AI adapter | Configurable hosted LLM provider through server-side API; Gemini is one option; no browser-exposed key |
| Tests | pytest for engine/API, Vitest for pure frontend utilities, Playwright smoke test if feasible |
| Deploy | Vercel frontend and Python-compatible host backend (e.g. Render); set CORS explicit origins |

Avoid Docker in first phase unless deployment requires it. Avoid installing GPU-sized ML dependencies for the MVP. Prefer a small curated catalog and deterministic backend calculations to keep costs and failure modes low.

## 2. User experience and page specification

### `/` — Landing
- Brand: PathForge AI by CYBERSTARS.
- One-sentence proposition and prominent "Find my pathway" CTA.
- Three-step preview: discover skills, compare paths, build roadmap.
- Mobile-first; no hype or false promises.

### `/onboarding` — Student profile wizard (3 steps)
1. Background: education (school, ITI, diploma, undergraduate, other), study area, self-reported skills (level 0–3), interests.
2. Constraints: hours available per week (1–30), learning budget INR (0 or positive number), device access (`smartphone_only`, `laptop`, `shared_computer`), language (`en` or `mr`).
3. Goal: internship, first job, career exploration, or upskilling. Show consent/notice about how demo profile data is handled.

Use selectable skill chips, accessible progress steps, validation, and meaningful default demo values. No email, phone, Aadhaar, gender, caste, religion or financial account data required.

### `/dashboard`
- Top three recommendations and explanation for each.
- Clear distinction between **self-reported skill coverage** and actual employability; never call the former an employment probability.
- Summary of major missing skills, selected career and active learning plan.
- Meaningful empty states and loading states.

### `/careers/[slug]`
- Career overview, core tasks, essential/optional skills with required levels.
- Skill-gap comparison for current student.
- Fit indicators: skill coverage, interest alignment, constraint feasibility.
- Explain formula in a collapsible "How this match was calculated" block.
- 'Create my roadmap' CTA.

### `/roadmap`
- Weekly steps ordered by prerequisite and availability.
- For each task: skill, estimated study hours, source/resource link, activity, verification method.
- Free-first recommendation; for phone-only profiles avoid laptop-dependent tasks or label alternatives; never claim all careers are feasible solely via phone.
- Mark done, re-open task, and recalculate completion progress.

### `/assessments`
- At least three seeded 5-question multiple-choice assessments (networking basics, web basics, spreadsheet/data basics).
- Mark each answer, show explanations and raw score.
- Assessment success adds a **quiz-completed evidence badge**, not automatic proof of job readiness.
- Never show hidden correct answers in GET quiz responses; grade on backend.

### `/about`
- Explain demo scope, sources, limitations, privacy and the CYBERSTARS project purpose.

## 3. Seed content

Seed **12 diverse career paths**; at least six technical and four vocational/non-software. Suggested:
- SOC Analyst (junior)
- Frontend Developer
- IT Support Technician
- QA Tester
- Data Analyst (junior)
- UI/UX Designer
- Digital Marketing Associate
- CAD Technician
- Solar PV Technician
- Electrical Technician
- Supply Chain/Logistics Coordinator
- Office Administration Assistant

Every career must have (a) short overview, (b) 3-8 essential skills with required levels (1–3), (c) 2-5 optional skills, (d) interest tags, (e) device limitations if any, (f) source note (`curated_demo` or specific source), and (g) approximate tasks only where explicitly labeled as estimates. Do not fabricate live salaries, vacancy counts or placement statistics.

Seed **25–40 normalized skills** and **20–35 resource records**. Resource records have provider, title, verified URL, skill_ids, free/paid flag, time estimate and `last_checked` (nullable). Start with stable official source landing pages and curated course URLs verified by the developer, e.g. SWAYAM/NPTEL, Skill India Digital, MDN, Cisco Skills for All when verifiable. If exact links aren't verified, use a provider landing page, never invent deep course URLs.

For richer versions, support an ESCO importer behind a feature flag; ESCO provides occupation/skill relationships but its European taxonomy needs review for Indian educational context. MVP must not depend on its remote API being live.

## 4. Data model

Model names can be adjusted with migrations, but relationships must remain clear:

- `Profile(id, education_level, study_field, goal, hours_per_week, budget_inr, device_access, language, created_at, updated_at)`
- `Skill(id, slug, label_en, label_mr_nullable, description)`
- `ProfileSkill(profile_id, skill_id, self_reported_level: 0..3)`
- `Career(id, slug, title, summary, interest_tags_json, device_requirement, source_note)`
- `CareerSkill(career_id, skill_id, required_level: 1..3, importance: essential|optional, weight: integer 1..5)`
- `LearningResource(id, title, provider, url, cost_inr_nullable, is_free, skill_id, estimated_hours, source_note)`
- `Roadmap(id, profile_id, career_id, created_at, estimated_weeks, generation_source: rules|llm)`
- `RoadmapTask(id, roadmap_id, skill_id, week_number, title, description, resource_id_nullable, estimated_hours, completed_at_nullable)`
- `Assessment(id, slug, title, skill_id, questions_json)` (store correct answer server-side only)
- `AssessmentAttempt(id, profile_id, assessment_id, score, total, created_at)`

A local guest profile can be assigned a random UUID saved only in browser storage; backend should validate ownership by a session token if profiles become accessible across users. For the first solo demo, run without exposing shared personal profiles on a public service; use secure random guest session tokens or in-browser-only state with server stateless evaluation. Document trade-offs explicitly and avoid unprotected ID-based public profile reads.

## 5. Matching algorithm (backend truth, not LLM imagination)

Input: validated profile + self-reported skills + selected interests + curated career data.

Skill coverage is a weighted percentage over essential career skills:

```
coverage = 100 * SUM(weight_i * min(user_level_i / required_level_i, 1)) / SUM(weight_i)
```

For missing skills, user_level defaults to 0. Missing level = `max(required - user, 0)`. All required levels are 1–3 and weights are positive, avoiding zero denominators.

Interest match: percentage of career interest tags that overlap with user interests (scale 0–100; use neutral 50 and label unknown if no interests supplied).

Feasibility: transparent rule-based 0–100 score derived from schedule, device and budget suitability; define explicit rule table, never use demographic or protected attributes.

Final **exploration fit score**, a UI ranking heuristic rather than a probability of employment:

```
fit = 0.60 * coverage + 0.25 * interest_match + 0.15 * feasibility
```

Return component values and plain-language reasons in API response. Never display invented market-demand numbers or guaranteed salaries. Treat these weights as a configurable starting hypothesis to review during pilot feedback.

## 6. Roadmap generator

Deterministic implementation is essential. LLM augmentation is optional and must not change required skills or create fake links.

Algorithm:
1. Compute gaps for the selected career.
2. Sort essential skills first and respect manually defined prerequisites.
3. Pick matching free-first learning resources respecting device access and budget.
4. Convert gaps into small tasks with study-hour estimates and a practical activity.
5. Pack tasks into weeks with `sum(task_hours) <= hours_per_week` (a task may be split between weeks).
6. Include at least one mini-project or assessment milestone.
7. Render the plan and show assumptions, for example "6 hours per week, self-reported skills, illustrative course durations".

AI enhancement: server-side `AI_PROVIDER` and `AI_API_KEY` optional, call provider only with non-identifying structured skills/goals/constraints, request strict JSON meeting a Pydantic schema, constrain returned resource IDs to catalog IDs and validate/sanitize output; fall back to deterministic explanation templates on timeout, invalid JSON, quota exhaustion or missing key. Implement retries conservatively. No API key in git or client bundle.

## 7. API contract

Version all routes under `/api/v1` and return consistent JSON errors with status codes. Minimum endpoints:

- `GET /api/v1/health` — status and version
- `GET /api/v1/catalog/skills` — skills
- `GET /api/v1/catalog/careers` — public career list
- `GET /api/v1/catalog/careers/{slug}` — career and required skills
- `POST /api/v1/matches` — accepts profile snapshot, returns three ranked matches, breakdown and missing skills; stateless and safe for guest use
- `POST /api/v1/roadmaps/generate` — accepts profile snapshot and chosen career, returns week/task plan
- `GET /api/v1/assessments` — assessment metadata
- `GET /api/v1/assessments/{slug}` — quiz without answers
- `POST /api/v1/assessments/{slug}/grade` — answers, grades on backend

Persist roadmaps and progress after stateless demo works; prefer authenticated guest sessions if storing on backend. Document exact OpenAPI shapes and generate typed frontend interfaces.

## 8. Repository layout

```
pathforge-ai/
  README.md
  .gitignore
  .env.example
  frontend/
    app/
    components/
    lib/api/
    lib/types/
    tests/
    package.json
  backend/
    app/
      main.py
      api/
      core/
      models/
      schemas/
      services/matching.py
      services/roadmap.py
      services/ai_provider.py
      seed/
    tests/
    requirements.txt  # or pyproject.toml; choose one
    alembic/
  docs/
    architecture.md
    demo-script.md
    validation-plan.md
    data-sources.md
```

## 9. Development phases (strict sequence)

### Phase 0 — Discovery and evidence | 24 Oct
**Do:** Write `docs/problem-statement.md`, describe target persona, list assumptions, devise 5 short interview questions for local students, record source URLs, and wireframe 3 screens. Never fabricate interview results. Confirm the event dashboard's real submission field and exact deadline.
**Done when:** Problem, unique mechanism, MVP boundaries and demo scenario are documented.

### Phase 1 — Foundation and deterministic engine | 24–26 Oct
**Do:** Initialize monorepo, FastAPI and Next app; seed 12 careers and skill catalog; implement matching score and explanation; test inputs, edge cases and arithmetic; create clean landing, onboarding and match-results screens; set up .env.example and basic CI-like test scripts.
**Done when:** Local setup works from README and demo profile consistently returns three matches plus exact gaps without needing an API key.

### Phase 2 — Roadmaps and end-to-end interaction | 26–27 Oct
**Do:** Implement rules-based roadmap generator, seeded learning resources, career detail, roadmap UI, task completion, and local session persistence with clearly documented limitations.
**Done when:** A newcomer can finish profile -> recommendation -> roadmap in 3 minutes and refresh without losing demo progress.

### Phase 3 — AI, assessments and language | 27–28 Oct
**Do:** Add optional server-side LLM explanation/roadmap wording, strict schema validation, fallbacks, 3 short assessments, English UI translations with initial Marathi translations of core navigation and onboarding. For any untranslated content, show an explicit English fallback. Avoid marketing this as full multilingual coverage.
**Done when:** AI works with configured key, the same demo works without key, assessment scores are accurately graded, and language toggle changes the implemented UI strings.

### Phase 4 — Polish, test, deploy and pitch | 28–29 Oct
**Do:** Fix critical bugs, keyboard/mobile access and contrast; run tests; deploy; record a ~3-minute product walkthrough; prepare architecture diagram; write a validation plan and honest cost assumptions; create pitch content in the official hackathon PowerPoint template.
**Done when:** Public demo loads on mobile, sample user completes the main journey, tests pass, README is reproducible, and sources/limits are disclosed.

### Phase 5 — Submission and post-submission | 30 Oct onward
**Do:** Follow organizer's exact portal instructions, upload the official-format PPT, include verified demo/repo links if the form supports them. After submission, use pilot feedback from 5–10 consenting students, refine weights, add larger sourced catalogs and optionally integrate ESCO or richer language accessibility.
**Done when:** Submission acknowledgement exists. Future results cannot be claimed in the submission before they happen.

**Fallback if time is short:** Submit a clear, working Phase 1–2 prototype, accurately label it as MVP, and pitch Phases 3–5 as the roadmap. Do not trade working core features for an unfinished chat interface.

## 10. Acceptance tests

1. Profile has Python=2, HTML=2, SQL=1; missing networking=0 and Linux=0; matching response includes accurate gaps for SOC Analyst.
2. A skill level equal to or above the required level counts as full coverage, never >100%.
3. A missing optional skill does not artificially reduce the essential coverage metric.
4. With 4 hours/week, generated week plans have no more than 4 scheduled study hours; hours split correctly.
5. Smartphone-only profiles receive warnings/alternatives for laptop-required practical tasks.
6. `AI_API_KEY` unset still permits core workflow and generated deterministic descriptions.
7. Invalid LLM JSON or fabricated resource ID is rejected and the fallback path succeeds.
8. Assessment grading is server-side: API never returns answer keys in quiz GET.
9. API input validation rejects negative budgets, impossible skill levels and out-of-range study hours.
10. Mobile 375px layout has no critical horizontal scroll; keyboard focus visible.
11. No secret keys, raw personal identifiers, dummy pilot metrics or fake placement rates appear in the repository.
12. Fit component scores shown in UI equal the API outputs and can be explained on demand.

## 11. Demo walkthrough

**Demo persona A:** Diploma student; Python level 2, HTML level 2, SQL level 1; interested in cybersecurity; 6 hours/week; laptop; zero learning budget. Complete profile -> top matches -> pick SOC Analyst -> networking/Linux gap -> 4-week preview -> start learning plan -> sample assessment -> progress.

**Demo persona B:** Same interests and self-reported skills, 4 hours/week, smartphone-only. Compare the two plans live and show differing estimated pace, feasible exercises and device notices. Do not pretend a smartphone replaces a computer for specialized labs.

Demo data must be labeled **illustrative**. Talk about *intended* public benefit and *planned* validation, not proven outcomes.

## 12. Metrics and pitch evidence

For pilot testing, measure: profile-completion rate, time from onboarding to first roadmap, comprehension of skill-gap explanation, usefulness rating (1–5), percentage of roadmap tasks completed over a follow-up period, and number of relevant resources that open successfully. Record sample size, consent, and date. Do not invent these numbers for judging.

Pitch sections in organizer's official PPT: problem; target beneficiaries; solution; workflow; innovation/contrast; architecture; screenshots/demo; feasibility/cost; impact KPIs and validation plan; scale and limitations; project/team information. Follow the exact template fields if different.

## 13. Engineering and safety rules for Codex

- First inspect the repository; do not overwrite existing user work.
- Before coding each phase, report a short file-by-file plan.
- Implement **one phase at a time** and stop after tests; do not attempt all phases in one unsupervised pass.
- Cite resources in `docs/data-sources.md`; do not create invented educational URLs.
- Keep service-layer matching functions pure, deterministic and independently tested.
- Use structured logging without student profile payloads or provider API secrets.
- Configure allowed frontend origins explicitly, reasonable request timeouts and rate limits on paid AI endpoints if publicly exposed.
- Avoid sensitive demographic inference; no claim that fit scores objectively predict employability.
- Keep dependencies reasonable and lock versions once installed; never commit real API keys.
- README must include Windows PowerShell and Linux/macOS steps, ports, .env instructions, seed/init commands, test commands and known limitations.
- Keep web UI accessible and visually coherent; prefer functional, user-centered experiences to decorative AI chrome.

## 14. Codex phase prompts (run separately)

### First invocation — Phase 1

> Read `PathForge_AI_Codex_Project_Spec.md` in full. You are building PathForge AI for CYBERSTARS, a solo-developer Maharashtra Zone innovation challenge project. Treat the spec as the product contract. Implement **Phase 1 only** in a new `pathforge-ai` repository, using Next.js/TypeScript/Tailwind frontend and FastAPI/Python backend. Include the seed catalog, transparent deterministic career ranking, onboarding, results UI, typed API client, robust validations and tests. Do not call any LLM in Phase 1. Inspect environment, write a short implementation plan, create files, install dependencies when permitted, run the test suite, fix failures and report the commands, changed files and unresolved issues. Do not claim later phases are implemented.

### Second invocation — Phase 2

> Read the spec and inspect the existing repository. Implement **Phase 2 only** without regressing Phase 1: deterministic constraint-aware weekly roadmap, trusted course-resource catalog, career detail pages, task completion and persistence. Add tests for weekly hour budget, budget=0, missing device capability and empty resource matches. Run existing tests and show results.

### Third invocation — Phase 3

> Read the spec and inspect the repository. Implement **Phase 3 only**: optional server-side hosted LLM adapter with validated structured output and deterministic fallback; three short backend-graded assessments; language switching with English and initial Marathi translation coverage. Keep keys private; do not invent provider SDK APIs—check installed package documentation. Run tests and explain exactly which UI strings are localized.

### Fourth invocation — Phase 4

> Read the spec. Implement **Phase 4 only**: responsive/accessibility polish, API error handling, smoke tests, deployment configs, architecture diagram and README instructions, realistic demo script, and pitch notes aligned to the hackathon's official PPT template. Do not fabricate user feedback, pilot metrics or judges' decisions. Provide a deployment checklist and record any steps requiring credentials.

## 15. Useful verified source starting points

- Maharashtra Zone: https://sevainnovationchallenge.in/
- Maharashtra guidelines and PPT template: https://www.sevainnovationchallenge.in/guidelines.html
- ESCO open occupational taxonomy: https://esco.ec.europa.eu/en/use-esco/download
- SWAYAM/NPTEL: https://swayam.gov.in/nc_details/NPTEL
- Skill India Digital learning catalogue: https://www.skillindiadigital.gov.in/free-online-courses/

**Reminder:** The official Maharashtra Zone site indicated an extended **30 October 2026** application date when this spec was written on **24 October 2026**. Check the participant dashboard for exact submission requirements. Other regional Seva First programs publish different calendars and templates, so do not mix them.
