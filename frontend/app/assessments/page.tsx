"use client";
import { useEffect, useRef, useState } from "react";
import { listQuizzes, getQuiz, gradeQuiz, type Quiz, type Grade } from "@/lib/api/phase3";
import { addEvidence, parseEvidence, QUIZ_KEY, type QuizEvidence } from "@/lib/quiz-evidence";

export default function AssessmentsPage() {
  const [catalog, setCatalog] = useState<Awaited<ReturnType<typeof listQuizzes>>>([]);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Grade | null>(null);
  const [evidence, setEvidence] = useState<QuizEvidence>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [storageNotice, setStorageNotice] = useState("");
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const revision = useRef(0);
  async function load() {
    setBusy(true); setError("");
    try { setCatalog(await listQuizzes()); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load assessments."); }
    finally { setBusy(false); }
  }
  useEffect(() => {
    void load();
    try { const raw = localStorage.getItem(QUIZ_KEY); if (raw) setEvidence(parseEvidence(raw)); }
    catch { setStorageNotice("Saved quiz records are unavailable or invalid. You can continue in memory."); }
    const clear = () => { revision.current++; setEvidence([]); setResult(null); setAnswers({}); setStorageNotice("Quiz evidence cleared."); };
    window.addEventListener("pathforge:clear", clear);
    return () => window.removeEventListener("pathforge:clear", clear);
  }, []);
  useEffect(() => { if (result) resultHeading.current?.focus(); }, [result]);
  async function choose(slug: string) {
    setBusy(true); setError(""); setResult(null); setQuiz(null); setAnswers({});
    try { setQuiz(await getQuiz(slug)); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load quiz. Select it to retry."); }
    finally { setBusy(false); }
  }
  async function submit() {
    if (!quiz) return;
    const current = revision.current;
    setBusy(true); setError("");
    try {
      const grade = await gradeQuiz(quiz.slug, quiz.questions.map(question => ({ question_id: question.id, option_id: answers[question.id] })));
      if (current !== revision.current) return;
      setResult(grade);
      const next = addEvidence(evidence, grade); setEvidence(next);
      try { localStorage.setItem(QUIZ_KEY, JSON.stringify(next)); } catch { setStorageNotice("Quiz evidence is kept in memory only; refresh may lose it."); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Grading failed. Your answers are still here; try again."); }
    finally { setBusy(false); }
  }
  return <main id="main-content" className="container expert-page" lang="en"><h1>Practice assessments</h1><p>Five questions each, graded on the server. At least four correct earns a quiz-completed badge. It is practice evidence, not a qualification or proof of job readiness.</p>
    <p>English fallback: quizzes are currently available in English. Answers are shown only after submission. Retakes do not change your skills or exploration scores.</p>
    {busy && <p role="status">Loading or grading your quiz…</p>}{error && <div role="alert"><p>{error}</p>{!catalog.length && <button className="button button-secondary" onClick={() => void load()}>Try again</button>}</div>}
    {storageNotice && <p role="status">{storageNotice}</p>}
    <nav className="expert-actions" aria-label="Choose an assessment">{catalog.map(item => <button key={item.slug} className="button button-secondary" disabled={busy} onClick={() => void choose(item.slug)}>{item.title}</button>)}</nav>
    {evidence.length > 0 && <section className="phase3-panel"><h2>Your quiz-completed badges</h2>{evidence.map(item => <p key={item.slug}>{item.slug.replaceAll("-", " ")} · {item.score}/5 · browser-local evidence</p>)}</section>}
    {quiz && <section className="phase3-panel"><h2>{quiz.title}</h2><p>{quiz.notice}</p><form onSubmit={event => { event.preventDefault(); void submit(); }}>
      <fieldset disabled={busy || !!result}>{quiz.questions.map((question, index) => <fieldset className="quiz-question" key={question.id}><legend>{index + 1}. {question.prompt}</legend>{question.options.map(option => <label key={option.id} className="quiz-option"><input type="radio" name={question.id} value={option.id} required checked={answers[question.id] === option.id} onChange={() => setAnswers(current => ({ ...current, [question.id]: option.id }))} />{option.text}</label>)}</fieldset>)}</fieldset>
      {!result && <button className="button button-primary" disabled={busy || quiz.questions.some(question => !answers[question.id])}>Submit answers</button>}
    </form></section>}
    {result && <section className="phase3-panel"><h2 tabIndex={-1} ref={resultHeading}>Your score: {result.score} / {result.total}</h2><p>{result.passed ? "Quiz-completed badge earned. This records quiz practice only." : "Keep practising. Review the explanations and try again."}</p>
      {result.feedback.map((item, index) => <div className="quiz-feedback" key={item.question_id}><h3>Question {index + 1}: {item.correct ? "Correct" : "Review"}</h3><p>Your answer: {quiz?.questions[index]?.options.find(option => option.id === item.selected_option_id)?.text}</p><p>Correct answer: {quiz?.questions[index]?.options.find(option => option.id === item.correct_option_id)?.text}</p><p>{item.explanation}</p></div>)}
      <button className="button button-secondary" onClick={() => { setResult(null); setAnswers({}); }}>Try this quiz again</button></section>}
  </main>;
}
