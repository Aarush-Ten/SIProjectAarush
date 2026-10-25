# Submission handoff and post-submission checklist

Prepared 25 October 2026. Status: NOT SUBMITTED.

The [official homepage](https://sevainnovationchallenge.in/) lists 30 October 2026. Exact cutoff time and timezone must be checked inside the authenticated dashboard. The [guidelines](https://www.sevainnovationchallenge.in/guidelines.html) request the official PPTX, while template notes mention PDF; use the actual portal upload control's accepted format and size limit. Both drafts are prepared. Public demo/repository links are optional where supported by the form; missing optional links do not alone prevent submission.

1. Open the [registration portal](https://www.register.sevainnovationchallenge.in/) yourself. Check eligibility, regional requirements, exact cutoff, required fields and upload rules. Complete identity and contact verification directly there. Never commit identity documents, Aadhaar numbers, OTPs or credentials.
2. Applicant is Aarush Tendulkar, Team Lead of CYBERSTARS (team size 1), General Category, Education and Employability. Contact remains null and qualification is unprovided; confirm mandatory fields before final submission. Student guidance experts belong to the application database and must not be added automatically to the team roster. Update `docs/pitch/team.json`, regenerate the PPTX using `docs/pitch/README.md`, then export and visually review the PDF again. Check all slides and notes for identity accuracy and unsupported claims.
3. Adapt the application draft to the real fields and limits. Confirm current feature disclosures, future work and intended impact. Test any public links on a separate device. Public deployment remains unfinished Phase 4 work.
4. Run `npm run submission:test` and `npm run submission:package`. Inspect `docs/submission/dist/readiness.json` and verify the bundle hashes with `npm run submission:check`. This checks artifact integrity, not eligibility or submission readiness.
5. Upload the standalone pitch file in the actual required format. The REVIEW_ONLY ZIP is a handoff archive, not the official portal upload. Its video makes it larger than the pitch-file limit. Review the completed form before submitting.
6. After the portal accepts the submission, save the actual acknowledgement/reference and timestamp privately. Store screenshots outside the repository or in ignored `.submission-private/`. A successful file upload or generated ZIP is not an acknowledgement. Do not mark submitted without the real receipt.
7. Only after acknowledgement, follow `docs/pilot-protocol.md` for 5–10 consenting students. Participation and recruitment have not occurred. Record real consent, dates and observations; keep personal contact information outside this repository. Do not send outreach without authorization.
8. Triage reported failures, keep rule versions and before/after regression results when refining weights, and source any catalog expansion. Treat ESCO integration and richer language support as separate scoped changes. Do not retroactively claim later results in the submitted pitch.

## Private acknowledgement record template

Create this privately only when real evidence exists: organizer reference, submission timestamp with timezone, accepted filename and SHA256, actual confirmation text, and private receipt location. Leave unknown fields blank. No receipt currently exists in this project.
