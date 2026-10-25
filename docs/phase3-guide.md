# Optional AI, assessments and initial Marathi UI

Career ranking and weekly plans remain deterministic. These additions do not change matching weights, skill levels, prerequisite order, resource links, budgets or study hours. Public deployment and submission remain pending.

## Use the features

- Open `/assessments` from navigation or the learning plan. Choose networking basics, web basics, or spreadsheet/data basics. Each has five questions. Submit all answers for a server-calculated raw score and explanations. Four or five correct earns a **quiz-completed** badge, not a credential or proof of job readiness. Retakes are practice after answers are revealed.
- Passing evidence is saved in `pathforge.quiz-evidence.v1`: quiz slug/version, score and timestamp. Answers and explanations are not saved. A previous passing badge remains after a failed retake. Local evidence is user-editable, not authenticated. Clear saved data removes badges and the profile/plan. Blocked storage permits in-memory use.
- Select **मराठी** using Interface language in the header. It changes core navigation and onboarding. The form preference and header stay synchronized without resetting entered values. Language is saved in `pathforge.language.v1`; Clear saved data resets it. API enums and calculations are unchanged.
- Career and roadmap pages offer **Show rules-based guidance**. To request AI wording, check the provider-consent box and press **Request optional AI wording**. The preview covers up to six initial tasks. Original activities, device/safety notices and links remain authoritative. Ordinary onboarding, matching and planning do not call a provider.

## Exact translation coverage

`frontend/lib/i18n.ts` contains the initial dictionary. Translated: navigation links; wizard steps, headings and subtitles; education choices; study-area label/hint; skill-selection instructions and level labels; interest-selection instructions; hour/budget labels and hints; device choices and notices; language label; goal choices and descriptions; privacy/consent wording; wizard actions, loading and retry labels.

English fallback: landing/about content, career titles/descriptions, skill names/descriptions, interest names, schema/API validation errors, recommendations and score explanations, learning tasks/resources, assessments/feedback, AI wording, expert directory/administration, storage notices and footer. A visible mixed-language notice explains this when Marathi is selected. This is initial coverage, not full localization; native-speaker review remains outstanding.

## Backend-only AI configuration

In ignored `backend/.env`, or backend hosting secrets:

```dotenv
AI_PROVIDER=gemini
AI_API_KEY=your_private_provider_key
AI_MODEL=your_available_structured_output_model_id
AI_TIMEOUT_SECONDS=8
AI_REQUESTS_PER_MINUTE=5
AI_REQUESTS_PER_DAY=100
```

Use an actual structured-output model available in your Google account, without a `models/` prefix, and restart the backend. No model/subscription is provisioned. Never put keys in `NEXT_PUBLIC_*`, client code, URLs, the pitch or git. Default `AI_PROVIDER=none` disables the provider. Missing configuration, lack of consent, limits, quota errors, timeout, incomplete/blocked responses or invalid JSON return rules-based guidance, labeled with source and reason. There are no retries.

The adapter uses installed locked `httpx` and Google's [structured-output REST format](https://ai.google.dev/gemini-api/docs/generate-content/structured-output?hl=en), checked 25 October 2026. Endpoint host is fixed, model IDs validated, redirects/proxy discovery disabled. It uses an API-key header, an overall default eight-second deadline (configurable 1–15 seconds), response-size bound and output-token cap. Pydantic rejects unknown fields, excessive prose, HTML/links, unsupported outcome keywords, and changed, missing or duplicate task/resource identities. Schema validation cannot establish semantic correctness; AI prose stays advisory and separate from the original plan.

Only normalized selected skill IDs/levels, catalog career/task references, goal, device, hours and budget are sent. Study-area free text, personal contact, browser identifiers and resource URLs are excluded. Logs omit prompts, outputs, credentials and contacts. Provider handling depends on the account's terms; users explicitly request the optional transfer.

The process-wide limiter allows five calls per rolling minute and 100 per rolling day by default, including failed requests. It ignores forwarded IP headers. Limits reset on restart and multiply across instances/workers: configure provider quotas and a shared limiter before scaling. Request limits are not a guaranteed monetary cap.

## Contracts and verification limits

Routes: GET `/api/v1/assessments`, GET `/api/v1/assessments/{slug}`, POST `/api/v1/assessments/{slug}/grade`, POST `/api/v1/guidance/wording`. Quiz GET schemas contain no answer keys or feedback. Grading requires exactly five unique current question IDs and allowed option IDs; clients cannot submit a score. Grading and wording responses use no-store. Quizzes are versioned developer-authored server-side seed data; grading is stateless, with no student-attempt database.

Run `npm run check:e2e` (set `PLAYWRIGHT_CHANNEL=msedge` on this workspace) and `npm run submission:test`. AI tests mock the transport and adversarial output. A live provider call requires an actual configured key/model; no paid live call was made here. Contract tests do not establish provider-account readiness.
