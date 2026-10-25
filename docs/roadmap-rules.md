# Deterministic roadmap rules

The backend owns plan generation. The same validated profile, selected career, catalog, and rules produce the same plan, order, and task IDs. There are no timestamps, random IDs, LLM calls, external API dependencies, or invented links in generation.

## Input and output

`POST /api/v1/roadmaps/generate` accepts the existing match-request fields plus `career_slug`:

```json
{
  "career_slug": "soc-analyst",
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

The response includes the chosen match and formula, `generation_source: rules`, estimated weeks, total scheduled hours, total resource fees, weekly tasks, warnings, and assumptions. Each task has a skill, activity, verification method, hours, resource or explicit absence, device information, prerequisite task IDs, and split-part metadata. See [openapi.json](openapi.json) for exact shapes.

## Planning sequence

1. Compute essential and optional level gaps using the existing matching service. Unreported skills begin at 0; a level equal to or above the requirement has no gap.
2. Expand manually curated prerequisites transitively, accounting for already reported prerequisite levels. Process essential skills and their prerequisites before optional additions, and keep a stable topological order. Cyclic prerequisite definitions must fail clearly rather than loop.
3. Select a compatible catalog resource, prioritizing free material and then affordable alternatives. A paid resource is counted once even if reused; combined unique resource fees cannot exceed `budget_inr`. Unknown paid prices are not treated as affordable. With no eligible resource, retain an explicitly labeled independent activity without fabricating a URL.
4. Allocate **2 illustrative study hours per missing level** and **1 hour for a manual verification/mini-project milestone**. These constants are design assumptions, not evidence that those hours demonstrate proficiency or complete the entire linked course.
5. Adapt the activity to device and supervision constraints. Phone-based theory alternatives remain labeled as introductory preparation; practical work still requires suitable computer or supervised equipment access.
6. Split study blocks at weekly boundaries in half-hour-compatible units. Every nonempty week's task-hour sum is at most `hours_per_week` (1–30), with all allocated hours preserved. Prerequisite work appears before dependent study.
7. Include a verification milestone even when self-reported levels cover every requirement. It is a manual exercise, not a backend-graded quiz or employment-readiness badge.

## Cost and device assumptions

`estimated_cost_inr` counts selected resource access fees only. It excludes devices, connectivity, transport, supervision, tools, training, and certification. Career equipment-budget notices remain visible even if all selected references are free. Free reading does not imply free access to a lab or qualified trainer.

`device_requirement: any` on a reading resource means introductory material can be read from a phone. Computer-based career practice remains a separate requirement. Solar, electrical, installation, safety, and measurement tasks use theory and documented case exercises; the prototype does not direct unsupervised physical work. Written phone alternatives do not replace practical competence.

## Completion and persistence

Completion is self-reported locally. Users can mark a task done or reopen it; task and hour progress are recalculated from current task IDs and allocated hours. Prerequisites must be completed first, and reopening one also reopens dependent tasks. Completing a task does not increase a skill level, alter a match score, or establish job readiness.

The active plan, profile, selected career, and completion IDs persist only in this browser and origin. Changing profile inputs invalidates an older plan. Generating a replacement plan resets its task completion. Clearing saved data removes the local journey. See [architecture.md](architecture.md) for privacy and recovery limits.
