# PathForge AI by CYBERSTARS

**Deterministic core and optional Phase 3 features:** an accessible guest career-exploration prototype with a Next.js frontend, FastAPI backend, SQLite catalog, and deterministic matching and weekly planning. Complete onboarding, compare three careers, inspect a career's skill gaps, and create a constraint-aware learning plan. Mark tasks done or reopen them; profile, plan, and progress survive refresh on this browser. No API key is needed.

Career requirements and feasibility assumptions are **illustrative**, not evidence of job readiness or validated employment predictions. The project has not collected pilot results. The supplied project specification remains unchanged in the parent workspace; an exact copy is included as [docs/project-spec.md](docs/project-spec.md).

**Phase 4 local release package:** contrast/accessibility polish, mobile navigation, error/retry handling, Render configuration, deployment checks, a captioned three-minute walkthrough, and an official-template pitch draft are prepared. Phase 3 now adds three server-graded practice quizzes, initial Marathi navigation/onboarding and opt-in Gemini wording with rules fallback. Live-provider verification and native-speaker review remain outstanding. Public deployment is still pending authenticated Vercel/Render access and a source repository.

Open the [release checklist](docs/phase4-checklist.md), [local verification record](docs/phase4-verification.md), [architecture diagram](docs/architecture.svg), [recorded walkthrough](docs/media/pathforge-walkthrough.webm), and [pitch draft/project team roster](docs/pitch/README.md). The roster uses **Aarush Tendulkar** as Team Lead, with null contact. Student guidance experts are managed separately through the [administrator console](docs/expert-administration.md).

See the [Phase 3 feature and configuration guide](docs/phase3-guide.md) for quizzes, exact translation coverage, backend-only AI settings and verification limits. Optional AI is disabled by default; the full core journey requires no key.

## Requirements

Read the [security audit and deployment requirements](docs/security-audit.md) before public hosting. It covers tested authorization, nonce CSP, request limits, durable AI quotas, dependency/secret scanning and residual risks. Run `npm run security:scan` after installing the isolated locked security tools described there. Apply migrations through `0004_security_quotas`; production requires explicit `ENVIRONMENT`, `ALLOWED_HOSTS` and HTTPS CORS origins. Dynamic nonce-protected HTML must not be shared-cached or statically exported.

**Phase 5 submission preparation:** [application draft](docs/submission/application-draft.md), [portal handoff checklist](docs/submission/portal-checklist.md), and an allowlisted review bundle are prepared. Run `npm run submission:test`, `npm run submission:package`, then `npm run submission:check`. Outputs are in `docs/submission/dist/`. These commands verify file integrity; they do not submit anything. Mandatory contact/qualification, eligibility, authenticated portal requirements and an actual acknowledgement remain unverified. Phase 5 is not complete.

The [final checklist](docs/submission/final-checklist.md) separates completed work, deployment tasks and applicant confirmations. The [Phase 5 verification record](docs/phase5-verification.md) covers the expert console and submission corrections. To enable administration, follow [expert setup](docs/expert-administration.md); the backend token stays private and administration is disabled until configured.

- Python **3.12+**, Node.js **22.12+ in the 22.x series** (or 24.x / 26+), npm, and internet access to install dependencies. The test tooling sets the Node requirement; Node 22 is used in CI.
- Two terminals for the backend (port **8000**) and frontend (port **3000**).
- Optional Chromium for browser tests, or installed Microsoft Edge on Windows.

Commands below assume the working directory is this `pathforge-ai/` repository. Dependencies are locked in `backend/requirements.txt` and `frontend/package-lock.json`. A root dependency installation is not needed.

For this already-installed workspace, see [quick startup and free website hosting](docs/hosting-guide.md). It includes exact Vercel/Render root directories, commands, environment variables, CORS configuration, and custom-domain options. No public deployment has been created.

## Windows PowerShell

First terminal:

```powershell
Copy-Item .env.example backend/.env
Set-Content -Path frontend/.env.local -Value 'NEXT_PUBLIC_API_URL=http://localhost:8000'
python -m venv backend/.venv
backend/.venv/Scripts/python.exe -m pip install -r backend/requirements.txt
Set-Location backend
.venv/Scripts/python.exe -m alembic upgrade head
.venv/Scripts/python.exe -m app.seed
.venv/Scripts/python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 --no-access-log
```

Second terminal, starting from `pathforge-ai/`:

```powershell
npm.cmd --prefix frontend ci
npm.cmd --prefix frontend run dev
```

