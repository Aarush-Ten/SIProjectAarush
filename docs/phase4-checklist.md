# Phase 4 release checklist

Scope: polish and presentation of the completed deterministic Phase 1–2 prototype. Phase 3 AI, assessments, and translations remain unimplemented at the user's direction to proceed to Phase 4.

## Local verification

- Run `npm run check:e2e` with installed Chromium or `PLAYWRIGHT_CHANNEL=msedge`.
- The browser suite checks the guest journey and automated WCAG A/AA rules at 375px and 1280px. Automated scanning is not full WCAG certification.
- Test keyboard skip link, input focus, radio selections, expanded score explanations, task completion and cascading reopen.
- Check blocked/corrupt browser storage, matching errors, unknown pages, and a backend cold start. No screen should silently imply success.
- Verify the original specification copy, migrations, catalog counts, and generated OpenAPI interface freshness.

## Deployment — account connection required

1. Connect the intended Vercel and Render accounts and select the source repository. No Git remote or authenticated deployment CLI existed in this workspace at inspection.
2. Use `render.yaml` for the backend; enter the exact production frontend origin as a JSON list for `CORS_ORIGINS`. The free backend rebuilds its public catalog on restart via `backend/start.sh`.
3. Vercel root is `frontend`; Node 22; `NEXT_PUBLIC_API_URL` is the Render HTTPS origin without `/api/v1`. Rebuild after changing it.
4. Run `npm run check:deployment -- --frontend https://ACTUAL-FRONTEND --backend https://ACTUAL-BACKEND`.
5. Run the whole guest journey on an actual phone using the public URL. Refresh task progress and verify an external learning link. Save actual deployment URLs only after they exist.
6. Keep prototype notices, privacy, English fallback, and free-host cold-start limitations visible. See [hosting-guide.md](hosting-guide.md).

## Walkthrough and pitch

- The recording command is `npm --prefix frontend run record:walkthrough`; install the Playwright FFmpeg helper with `npx playwright install ffmpeg` from frontend first.
- Output is `docs/media/pathforge-walkthrough.webm`: approximately three minutes, captioned, local application, no narration. It demonstrates actual functionality; it does not imply a public deployment or student pilot.
- The original official six-slide template is retained in `docs/pitch/official-template.pptx` with its filled draft alongside it. `team.json` holds Aarush Tendulkar, Team Lead, team size 1, and null contact. Student guidance experts are stored separately in the database.
- Keep the project team separate from student guidance experts. Verify mandatory contact fields before actual submission. Keep unmeasured impact, unconfirmed partners and absent public URLs explicit.
- The official guidelines page says PPTX; the downloaded template asks PDF ≤10 MB. Both artifacts are prepared where the installed PowerPoint renderer permits; the live portal's format/size field must be checked before submission.
- Do not submit, upload identity details, or claim application acknowledgement as part of Phase 4.

## Cost assumptions

Current runtime makes zero LLM calls and requires no paid API key. Catalog links are free public reading, not free certification or lab access. Personal/non-commercial Vercel Hobby plus Render Free can host a demo within their limits, with backend sleep/cold starts and no persistent free disk. This is not an always-on service commitment. Domain registration, engineering time, internet/devices, curriculum review, trainer supervision, accessibility review and pilot support are excluded from a zero-cash hosting claim.

No per-student production cost is yet measured. For a pilot, first record consenting participant count, usage and staff time, then use actual provider quotes for any paid capacity. No sponsor, grant, revenue, or institutional adoption is confirmed.

## Sources checked 25 October 2026

- [Official Maharashtra guidelines/template](https://www.sevainnovationchallenge.in/guidelines.html)
- [Official event site](https://sevainnovationchallenge.in/): public page displays 30 October 2026, but the participant dashboard's exact cutoff/time zone/upload constraints still require inspection.
- [Vercel Hobby](https://vercel.com/docs/plans/hobby), [Render Free](https://render.com/docs/free)
- The official template download URL is `https://www.sevainnovationchallenge.in/assets/Seva-First-Innovation-Challenge-PPT-Template.pptx`.
