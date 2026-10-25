# Phases 1 and 2 validation

## Automated checks

Run `npm run check` from the repository root after dependency installation. This runs backend pytest, checks the exported OpenAPI contract, runs Vitest, checks TypeScript, and creates a production Next.js build. `npm run check:e2e` also runs the browser suite against a real backend and production frontend. See README for browser installation and Edge selection on Windows.

Backend tests exercise hand-calculated essential coverage and final weighting, omitted skills as level 0, skill-level caps, optional-skill independence, no-interest neutral 50, deterministic tie ordering, device/schedule/budget feasibility, catalog integrity, repeatable seeding, consistent HTTP errors, CORS, and invalid inputs. Rejected inputs include invalid enums, duplicates, unknown skill IDs/interests, negative budgets, non-finite numbers, booleans used as numbers, and values outside allowed skill/hour bounds.

Roadmap tests exercise 1-hour and 4-hour weekly limits, split-hour conservation, transitive prerequisite ordering and levels, cycle detection, free-first selection, zero/limited budgets, unique paid-resource fee accounting, unknown-cost exclusion, phone alternatives, supervision notices, missing-resource fallback, full-coverage milestone generation, deterministic IDs, and resource migration/idempotent seeding.

Frontend tests validate profile constraints, API timeout/error handling, cached-state schemas, URL trust, storage failures/corruption/versioning, profile/plan consistency, task completion, dependent-task reopening, and progress calculations. Browser tests cover the whole guest onboarding journey, results versus backend values, exact skill gaps, career detail, roadmap generation, refresh persistence, clearing saved data, empty/error states, 375px layout, and keyboard focus. Automated smoke tests complement manual accessibility checks; they do not establish a comprehensive WCAG audit.

The OpenAPI snapshot and generated TypeScript types are versioned. After changing backend schemas, regenerate both and review the diff. This makes interface changes explicit.

## Human review still needed

Career skill mappings, weights, and feasibility assumptions need review by local students, counselors, employers, and vocational training professionals. Device warnings and illustrative practice budgets need particular review. The current tests verify implementation consistency; they do not validate the educational effectiveness of the recommendations.

Future consenting pilot work can measure understanding of score explanations and usefulness. No interviews or pilot results have been collected by this implementation. Outcomes, participant counts, and impact statistics must never be invented.

## Deferred acceptance criteria

Assessment answer secrecy/grading, LLM fallbacks, language switching, deployment, and submission verification depend on later phases. Phase 2 persistence is local to one browser/origin; backend ownership, cross-device sync, and account recovery are not implemented. The three-minute newcomer target requires human usability testing; automated timing is only a smoke-test check.
