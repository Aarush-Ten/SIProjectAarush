import { z } from "zod";

const text = z.string().max(4000);
const identifier = z.string().min(1).max(160);
const score = z.number().min(0).max(100);

// Resource links come from the reviewed catalog. Validate cached JSON with the
// same allowlist before rendering it as a link; localStorage is untrusted input.
export const trustedResourceHosts = new Set([
  "docs.python.org", "developer.mozilla.org", "www.postgresql.org", "ubuntu.com", "www.nist.gov",
  "csrc.nist.gov", "git-scm.com", "support.microsoft.com", "www.atlassian.com", "learn.microsoft.com",
  "playwright.dev", "developers.google.com", "www.itl.nist.gov", "www.gov.uk", "web.dev",
  "support.google.com", "docs.librecad.org", "openstax.org", "www.hse.gov.uk", "www.energy.gov",
]);

export function isTrustedResourceUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && trustedResourceHosts.has(url.hostname) && !url.username && !url.password && !url.port;
  } catch { return false; }
}

export const resourceUrlSchema = z.string().max(2048).refine(isTrustedResourceUrl, "Only reviewed official learning links are supported.");
export const skillCatalogSchema = z.object({
  skills: z.array(z.object({ id: identifier, label_en: text, label_mr: text.nullable().optional(), description: text })).max(100),
  interests: z.array(z.object({ id: identifier, label: text })).max(50),
});
export const careerSchema = z.object({
  slug: identifier.regex(/^[a-z0-9-]+$/), title: text, summary: text,
  interest_tags: z.array(identifier).max(40), device_requirement: z.enum(["computer", "any"]),
  recommended_hours_per_week: z.number().positive(), practice_budget_inr: z.number().nonnegative(),
  device_note: text, source_note: z.literal("curated_demo"), tasks: z.array(text).max(30),
  skills: z.array(z.object({ skill_id: identifier, label: text, required_level: z.number().int().min(1).max(3), importance: z.enum(["essential", "optional"]), weight: z.number().int().min(1).max(5) })).max(40),
});
export const formulaSchema = z.object({ coverage_weight: z.number().min(0).max(1), interest_weight: z.number().min(0).max(1), feasibility_weight: z.number().min(0).max(1) });
export const careerMatchSchema = z.object({
  career: careerSchema, coverage: score, interest_match: score, interest_status: z.enum(["matched", "unknown"]),
  feasibility: z.object({ score, components: z.array(z.object({ factor: z.enum(["schedule", "device", "budget"]), score, weight: z.number().min(0).max(1), reason: text })).max(3), warnings: z.array(text).max(30) }),
  fit_score: score,
  missing_skills: z.array(z.object({ skill_id: identifier, label: text, user_level: z.number().int().min(0).max(3), required_level: z.number().int().min(1).max(3), missing_level: z.number().int().min(1).max(3), importance: z.enum(["essential", "optional"]) })).max(40),
  reasons: z.array(text).max(30),
});
export const matchesSchema = z.object({ matches: z.array(careerMatchSchema).length(3), total_careers_evaluated: z.number().int().positive(), formula: formulaSchema, notice: text });
export const selectedMatchSchema = z.object({ match: careerMatchSchema, formula: formulaSchema, notice: text });
export const resourceSchema = z.object({
  id: identifier, title: text, provider: text, url: resourceUrlSchema, cost_inr: z.number().nonnegative().nullable(),
  is_free: z.boolean(), skill_ids: z.array(identifier).min(1).max(40), estimated_hours: z.number().positive(),
  source_note: text, last_checked: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(), device_requirement: z.enum(["any", "computer"]),
}).superRefine((resource, context) => {
  if (resource.is_free && resource.cost_inr !== null && resource.cost_inr !== 0) context.addIssue({ code: "custom", message: "Free resources cannot carry a fee." });
});
export const roadmapTaskSchema = z.object({
  id: identifier, skill_id: identifier, skill_label: text, title: text, description: text, activity: text, verification: text,
  estimated_hours: z.number().positive().max(30), resource: resourceSchema.nullable(),
  mode: z.enum(["theory", "practical", "milestone"]), device_requirement: z.enum(["any", "computer"]),
  device_note: text, alternative: text.nullable(), prerequisite_task_ids: z.array(identifier).max(1000),
  part: z.number().int().positive(), total_parts: z.number().int().positive(), importance: z.enum(["essential", "optional", "prerequisite", "milestone"]),
});
export const roadmapSchema = z.object({
  id: identifier, career_slug: identifier.regex(/^[a-z0-9-]+$/), career_title: text, selected_match: careerMatchSchema,
  formula: formulaSchema, generation_source: z.literal("rules"), hours_per_week: z.number().int().min(1).max(30),
  total_hours: z.number().positive(), estimated_weeks: z.number().int().positive(), estimated_cost_inr: z.number().nonnegative(),
  weeks: z.array(z.object({ week_number: z.number().int().positive(), total_hours: z.number().positive().max(30), tasks: z.array(roadmapTaskSchema).min(1).max(1000) })).min(1).max(1000),
  warnings: z.array(text).max(100), assumptions: z.array(text).max(100),
}).superRefine((plan, context) => {
  const seen = new Set<string>();
  let total = 0;
  let milestone = false;
  for (const [index, week] of plan.weeks.entries()) {
    const hours = week.tasks.reduce((sum, task) => sum + task.estimated_hours, 0);
    if (week.week_number !== index + 1 || Math.abs(hours - week.total_hours) > 0.001 || hours > plan.hours_per_week + 0.001) context.addIssue({ code: "custom", path: ["weeks", index], message: "The weekly schedule is inconsistent." });
    for (const task of week.tasks) {
      if (seen.has(task.id) || task.part > task.total_parts || task.prerequisite_task_ids.some((id) => !seen.has(id))) context.addIssue({ code: "custom", path: ["weeks", index], message: "The task sequence is inconsistent." });
      seen.add(task.id);
      if (task.mode === "milestone") milestone = true;
    }
    total += hours;
  }
  if (Math.abs(total - plan.total_hours) > 0.001 || plan.estimated_weeks !== plan.weeks.length || plan.career_slug !== plan.selected_match.career.slug || !milestone) context.addIssue({ code: "custom", message: "The learning plan is inconsistent." });
});
