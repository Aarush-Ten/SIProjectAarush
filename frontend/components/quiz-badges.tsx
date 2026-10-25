"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { parseEvidence, QUIZ_KEY, type QuizEvidence } from "@/lib/quiz-evidence";

export function QuizBadges() {
  const [records, setRecords] = useState<QuizEvidence>([]);
  useEffect(() => {
    try { const raw = localStorage.getItem(QUIZ_KEY); if (raw) setRecords(parseEvidence(raw)); } catch { /* invalid or blocked storage does not affect the plan */ }
    const clear = () => setRecords([]);
    window.addEventListener("pathforge:clear", clear);
    return () => window.removeEventListener("pathforge:clear", clear);
  }, []);
  return <section className="card phase3-panel" aria-label="Quiz evidence"><h2>Practice and quiz evidence</h2>
    <p>Short practice quizzes can check your understanding. Passing adds a quiz-completed badge; it never changes skill levels, task completion or career scores.</p>
    {records.map(row => <p key={row.slug}><strong>Quiz-completed</strong> · {row.slug.replaceAll("-", " ")} · {row.score}/5 · browser-local record, not a credential</p>)}
    <Link className="button button-secondary" href="/assessments">Try a practice assessment</Link></section>;
}
