"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, ArrowUpRight, BarChart3, Check, ChevronDown, Compass, Edit3, Info, Laptop, LoaderCircle, RefreshCw, ShieldCheck, SlidersHorizontal, Target } from "lucide-react";
import { useProfile } from "@/components/profile-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { getMatches } from "@/lib/api/client";
import type { CareerMatch, SkillGap } from "@/lib/types/api";
import { cn, formatScore } from "@/lib/utils";
import { SessionLoading } from "@/components/session-notice";
import { roadmapProgress } from "@/lib/session-storage";

const devices = { laptop: "Laptop / computer", shared_computer: "Shared computer", smartphone_only: "Smartphone only" };

function Score({ label, value, testId, unknown = false }: { label: string; value: number; testId: string; unknown?: boolean }) {
  return <div className="score-row"><span>{label}{unknown && <small>Unknown · neutral</small>}</span><strong data-testid={testId}>{formatScore(value)}<small>%</small></strong></div>;
}

function GapTable({ gaps }: { gaps: SkillGap[] }) {
  if (!gaps.length) return <p className="complete-skills"><Check size={18} /> Your self-reported levels cover these curated requirements.</p>;
  return <div className="gap-table"><div className="gap-table-heading" aria-hidden="true"><span>Skill</span><span>Your level</span><span>Required</span><span>Gap</span></div>{gaps.map((gap) => <div className="gap-row" key={gap.skill_id} data-testid={`gap-${gap.skill_id}`}><strong>{gap.label}</strong><span><span className="sr-only">Your level </span><b data-testid="gap-user-level">{gap.user_level}</b><small> / 3</small></span><span><span className="sr-only">Required level </span><b data-testid="gap-required-level">{gap.required_level}</b><small> / 3</small></span><span className="gap-value"><span className="sr-only">Missing levels </span>+<b data-testid="gap-missing-level">{gap.missing_level}</b></span></div>)}</div>;
}

function MatchCard({ match, index, selected, onSelect }: { match: CareerMatch; index: number; selected: boolean; onSelect: () => void }) {
  const missing = match.missing_skills.filter((skill) => skill.importance === "essential");
  return <article className={cn("match-card", selected && "selected")} aria-label={`${match.career.title} recommendation`} data-testid={`match-${match.career.slug}`}>
    <div className="match-card-top"><span className="match-number">0{index + 1} <span>{index === 0 ? "TOP EXPLORATION MATCH" : "ANOTHER DIRECTION"}</span></span><Compass size={21} strokeWidth={1.5} /></div><h2>{match.career.title}</h2><p className="match-summary">{match.career.summary}</p><div className="fit-score"><strong data-testid="fit-score">{formatScore(match.fit_score)}<small> / 100</small></strong><span>Exploration fit</span></div><div className="fit-bar" aria-hidden="true"><span style={{ width: `${match.fit_score}%` }} /></div><div className="component-scores"><Score label="Self-reported skill coverage" value={match.coverage} testId="coverage-score" /><Score label="Interest alignment" value={match.interest_match} testId="interest-score" unknown={match.interest_status === "unknown"} /><Score label="Practical feasibility" value={match.feasibility.score} testId="feasibility-score" /></div><div className="card-gap-preview"><span>ESSENTIAL SKILLS TO BUILD</span><p>{missing.length ? missing.map((gap) => gap.label).join(" · ") : "No essential gaps at your reported levels"}</p></div><Button variant={selected ? "default" : "secondary"} className="match-select" onClick={onSelect} aria-pressed={selected}>{selected ? <>Viewing skill gaps <Check size={16} /></> : <>Explore this match <ArrowRight size={16} /></>}</Button>
  </article>;
}

