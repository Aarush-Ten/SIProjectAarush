import { describe, expect, it } from "vitest";
import { translate, marathi } from "@/lib/i18n";
import { addEvidence, parseEvidence } from "@/lib/quiz-evidence";
import type { Grade } from "@/lib/api/phase3";

describe("initial language coverage", () => {
  it("translates implemented core labels and falls back explicitly to the source text", () => {
    for (const label of ["My pathways", "Learning plan", "Assessments", "Education", "Study area", "Study hours per week", "Preferred language", "Continue", "Compare my pathways"]) {
      expect(translate(label, "mr")).not.toBe(label);
      expect(translate(label, "en")).toBe(label);
    }
    expect(translate("Untranslated catalog description", "mr")).toBe("Untranslated catalog description");
    expect(Object.values(marathi).every(value => /[\u0900-\u097f]/.test(value))).toBe(true);
  });
});
describe("advisory quiz evidence", () => {
  const result = { slug: "web-basics", version: 1, score: 4, passed: true, badge: "quiz-completed" } as Grade;
  it("stores one passing badge per quiz and never stores answers", () => {
    const record = addEvidence(addEvidence([], result), { ...result, score: 5 });
    expect(record).toHaveLength(1);
    expect(record[0].score).toBe(5);
    expect(JSON.stringify(record)).not.toContain("answer");
    expect(parseEvidence(JSON.stringify(record))).toEqual(record);
  });
  it("does not award a badge for a failed attempt", () => {
    expect(addEvidence([], { ...result, score: 3, passed: false, badge: null })).toEqual([]);
  });
  it("rejects forged scores, unknown quizzes, duplicate or oversized storage", () => {
    const record = addEvidence([], result);
    expect(() => parseEvidence(JSON.stringify([{ ...record[0], score: 100 }]))).toThrow();
    expect(() => parseEvidence(JSON.stringify([{ ...record[0], slug: "unknown" }]))).toThrow();
    expect(() => parseEvidence(JSON.stringify([...record, ...record]))).toThrow();
    expect(() => parseEvidence("x".repeat(6001))).toThrow();
  });
});
