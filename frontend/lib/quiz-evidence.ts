import { z } from "zod";
import type { Grade } from "@/lib/api/phase3";

export const QUIZ_KEY = "pathforge.quiz-evidence.v1";
const slugs = z.enum(["networking-basics", "web-basics", "spreadsheet-data-basics"]);
const evidenceSchema = z.array(z.object({ slug: slugs, version: z.literal(1), score: z.number().int().min(4).max(5), badge: z.literal("quiz-completed"), completed_at: z.iso.datetime() })).max(3).refine(rows => new Set(rows.map(row => row.slug)).size === rows.length);
export type QuizEvidence = z.infer<typeof evidenceSchema>;
export function parseEvidence(raw: string): QuizEvidence {
  if (raw.length > 6000) throw new Error("Quiz record too large");
  return evidenceSchema.parse(JSON.parse(raw));
}
export function addEvidence(current: QuizEvidence, grade: Grade): QuizEvidence {
  if (!grade.passed || grade.score < 4 || grade.badge !== "quiz-completed") return current;
  return evidenceSchema.parse([...current.filter(item => item.slug !== grade.slug), { slug: grade.slug, version: 1, score: grade.score, badge: grade.badge, completed_at: new Date().toISOString() }]);
}
