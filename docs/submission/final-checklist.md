# Phase 5 finalization checklist

## Completed locally

- Applicant: Aarush Tendulkar; role: Team Lead; team: CYBERSTARS; team size: 1. Project: PathForge AI. Competition: Seva First Innovation Challenge — Maharashtra Zone. General Category; Education and Employability.
- Applicant suffix removed from current source documentation, pitch slides, speaker notes and submission metadata. Contact remains `null`; no permanent contact or qualification invented.
- Project team JSON contains only the actual one-member team. Student guidance experts are managed independently in database records, not the pitch roster.
- Administrator console `/admin/experts`: add, edit, remove, deactivate, expertise, private contact, availability, verification, approval and public visibility. Backend-only token required. No expert is seeded or claimed.
- Public `/experts`: publication gates enforced server-side; demo records labeled and excluded from real consultations; contact private unless explicitly enabled. No booking system is claimed.
- Additive expert migration applied locally. Existing matching, weekly plans and local student progress preserved. Official six-slide template preserved; current `PathForge_AI_CYBERSTARS_PHASE3_DRAFT.pptx` and matching PDF regenerated. Existing walkthrough preserved; architecture updated for expert storage.
- Automated regression and review-bundle integrity checks: see [verification](../phase5-verification.md). Standalone pitch files, application draft and review-only archive prepared.

## Deployment tasks still pending

- Publish the source repository and configure authenticated hosting, HTTPS origins and exact CORS settings. No repository or application URL exists yet.
- Configure durable database storage and private backups before retaining real expert records. Existing ephemeral free-host SQLite setup is insufficient for durable expert edits.
- Configure a random backend-only administrator token and rotate it when access changes. Administration remains disabled if omitted. Never embed this token in frontend builds.
- Run the public deployment checker and manually verify the student and administrator journeys on a separate mobile device. Add only working, verified public URLs if supported by the portal.

## Applicant / portal confirmation required

- Verify eligibility and the selected category/sector in the actual portal. The values above are applicant-provided, not an organizer eligibility determination.
- Confirm any mandatory real contact, qualification, photo, consent or identity-verification fields directly in the portal. Current contact is deliberately null. Do not store sensitive identifiers or OTPs in the repository.
- Check exact cutoff time/timezone, field lengths, accepted upload format and size inside the authenticated portal. Follow its actual control where the public PPTX guideline and PDF template notes differ.
- Review the final application and pitch. Upload the standalone required pitch, not the review archive. Retain the actual acknowledgement privately after acceptance.

No public deployment, portal upload, submission acknowledgement, expert partnership or pilot result is claimed. Phase 5 remains incomplete until acknowledgement exists. Phase 3 additions are implemented with live-provider verification and native-speaker Marathi review outstanding; see the Phase 3 guide.