export function MatchResults() {
  const { profile, results, formValues, setSession, hydrated, selectedCareerSlug, selectCareer, roadmap, completedTaskIds } = useProfile();
  const selectedSlug = selectedCareerSlug ?? "";
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const detailRef = useRef<HTMLElement>(null);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (!selectedSlug) return;
    const heading = document.getElementById("selected-heading");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
  }, [selectedSlug]);

  if (!hydrated) return <SessionLoading />;
  if (!profile || !results) return <section className="empty-state"><span className="empty-icon"><Compass size={42} strokeWidth={1.3} /></span><p className="eyebrow">LET’S START WITH YOU</p><h1>Your pathway starts with a profile.</h1><p>Tell us a little about your skills and interests to compare three career directions. Your profile, plan, and progress can be saved on this browser.</p><Link href="/onboarding" className={buttonVariants({})}>Find my pathway <ArrowUpRight size={18} /></Link><Link href="/" className="text-link"><ArrowLeft size={16} /> Back to home</Link></section>;

  const activeMatch = results.matches.find((match) => match.career.slug === selectedSlug) ?? results.matches[0];
  const essentialGaps = activeMatch.missing_skills.filter((gap) => gap.importance === "essential");
  const optionalGaps = activeMatch.missing_skills.filter((gap) => gap.importance === "optional");
  const progress = roadmap ? roadmapProgress(roadmap, completedTaskIds) : null;

  async function refreshMatches() {
    if (!profile || !formValues) return;
    setRefreshing(true);
    setError(null);
    const abortController = new AbortController();
    controller.current = abortController;
    try { setSession(profile, formValues, await getMatches(profile, abortController.signal)); }
    catch (error) { if (!abortController.signal.aborted) setError(error instanceof Error ? error.message : "Please try again."); }
    finally { if (!abortController.signal.aborted) setRefreshing(false); }
  }

  return <>
    <div className="dashboard-heading"><div><p className="eyebrow"><span className="status-dot" /> YOUR POSSIBILITIES, EXPLAINED</p><h1>Your next direction<br /><span>starts here.</span></h1><p>Three pathways to explore. A clearer picture of what you bring—and what you could learn next.</p></div><Link href="/onboarding" className={buttonVariants({ variant: "secondary", size: "small" })}><Edit3 size={15} /> Edit my profile</Link></div>
    {roadmap && progress && <section className="card active-plan" data-testid="active-plan"><Compass size={26} /><div><p className="eyebrow">YOUR ACTIVE LEARNING PLAN</p><h2>{roadmap.career_title}</h2><p>{progress.completedTasks} of {progress.totalTasks} tasks · {formatScore(progress.percent)}% of study hours complete</p></div><Link href="/roadmap" className={buttonVariants({ variant: "secondary" })}>Continue my roadmap <ArrowRight size={17} /></Link></section>}
    <div className="profile-strip"><span><SlidersHorizontal size={17} /> Your starting point</span><span>{profile.profile.hours_per_week} hours / week</span><span>{devices[profile.profile.device_access]}</span><span>₹{new Intl.NumberFormat("en-IN").format(profile.profile.budget_inr)} learning budget</span><span>{profile.skills.length} self-reported skills</span></div>
    {profile.profile.language === "mr" && <div className="inline-notice"><Info size={18} /><p>English fallback: your Marathi preference is recorded. This prototype currently displays all content in English.</p></div>}
    <div className="results-note"><Info size={17} /><p><strong>Exploration fit is a ranking guide.</strong> Skill coverage is self-reported—not a probability of employment. You can revisit these choices as you learn.</p></div>
    <div className="results-section-heading"><h2>Your top 3 directions <span>from {results.total_careers_evaluated} curated careers</span></h2><Button variant="ghost" size="small" onClick={() => void refreshMatches()} disabled={refreshing}>{refreshing ? <LoaderCircle className="spin" size={15} /> : <RefreshCw size={15} />} {refreshing ? "Refreshing…" : "Refresh matches"}</Button></div>
    {error && <div className="error-box" role="alert"><AlertTriangle size={20} /><div><p>{error}</p><Button variant="secondary" size="small" onClick={() => void refreshMatches()}>Try again <RefreshCw size={14} /></Button></div></div>}
    <div className="matches-grid" aria-busy={refreshing}>{results.matches.map((match, index) => <MatchCard match={match} index={index} key={match.career.slug} selected={match.career.slug === activeMatch.career.slug} onSelect={() => { selectCareer(match.career.slug); detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }} />)}</div>
    <section className="selected-path" ref={detailRef} aria-labelledby="selected-heading" data-testid="career-detail"><div className="selected-path-heading"><div><p className="eyebrow">A CLOSER LOOK AT YOUR SELECTED PATH</p><h2 id="selected-heading">{activeMatch.career.title}</h2></div><span className="selection-tag"><Target size={15} /> Selected direction</span></div><div className="selected-grid"><div className="card gaps-card"><div className="card-section-heading"><BarChart3 size={21} /><div><h3>Your exact skill gaps</h3><p>Self-reported levels compared with curated requirements.</p></div></div><div className="gap-section-label">ESSENTIAL SKILLS <span>{essentialGaps.length} to build</span></div><GapTable gaps={essentialGaps} /><details className="optional-details"><summary>Optional skills <span>{optionalGaps.length} gaps</span><ChevronDown size={15} /></summary><p>Useful additions. Optional skills do not reduce essential skill coverage.</p><GapTable gaps={optionalGaps} /></details><p className="level-note">Levels: 0 new · 1 foundations · 2 practising · 3 confident. Gap = required level − your level, with a minimum of 0.</p></div><div className="card why-card"><div className="card-section-heading"><Compass size={21} /><h3>Why this direction?</h3></div><ul className="reason-list">{activeMatch.reasons.map((reason) => <li key={reason}><Check size={15} /><span>{reason}</span></li>)}</ul><h4>Working with your constraints</h4><ul className="constraint-list">{activeMatch.feasibility.components.map((component) => <li key={component.factor}><span>{component.factor} <strong>{formatScore(component.score)} / 100</strong></span><p>{component.reason}</p></li>)}</ul>{activeMatch.feasibility.warnings.map((warning) => <div className="constraint-warning" role="note" key={warning}><AlertTriangle size={17} /><p>{warning}</p></div>)}<p className="device-note"><Laptop size={16} /> {activeMatch.career.device_note}</p></div></div></section>
    <details className="formula-details"><summary><span><ShieldCheck size={20} /> How this match was calculated</span><ChevronDown size={20} /></summary><div className="formula-content"><p>Every score above comes directly from the deterministic backend. No language model selects or ranks your career paths.</p><div className="formula-line">Exploration fit = <strong>{formatScore(results.formula.coverage_weight * 100)}% skill coverage</strong> + <strong>{formatScore(results.formula.interest_weight * 100)}% interest alignment</strong> + <strong>{formatScore(results.formula.feasibility_weight * 100)}% feasibility</strong></div><div className="formula-grid"><div><h3>Essential skill coverage</h3><p>100 × Σ(weight × min(your level ÷ required level, 1)) ÷ Σ(weight). Unreported skills count as 0. Optional skills do not affect this measure, and higher levels cannot push coverage above 100%.</p></div><div><h3>Interest alignment</h3><p>The share of a career’s interest tags that overlap with your selected interests, from 0 to 100. If you select none, the value is a neutral 50 and is marked “unknown.”</p></div><div><h3>Practical feasibility</h3><p>Schedule contributes 40%, device access 40%, and budget 20%. A lower feasibility score highlights constraints worth planning around; it does not rule out a career.</p></div></div><details className="rule-details"><summary>View the feasibility rule table <ChevronDown size={15} /></summary><div className="rule-table"><div><strong>Schedule</strong><p>At or above the career’s suggested weekly hours: 100. At least half: 75. Below half: 50.</p></div><div><strong>Device</strong><p>Suitable device or laptop: 100. Shared computer for a computer-based career: 75. Smartphone only for that career: 25.</p></div><div><strong>Budget</strong><p>Meets the career’s illustrative practice budget: 100. Below that assumption: 50. These estimates are not course prices.</p></div></div></details><p className="formula-limit">Weights are an initial design hypothesis for review through future pilot feedback. Rankings use full precision; displayed scores are rounded by the API to two decimal places.</p></div></details>
    <section className="phase-boundary"><span className="empty-icon"><Compass size={24} /></span><div><h2>A direction today. A plan to begin.</h2><p>Explore the selected career in detail, then build a weekly roadmap around your available hours, device, and budget.</p></div><Link href={`/careers/${activeMatch.career.slug}`} className={buttonVariants({})} data-testid="career-details-link" onClick={() => selectCareer(activeMatch.career.slug)}>View career &amp; build roadmap <ArrowUpRight size={16} /></Link></section>
    <p className="catalog-notice">{results.notice} · Catalog requirements are illustrative, curated demo content.</p>
  </>;
}
