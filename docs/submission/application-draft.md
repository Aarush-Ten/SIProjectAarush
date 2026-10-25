# PathForge AI — application working draft

Status: REVIEW ONLY, NOT SUBMITTED. Applicant: Aarush Tendulkar. Team: CYBERSTARS. Role: Team Lead. Team size: 1. Competition: Seva First Innovation Challenge — Maharashtra Zone. Category: General Category. Sector: Education and Employability. Contact remains null; qualification, mandatory contact fields and eligibility require final verification directly in the portal.

These are proposed answers, not a transcription of authenticated portal fields. Adapt to the actual field labels and length limits.

## Problem and intended beneficiaries

Students exploring careers need a clear connection between their current skills, career requirements and realistic next learning steps. PathForge targets students with limited study time, learning budgets or device access. This problem statement is a hypothesis pending interviews and a consenting pilot; no beneficiary outcomes have been measured.

## Solution and current stage

PathForge is a working local prototype. A student enters self-reported skills, interests, weekly study time, device access and budget, receives three explained career matches, then creates a weekly learning plan. Progress is retained in the same browser. The curated catalog contains 12 careers, 36 skills and 33 learning resources. Career requirements and time estimates are illustrative.

## Distinguishing mechanism

The deterministic engine separates essential skill coverage, interests and practical feasibility. It exposes skill gaps and adapts weekly plans to time, budget, prerequisites and device constraints. Smartphone profiles receive theory alternatives and practical limitations. Scores describe the configured rules; they are not employment predictions or proof of readiness. No comparative superiority has been established.

## Implementation and feasibility

Next.js provides the responsive interface. FastAPI validates requests and calls pure matching and planning services. SQLite stores the curated catalog; student profiles and progress stay in browser storage, which can be cleared and is not a secure account or cross-device backup. The core journey requires no paid AI service. A token-protected administrator console manages persistent guidance-expert profiles, expertise, private contact, availability, verification, approval and visibility. Only eligible profiles appear publicly; demo profiles cannot offer real consultations. There are currently no experts. Public hosting and its actual costs remain unverified; consult the hosting guide before deployment.

The verification records document passing backend, frontend and browser regression checks, including automated accessibility scans; consult the Phase 3 verification record for current counts. These are engineering checks, not user validation or a full accessibility certification. The supplied walkthrough demonstrates illustrative profiles: six hours per week with a laptop produces a four-week SOC plan; four hours with a smartphone produces a six-week plan.

## Intended impact, validation and next steps

After an actual submission acknowledgement, seek 5–10 consenting students for the documented pilot. Measure completion, time to first plan, understanding, usefulness, resource availability and follow-up progress, recording sample size and dates. Obtain feedback before changing scoring weights; preserve comparable versions. No interviews, pilot results, placements, partners, funding or patents are claimed.

Optional Gemini wording with deterministic fallback, three server-graded practice assessments and initial Marathi core navigation/onboarding are now implemented. A real provider call is not yet verified; initial Marathi text still requires native-speaker review. Other content uses explicit English fallback. Larger sourced catalogs and optional ESCO integration remain future work. The title does not imply that AI determines career scores.

## Evidence and links

The official-template six-slide PPTX and its PDF export, walkthrough, architecture diagram and verification record are included in the review bundle. They are local artifacts. No public demo or repository URL has been verified. Add only links that have actually been opened and tested, if the portal supports them. Do not use localhost links as public evidence.
