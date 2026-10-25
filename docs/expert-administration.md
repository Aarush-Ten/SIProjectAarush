# Student guidance experts

Experts are application records in the SQL database, independent of the one-member CYBERSTARS team in `docs/pitch/team.json`. No real or demo expert is seeded. There are no confirmed experts or consultations claimed.

## Local setup

1. From `backend/`, run `.venv/Scripts/python.exe -m alembic upgrade head` (Linux/macOS: `.venv/bin/python`). Migration `0003_experts` adds the expert table without replacing catalog data.
2. Generate a random administrator token locally, for example `python -c "import secrets; print(secrets.token_urlsafe(48))"`. Put the generated value in ignored `backend/.env` as `ADMIN_TOKEN=your_generated_value`. It must contain at least 32 characters. Never put it in a `NEXT_PUBLIC_*` variable, source file, public URL or pitch.
3. Restart the backend and open `http://localhost:3000/admin/experts`. Enter the token to unlock. The console retains it only in page memory; refresh or Lock console clears it. It is a single-administrator prototype, without individual admin accounts or password recovery. Rotate the backend token if access must be revoked. Use HTTPS when deployed.
4. Add a profile, expertise areas, optional private contact and availability. Save persists to the configured database. Edit, deactivate, or remove with the console. Removal requires confirmation. Publication and contact consent are separate explicit controls.
5. Visit `/experts` through the main navigation. A profile appears only when active, publicly visible, verified and approved. An administrator must actually check identity/expertise and consent before enabling these flags; the software does not independently verify credentials.

Real consultation availability also requires a non-demo profile and nonblank availability. Demo profiles are visibly labeled, never consultation-available, and never expose contact details. Contact is otherwise private unless the administrator explicitly enables publication with the expert's consent. Contact appears as plain text, not an executable link. There is no scheduling, payment, messaging or booking workflow.

## Storage and deployment

SQLite expert records survive local application restarts. Unlike the seeded catalog, expert records cannot be reconstructed by reseeding. An ephemeral hosting filesystem is insufficient for retaining expert edits. Before real public use, configure durable database storage and backups; Render Free's ephemeral SQLite setup remains suitable only for a disposable demo. Do not claim durable public deployment with the current configuration. Keep database backups private because expert contacts can be personal information.

API routes: authenticated GET/POST `/api/v1/admin/experts`, PUT/DELETE `/api/v1/admin/experts/{id}`, public GET `/api/v1/experts`. Administration is disabled without `ADMIN_TOKEN`. Requests require a bearer token; CORS permits only configured origins. Admin and public directory responses use `Cache-Control: no-store`. Logs omit profile payloads, authorization headers and contact details.

Tests cover authorization, strict validation, persistent database writes, contact disclosure consent, publication gates, demo exclusions, edits, deactivation and removal. The browser test uses an explicit test-only token on an isolated database and deletes its synthetic record afterwards.
