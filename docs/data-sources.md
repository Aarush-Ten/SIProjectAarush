# Catalog provenance and source notes

The career catalog is original **illustrative curation** for this prototype. Every career has `source_note: curated_demo`. Titles, tasks, required levels, optional skills, importance weights, recommended weekly hours, and practice budgets are examples for discussion. They have not been validated by employers, a government authority, or students. They are not licensing requirements, tuition quotations, labour-market statistics, or evidence of employability.

The source of the product requirements is the supplied `PathForge_AI_Codex_Project_Spec.md`, read in full and preserved verbatim in [project-spec.md](project-spec.md). The 12 requested career titles are represented. Catalog records are maintained in `backend/app/seed/`; skills use normalized slug identifiers shared across requirements and profile input. No student records are seeded.

## Reference starting points

These official pages were opened on **24 October 2026** to establish accessible reference starting points, not to claim their endorsement of the curated catalog:

| Reference | Purpose and limits |
| --- | --- |
| [National Career Service](https://ncs.gov.in/) | Indian career information context; no job listings, salaries, vacancy counts, or placement statistics were imported. |
| [ESCO downloads](https://esco.ec.europa.eu/en/use-esco/download) | Possible future occupation/skill taxonomy. No importer or remote API dependency exists in Phase 1; Indian context would require review. |
| [MDN learning](https://developer.mozilla.org/en-US/docs/Learn_web_development) | Official web development learning reference; Phase 2 adds checked topic-level documentation as learning references. |

The DGT landing page could not be fetched during the original verification and is not represented as a verified source. The event deadline and submission portal are outside this Phase 2 implementation; the date stated in the supplied brief has not been independently confirmed against a participant account.

## Engineering references

- [Next.js App Router installation](https://nextjs.org/docs/app/getting-started/installation)
- [FastAPI tutorial](https://fastapi.tiangolo.com/tutorial/)
- [SQLAlchemy 2 ORM](https://docs.sqlalchemy.org/en/20/orm/quickstart.html)
- [Pydantic strict validation](https://docs.pydantic.dev/latest/concepts/strict_mode/)
- [Next.js dynamic routes](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes)
- [Browser localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [SQLAlchemy relationships](https://docs.sqlalchemy.org/en/20/orm/basic_relationships.html)

## Phase 2 learning resources

The seeded learning references and their individual checked URLs, dates, redirects, failures, and source notes are listed in [resource-verification.md](resource-verification.md). The seed file is `backend/app/seed/resources.py`. Records map one or more normalized skill IDs to an official public reading reference; resource/skill associations are persisted in SQLite.

The catalog uses free public material, not invented course or certificate offers. `estimated_hours` and roadmap study durations are developer-curated study allocations, not provider completion times. Mobile-readable pages support theory, not a promise that all practical work can be done on a phone. Foreign technical or safety references are background reading, not Indian licensing or regulatory guidance. Qualified local training and supervision requirements still apply.

URLs are checked during curation and not fetched by the planning engine at runtime. Availability may change after `last_checked`; users follow links directly. No fabricated course URLs, live vacancy feeds, salaries, or placement statistics are used.

## Phase 3 implementation references (checked 25 October 2026)

The quiz bank is developer-authored practice content, not a certified assessment. Supporting references: [MDN DNS](https://developer.mozilla.org/en-US/docs/Glossary/DNS), [MDN HTML learning module](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content), and [Microsoft SUM function](https://support.microsoft.com/en-us/excel/functions/sum-function). These explain representative foundational topics; no provider affiliation or certification is claimed.

The optional adapter follows Google's [structured-output REST documentation](https://ai.google.dev/gemini-api/docs/generate-content/structured-output?hl=en). Model availability, account access and billing are not established by these implementation references. No real API key or live paid call was used in the test suite.
