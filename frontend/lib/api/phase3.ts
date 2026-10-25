import { z } from "zod";
import { apiRequest } from "@/lib/api/client";
import type { MatchRequest } from "@/lib/types/api";

const info = z.object({ slug: z.string(), title: z.string(), skill_id: z.string(), question_count: z.literal(5), version: z.literal(1) });
export const quizSchema = info.extend({ questions: z.array(z.object({ id: z.string(), prompt: z.string(), options: z.array(z.object({ id: z.enum(["a", "b", "c", "d"]), text: z.string() })).length(4) })).length(5), notice: z.string() });
export const gradeSchema = z.object({ slug: z.string(), title: z.string(), version: z.literal(1), score: z.number().int().min(0).max(5), total: z.literal(5), passed: z.boolean(), badge: z.literal("quiz-completed").nullable(), feedback: z.array(z.object({ question_id: z.string(), selected_option_id: z.string(), correct_option_id: z.string(), correct: z.boolean(), explanation: z.string() })).length(5), notice: z.string() }).superRefine((value, ctx) => {
  if (value.score !== value.feedback.filter(item => item.correct).length || value.passed !== (value.score >= 4) || (value.badge !== null) !== value.passed) ctx.addIssue({ code: "custom", message: "Inconsistent assessment grade" });
});
export type Quiz = z.infer<typeof quizSchema>;
export type Grade = z.infer<typeof gradeSchema>;
export const listQuizzes = () => apiRequest("/assessments", z.array(info));
export const getQuiz = (slug: string) => apiRequest(`/assessments/${encodeURIComponent(slug)}`, quizSchema);
export const gradeQuiz = (slug: string, answers: { question_id: string; option_id: string }[]) => apiRequest(`/assessments/${encodeURIComponent(slug)}/grade`, gradeSchema, { method: "POST", body: JSON.stringify({ answers }) });
export const wordingSchema = z.object({
  source: z.enum(["rules", "llm"]), reason: z.enum(["not_requested", "not_configured", "rate_limited", "provider_unavailable", "validated"]),
  language: z.literal("en"), notice: z.string(), explanation: z.string().max(600),
  tasks: z.array(z.object({ task_id: z.string(), resource_id: z.string().nullable(), wording: z.string().max(400) })).max(6),
});
export const getWording = (request: MatchRequest, slug: string, consent: boolean) => apiRequest("/guidance/wording", wordingSchema, { method: "POST", body: JSON.stringify({ ...request, career_slug: slug, consent_to_ai: consent }) }, 20000);
