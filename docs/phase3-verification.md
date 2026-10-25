# Phase 3 local verification — 25 October 2026

Historical Phase 3 record: the later [security audit](security-audit.md) adds durable quotas, boundary controls and new regression tests. Its result counts and deployment requirements supersede this earlier snapshot.

The deferred optional features are now implemented. The deterministic core, guest workflow and expert management remain available. Public deployment, real portal submission and acknowledgement are still pending.

## Results

| Check | Result |
| --- | --- |
| Backend pytest | 188 passed |
| Frontend Vitest | 57 passed |
| Browser suite, installed Edge | 14 passed |
| Review-package tests | 8 passed |
| TypeScript and production build | Passed |
| OpenAPI snapshot/generated client types | Updated and checked |
| Submission archive integrity | Verified |

Run `npm run check:e2e` with `PLAYWRIGHT_CHANNEL=msedge` in this Windows workspace. The full browser run passed all 14 tests, including three new Phase 3 scenarios. The final core check was rerun after adding two malformed-provider-envelope cases and updating the landing-page disclosure. Run `npm run submission:test`, `npm run submission:package`, and `npm run submission:check` for the separately verified review artifacts. A non-failing upstream Starlette TestClient/httpx deprecation remains.

Browser coverage includes five-question server grading, raw score and explanations, passing badge persistence after refresh, clearing evidence, Marathi navigation/onboarding with unchanged entered values, submitted language, refresh persistence, explicit English fallback, and optional wording without an API key while preserving the exact stored plan. Existing mobile, keyboard, roadmap, error handling and expert-admin tests still pass. Axe checks on new quiz and Marathi form states report no violations; this is not full accessibility certification.

The first run found mobile-header overflow and duplicate unnamed complementary landmarks. Navigation now wraps at narrow widths and the translation notice has a unique accessible name. A legacy test asserting the assessment endpoint was absent was updated; GET response tests inspect exact public fields rather than searching for ordinary words such as “correct” in question text.

## AI boundaries and evidence

The Gemini REST adapter is opt-in and disabled by default. It runs separately from the pure matching/planning engine. Only selected normalized skill IDs/levels, goal, constraints and catalog task references are sent; free-text study area, contact details and browser identifiers are excluded. The key remains server-side. Responses must preserve original task/resource IDs, remain plain bounded prose, and introduce no additional schema fields. Request budgets and an overall timeout bound provider use; no automatic retry occurs.

Tests verify a successful mocked provider transport, key header, original task/resource identity, unchanged plans, consent and no-key behavior, privacy/log redaction, invalid JSON, fabricated/duplicate IDs, extra score fields, links/HTML, excess prose, timeouts, quota errors, malformed envelopes and request limits. No real provider key/model was configured or live paid request made. Real-provider success remains unverified; model availability, permission, quota and semantic wording quality require a live check in the applicant's account.

Three developer-authored versioned quiz banks stay server-side. GET responses omit correct options and explanations; grading requires exactly five unique current question IDs and accepts no client score. Passing at four of five adds a browser-local quiz-completed badge, never a skill-level increase, score change or job-readiness credential. Attempts are stateless on the backend.

See the [feature guide](phase3-guide.md) for exact initial Marathi coverage and English fallback. Native-speaker review remains outstanding; complete multilingual coverage is not claimed.

## Presentation and submission package

Current six-slide official-template artifacts are `docs/pitch/PathForge_AI_CYBERSTARS_PHASE3_DRAFT.pptx` and its matching PDF, exported through PowerPoint and reviewed in `preview-phase3/`. The previous draft could not be overwritten and was preserved; the package explicitly uses the new Phase 3 files. The original organizer template is unchanged. Applicant Aarush Tendulkar, Team Lead of one-member CYBERSTARS, and null contact are preserved. No actual expert, public URL, partnership or pilot outcome is invented.

The existing three-minute walkthrough is retained as a recording of the deterministic core before these additions; it does not demonstrate the new optional features. Architecture, current pitch, application draft and the review archive have been updated. The original specification remains unchanged. Final contact, qualification, eligibility and authenticated portal requirements still need applicant verification; no acknowledgement is claimed.
