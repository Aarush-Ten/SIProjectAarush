"use client";

import Link from "next/link";
import { OptionalWording } from "@/components/optional-wording";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, ArrowRight, Check, ChevronDown, Compass, Laptop, ListChecks, LoaderCircle, RefreshCw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useProfile } from "@/components/profile-provider";
import { SessionLoading } from "@/components/session-notice";
import { FormulaDetails, MatchScores, SkillGapTable } from "@/components/match-details";
import { ApiError, generateRoadmap, getCareer, getCareerMatch } from "@/lib/api/client";
import type { Career, SelectedCareerMatch } from "@/lib/types/api";
import { profileKey } from "@/lib/session-storage";

export function CareerDetail({ slug }: { slug: string }) {
  const router = useRouter();
  const { hydrated, profile, selectCareer, setRoadmap, roadmap } = useProfile();
  const [career, setCareer] = useState<Career | null>(null);
  const [comparison, setComparison] = useState<SelectedCareerMatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [retryGeneration, setRetryGeneration] = useState(false);
  const generationController = useRef<AbortController | null>(null);
  const requestKey = profile ? profileKey(profile) : "";

  useEffect(() => {
    if (!hydrated) return;
    const controller = new AbortController();
    setError(null); setNotFound(false); setCareer(null); setComparison(null); setRetryGeneration(false);
    (async () => {
      try {
        const loadedCareer = await getCareer(slug, controller.signal);
        if (controller.signal.aborted) return;
        setCareer(loadedCareer);
        if (profile) {
          const match = await getCareerMatch(slug, profile, controller.signal);
          if (!controller.signal.aborted) setComparison(match);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setNotFound(error instanceof ApiError && error.status === 404);
        setError(error instanceof Error ? error.message : "The career could not be loaded.");
      }
    })();
    return () => controller.abort();
    // requestKey captures a canonical profile snapshot without retriggering for progress changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, hydrated, requestKey, attempt]);
  useEffect(() => () => generationController.current?.abort(), []);

  async function createPlan() {
    if (!profile) return;
    const controller = new AbortController();
    generationController.current = controller;
    setGenerating(true); setError(null); setRetryGeneration(true);
    try {
      const plan = await generateRoadmap(slug, profile, controller.signal);
      if (controller.signal.aborted) return;
      setRoadmap(plan, profile);
      selectCareer(slug);
      router.push("/roadmap");
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "The plan could not be created. Please try again.");
    } finally { if (!controller.signal.aborted) setGenerating(false); }
  }

  if (!hydrated) return <SessionLoading />;
  return <>
    <Link className="text-link back-link" href="/dashboard"><ArrowLeft size={16} /> Back to my pathways</Link>
    {error && <div className="error-box" role="alert"><AlertCircle size={22} /><div><strong>{notFound ? "That career isn’t in this catalog." : "We couldn’t finish that request."}</strong><p>{error}</p>{!notFound && <Button variant="secondary" size="small" disabled={generating} onClick={() => retryGeneration ? void createPlan() : setAttempt((value) => value + 1)}>Try again <RefreshCw size={14} /></Button>}</div></div>}
    {!career && !error && <div className="loading-state" role="status"><LoaderCircle className="spin" size={24} /><p>Loading this career and your comparison…</p></div>}
    {career && <>
      <header className="career-heading"><p className="eyebrow"><Compass size={16} /> A DIRECTION TO EXPLORE</p><h1>{career.title}</h1><p>{career.summary}</p><span className="source-pill">Illustrative, curated demo requirements</span></header>
      <div className="career-overview-grid"><section className="card detail-section"><ListChecks size={24} /><h2>What the work can involve</h2><ul className="career-tasks">{career.tasks.map((task) => <li key={task}><Check size={16} /><span>{task}</span></li>)}</ul><p className="field-hint">Illustrative tasks—not a job description, certification standard, or promise of work.</p></section><section className="card detail-section"><Laptop size={24} /><h2>Practical access matters</h2><p>{career.device_note}</p><p className="field-hint">Suggested study pace: {career.recommended_hours_per_week} hours/week. Illustrative practice budget: ₹{career.practice_budget_inr.toLocaleString("en-IN")}. These are planning assumptions, not provider prices.</p></section></div>
      <section className="card detail-section"><h2>Skills this pathway uses</h2><div className="requirement-grid">{(["essential", "optional"] as const).map((importance) => <div key={importance}><h3>{importance === "essential" ? "Essential skills" : "Optional additions"}</h3><ul className="requirement-list">{career.skills.filter((skill) => skill.importance === importance).map((skill) => <li key={skill.skill_id}><span>{skill.label}</span><strong>Level {skill.required_level}<small> / 3</small></strong></li>)}</ul></div>)}</div><p className="field-hint">Levels: 1 foundations · 2 practising · 3 confident. Optional additions do not reduce essential skill coverage.</p></section>
      {profile ? comparison ? <section className="career-comparison" data-testid="career-comparison"><div className="section-heading"><div><p className="eyebrow">YOUR PROFILE, THIS PATH</p><h2>Your starting point</h2></div></div><MatchScores match={comparison.match} /><div className="selected-grid"><section className="card gaps-card"><h3>Your exact skill gaps</h3><div className="gap-section-label">ESSENTIAL SKILLS</div><SkillGapTable gaps={comparison.match.missing_skills.filter((gap) => gap.importance === "essential")} /><details className="optional-details"><summary>Optional skill gaps <ChevronDown size={16} /></summary><SkillGapTable gaps={comparison.match.missing_skills.filter((gap) => gap.importance === "optional")} /></details></section><section className="card why-card"><h3>Why this match?</h3><ul className="reason-list">{comparison.match.reasons.map((reason) => <li key={reason}><Check size={15} /><span>{reason}</span></li>)}</ul>{comparison.match.feasibility.components.map((component) => <div className="detail-constraint" key={component.factor}><strong>{component.factor} · {component.score}/100</strong><p>{component.reason}</p></div>)}{comparison.match.feasibility.warnings.map((warning) => <p className="constraint-warning" key={warning}>{warning}</p>)}</section></div><FormulaDetails formula={comparison.formula} /><p className="catalog-notice">{comparison.notice}</p></section> : !error && <div className="loading-state" role="status"><LoaderCircle className="spin" size={22} /><p>Comparing this career with your saved profile…</p></div> : <div className="inline-notice"><Compass size={20} /><p>Add your profile to see your skill gaps and create a personalized plan. <Link href="/onboarding" className="text-link">Find my pathway <ArrowRight size={15} /></Link></p></div>}
      <section className="plan-cta card"><div><p className="eyebrow">FROM DIRECTION TO ACTION</p><h2>Make a little room for progress.</h2><p>A weekly plan built around your available hours, device, and budget—with practical limitations made clear.</p></div>{profile ? <div className="plan-cta-actions">{roadmap?.career_slug === slug && <Link className={buttonVariants({ variant: "secondary" })} href="/roadmap">Continue my roadmap <ArrowRight size={17} /></Link>}<Button onClick={() => void createPlan()} disabled={generating || !comparison}>{generating ? <><LoaderCircle size={18} className="spin" /> Building your plan…</> : <>{roadmap?.career_slug === slug ? "Create a new roadmap" : "Create my roadmap"} <ArrowRight size={17} /></>}</Button>{roadmap && <p className="field-hint">Creating a new plan replaces your active plan and its completion progress.</p>}</div> : <Link className={buttonVariants({})} href="/onboarding">Add my profile <ArrowRight size={17} /></Link>}</section>
    </>}
  <OptionalWording slug={slug} /></>;
}