Use `npm.cmd` if the PowerShell execution policy blocks `npm.ps1`. Virtualenv activation is unnecessary; commands use the environment's Python explicitly.

## Linux / macOS

First terminal:

```bash
cp .env.example backend/.env
printf '%s\n' 'NEXT_PUBLIC_API_URL=http://localhost:8000' > frontend/.env.local
python3 -m venv backend/.venv
backend/.venv/bin/python -m pip install -r backend/requirements.txt
cd backend
.venv/bin/python -m alembic upgrade head
.venv/bin/python -m app.seed
.venv/bin/python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 --no-access-log
```

Second terminal, starting from `pathforge-ai/`:

```bash
npm --prefix frontend ci
npm --prefix frontend run dev
```

Open [the local frontend](http://localhost:3000), [API health](http://localhost:8000/api/v1/health), or [interactive API documentation](http://localhost:8000/docs). Alembic creates the schema; the seed command is safe to run again. Startup does not silently migrate or seed the database. Run backend commands from `backend/` so the `.env` and relative SQLite path resolve consistently.

## Upgrading a Phase 1 checkout

Keep the existing database and environment files. Run the migration and seed commands again from `backend/`; migration `0002_learning_resources` adds the public resource catalog without student-data tables:

```powershell
.venv/Scripts/python.exe -m alembic upgrade head
.venv/Scripts/python.exe -m app.seed
```

On Linux/macOS use `.venv/bin/python`. Existing catalog data is updated idempotently. There is no Phase 1 browser profile to migrate, because Phase 1 used memory only. The Phase 2 cache is versioned and local to this browser and site origin.

## Configuration

| Setting | Location | Default / format |
| --- | --- | --- |
| `DATABASE_URL` | `backend/.env` | `sqlite:///./pathforge.db` |
| `CORS_ORIGINS` | `backend/.env` | JSON list of explicit HTTP(S) origins, e.g. `["http://localhost:3000","http://127.0.0.1:3000"]` |
| `LOG_LEVEL` | `backend/.env` | `INFO` |
| `NEXT_PUBLIC_API_URL` | `frontend/.env.local` | `http://localhost:8000` (host URL; client adds `/api/v1`) |

The deterministic core calls no LLM provider and needs no `AI_API_KEY`. Optional wording uses a server-side provider only after an explicit opt-in request. Real secrets belong in ignored environment files. The frontend URL is public and must contain no credentials. Restart/rebuild Next.js after changing public environment variables. CORS origins cannot use wildcards or URL paths.

SQLite is the tested database. SQLAlchemy takes `DATABASE_URL`; PostgreSQL deployment and its driver are optional future work and are not claimed as verified. Do not expose this development server as a production service.

## Automated checks

From `pathforge-ai/` after installing dependencies:

```powershell
npm.cmd run check
```

On Linux/macOS use `npm run check`. This runs pytest, checks that the committed OpenAPI snapshot is current, runs Vitest, checks TypeScript, and builds the production frontend. It stops on the first failure.

Individual commands:

```powershell
# Run from backend/
.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider --basetemp .test-tmp-phase2

# Run from repository root
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run typecheck
npm.cmd --prefix frontend run build
```

For Linux/macOS, replace the Python executable with `.venv/bin/python` and `npm.cmd` with `npm`.

Browser tests start their own backend and production frontend; run the build first and stop manually running servers on their configured ports. Install the browser once:

```powershell
# From frontend/
npx.cmd playwright install chromium
# Or use an existing Edge installation without a download:
$env:PLAYWRIGHT_CHANNEL = 'msedge'

# From repository root
npm.cmd run check:e2e
```

On Linux/macOS, use `npx playwright install --with-deps chromium` and `npm run check:e2e`. The browser suite uses a separate local SQLite database. Test artifacts are ignored by Git.

The combined runner creates a fresh temporary test directory, avoiding stale Windows cache ownership after switching execution accounts. The standalone pytest command above uses a dedicated ignored test directory for the same reason.

## API and generated interfaces

Implemented endpoints:

| Method | Route | Result |
| --- | --- | --- |
| GET | `/api/v1/health` | Service status/version |
| GET | `/api/v1/catalog/skills` | Normalized skills and selectable interests |
| GET | `/api/v1/catalog/careers` | Twelve public curated careers |
| GET | `/api/v1/catalog/careers/{slug}` | One career and essential/optional requirements |
| GET | `/api/v1/catalog/resources` | Curated, checked learning references |
| POST | `/api/v1/matches` | Three ranked matches, components, explanations, and gaps |
| POST | `/api/v1/catalog/careers/{slug}/match` | Backend-calculated match for any catalog career |
| POST | `/api/v1/roadmaps/generate` | Deterministic weekly plan for a profile and career |

`/careers/[slug]` displays career tasks, essential and optional requirements, exact gaps, component scores, and the calculation disclosure. **Create my roadmap** opens the weekly plan at `/roadmap`.

Example request:

```json
{
  "profile": {
    "education_level": "diploma",
    "study_field": "Computer engineering",
    "goal": "career_exploration",
    "hours_per_week": 6,
    "budget_inr": 0,
    "device_access": "laptop",
    "language": "en"
  },
  "skills": [
    {"skill_id": "python", "self_reported_level": 2},
    {"skill_id": "html", "self_reported_level": 2},
    {"skill_id": "sql", "self_reported_level": 1}
  ],
  "interests": ["cybersecurity"]
}
```

The server rejects extra fields, duplicate and unknown IDs, invalid enums, non-finite/negative budgets, booleans used as numbers, skill levels outside 0–3, and weekly hours outside 1–30. Demo budgets are bounded to INR 1,000,000 and study field length to 100 characters. Errors use `{ "error": { "code", "message", "details" } }` without echoing profile input values.

For `/roadmaps/generate`, add `"career_slug": "soc-analyst"` alongside `profile`, `skills`, and `interests`. Generation returns deterministic weeks and tasks, catalog references, activity/verification text, selected-career scores, assumptions, and device/budget notices. It does not save the plan on the server. Resource-fee estimates exclude equipment, connectivity, supervision, transport, certification, and training costs.

Exact request and response shapes are in [docs/openapi.json](docs/openapi.json) and `/docs`. To refresh the snapshot and generated TypeScript after an API change:

```powershell
backend/.venv/Scripts/python.exe scripts/export_openapi.py
npm.cmd run types:api
```

On Linux/macOS use `backend/.venv/bin/python`. Review and commit the generated changes alongside the backend change. The frontend consumes generated component types; it does not recalculate match scores.

## Architecture and matching

The Next.js UI validates and restores the guest profile, matches, selected career, active plan, and task completion from versioned browser-local storage. FastAPI validates a snapshot, reads the public catalog through SQLAlchemy, and invokes pure matching and roadmap functions. SQLite persists only catalog data, with Alembic migrations. No student profiles or progress are stored on the server, and there are no public profile-read endpoints.

Browser storage is tied to this device, browser, and site origin. It is not an authenticated account, encrypted vault, or cross-device backup. Anyone using the same browser may see saved demo data. Use the visible **Clear saved data** control on shared devices. If browser storage is blocked, the app falls back to temporary memory and explains that refresh will lose progress. Corrupt or incompatible cached state is rejected. Changing the submitted profile invalidates an older plan; finishing a task does not raise skill levels or change the matching score.

```text
coverage = weighted essential-skill level coverage, capped at 100%
interest = overlapping career tags / career tags (neutral 50 if unknown)
feasibility = 40% schedule + 40% device + 20% illustrative budget suitability
exploration fit = 60% coverage + 25% interest + 15% feasibility
```

Read [architecture](docs/architecture.md), the [complete matching rule table and worked demo](docs/matching-rules.md), [roadmap rules](docs/roadmap-rules.md), [catalog provenance](docs/data-sources.md), [demo script](docs/demo-script.md), [validation plan](docs/validation-plan.md), and the [historical Phase 1 verification results](docs/verification-results.md).

Current results are in [Phase 3 verification](docs/phase3-verification.md); the [Phase 2 record](docs/phase2-verification.md) is historical. Backend/frontend/browser tests, TypeScript, OpenAPI freshness and the production build are checked. Public hosting steps are in [the hosting guide](docs/hosting-guide.md).

## Current boundaries

- Implemented: 12 diverse careers, 36 skills, 33 checked learning references, guest onboarding, top-three matches, exact gaps, explanations, career detail pages, deterministic weekly plans, task completion, local persistence, device warnings, API validation, and automated tests.
- Initial Marathi navigation and onboarding are implemented. Catalogs, validation errors, quizzes, plans, expert management and remaining pages use explicit English fallback; see the exact coverage guide.
- Pending: live-provider verification, native-speaker Marathi review, durable public hosting, pilot validation and authenticated portal/submission verification. Optional AI wording, three practice quizzes, initial translations and pitch drafts are implemented.
- Catalog weights, practice budgets, and time assumptions need local review. No salaries, vacancy feeds, placement promises, or pilot metrics are claimed.
