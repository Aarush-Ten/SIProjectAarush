"use client";

import Link from "next/link";
import { QuizBadges } from "@/components/quiz-badges";
import { OptionalWording } from "@/components/optional-wording";
import { AlertTriangle, ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, CircleCheck, Clock3, ExternalLink, Flag, Laptop, ListChecks, LockKeyhole, RotateCcw, Smartphone } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useProfile } from "@/components/profile-provider";
import { SessionLoading } from "@/components/session-notice";
import { allTasks, roadmapProgress, validCompletedTaskIds } from "@/lib/session-storage";
import { formatScore, cn } from "@/lib/utils";

export function RoadmapView() {
  const { hydrated, profile, roadmap, completedTaskIds, toggleTask, storageAvailable } = useProfile();
  if (!hydrated) return <SessionLoading />;
  if (!profile || !roadmap) return <section className="empty-state"><span className="empty-icon"><ListChecks size={40} strokeWidth={1.4} /></span><p className="eyebrow">A SMALL STEP STARTS A PATH</p><h1>Your learning plan starts with a direction.</h1><p>{profile ? "Choose a career from your matches and create a roadmap. Your available hours, device, and budget will shape the plan." : "Add your starting point, compare career directions, and create a practical weekly plan."}</p><Link href={profile ? "/dashboard" : "/onboarding"} className={buttonVariants({})}>{profile ? "Compare my pathways" : "Find my pathway"} <ArrowRight size={18} /></Link></section>;

  const progress = roadmapProgress(roadmap, completedTaskIds);
  const completed = new Set(validCompletedTaskIds(roadmap, completedTaskIds));
  const tasksById = new Map(allTasks(roadmap).map((task) => [task.id, task]));
  const deviceLabels = { laptop: "Laptop / computer", shared_computer: "Shared computer", smartphone_only: "Smartphone only" };

  return <>
    <Link className="text-link back-link" href={`/careers/${roadmap.career_slug}`}><ArrowLeft size={16} /> Back to career details</Link>
    <header className="roadmap-heading"><div><p className="eyebrow"><span className="status-dot" /> ONE WEEK, ONE STEP AT A TIME</p><h1>Your direction.<br /><span>A plan to begin.</span></h1><p>A learning roadmap for <strong>{roadmap.career_title}</strong>, shaped around your starting point.</p></div><span className="source-pill"><ListChecks size={15} /> Built with deterministic rules</span></header>
    <div className="plan-summary-grid"><div><Clock3 size={19} /><strong>{roadmap.hours_per_week} hours / week</strong><span>{formatScore(roadmap.total_hours)} planned study hours</span></div><div><BookOpen size={19} /><strong>{roadmap.estimated_weeks} illustrative weeks</strong><span>Your pace can change</span></div><div>{profile.profile.device_access === "smartphone_only" ? <Smartphone size={19} /> : <Laptop size={19} />}<strong>{deviceLabels[profile.profile.device_access]}</strong><span>Practical limitations are flagged</span></div><div><span className="currency-icon" aria-hidden="true">₹</span><strong>₹{formatScore(roadmap.estimated_cost_inr)} resource fees</strong><span>Equipment and connectivity excluded</span></div></div>

    <section className="card progress-panel" aria-labelledby="progress-heading"><div className="progress-panel-heading"><div><p className="eyebrow">YOUR LEARNING PROGRESS</p><h2 id="progress-heading">Small steps add up.</h2></div><strong data-testid="roadmap-progress-percent">{formatScore(progress.percent)}<small>%</small></strong></div><div className="progress-track" role="progressbar" aria-label="Study hours completed" aria-valuemin={0} aria-valuemax={progress.totalHours} aria-valuenow={progress.completedHours}><span style={{ width: `${progress.percent}%` }} /></div><div className="progress-caption"><span><b data-testid="completed-task-count">{progress.completedTasks}</b> of {progress.totalTasks} tasks complete</span><span><b data-testid="completed-hours">{formatScore(progress.completedHours)}</b> of {formatScore(progress.totalHours)} study hours</span></div><p><LockKeyhole size={14} /> {storageAvailable ? "Saved on this browser. Refresh when you need to—you can pick up here." : "Kept in memory for this visit. Browser storage is unavailable; refresh may lose progress."}</p></section>

    {roadmap.warnings.length > 0 && <section className="plan-warnings" aria-label="Practical limitations"><h2><AlertTriangle size={20} /> Plan around these constraints</h2>{roadmap.warnings.map((warning) => <p key={warning}>{warning}</p>)}</section>}
    <div className="roadmap-section-heading"><div><p className="eyebrow">YOUR WEEKLY ROADMAP</p><h2>Start where you are.</h2></div><p>Prerequisites come first. Each week stays within {roadmap.hours_per_week} hours.</p></div>
    <div className="roadmap-weeks" data-testid="roadmap-weeks">{roadmap.weeks.map((week) => <section className="roadmap-week" key={week.week_number} aria-labelledby={`week-${week.week_number}-heading`} data-testid={`roadmap-week-${week.week_number}`}><div className="week-heading"><span className="week-number">{String(week.week_number).padStart(2, "0")}</span><div><h2 id={`week-${week.week_number}-heading`}>Week {week.week_number}</h2><p>{week.tasks.length} {week.tasks.length === 1 ? "task" : "tasks"} · <span data-testid="week-hours">{formatScore(week.total_hours)}</span> of {roadmap.hours_per_week} available hours</p></div><span className="week-completion">{week.tasks.filter((task) => completed.has(task.id)).length}/{week.tasks.length} done</span></div><div className="week-tasks">{week.tasks.map((task) => {
      const done = completed.has(task.id);
      const missingPrerequisites = task.prerequisite_task_ids.filter((id) => !completed.has(id));
      const blocked = !done && missingPrerequisites.length > 0;
      return <article className={cn("card roadmap-task", done && "task-completed")} key={task.id} data-testid="roadmap-task" data-task-id={task.id} aria-label={task.title}>
        <div className="task-heading"><span className={cn("task-type", task.mode === "milestone" && "milestone-type")}>{task.mode === "milestone" ? <Flag size={14} /> : task.mode === "theory" ? <BookOpen size={14} /> : <Laptop size={14} />}{task.mode === "milestone" ? "Mini-project milestone" : task.mode === "theory" ? "Theory / preparation" : "Practical activity"}</span><span className="task-duration"><Clock3 size={14} /><b data-testid="task-hours">{formatScore(task.estimated_hours)}</b> hr{task.estimated_hours === 1 ? "" : "s"}</span></div>
        <h3>{done && <CircleCheck size={20} aria-label="Completed" />}{task.title}</h3><p className="task-skill">{task.skill_label} · {task.importance === "prerequisite" ? "Foundation prerequisite" : task.importance === "milestone" ? "Manual verification" : `${task.importance[0].toUpperCase()}${task.importance.slice(1)} skill`}{task.total_parts > 1 && <> · Part {task.part} of {task.total_parts}</>}</p><p className="task-description">{task.description}</p>
        <dl className="task-instructions"><div><dt>Try this activity</dt><dd>{task.activity}</dd></div><div><dt>Check your work</dt><dd>{task.verification}</dd></div></dl>
        <div className="task-device"><Laptop size={15} /><p>{task.device_note}</p></div>{task.alternative && <p className="task-alternative"><strong>Alternative / next access step:</strong> {task.alternative}</p>}
        {task.resource ? <div className="task-resource"><BookOpen size={19} /><div><span>{task.resource.provider} · {task.resource.is_free ? "Free public material" : task.resource.cost_inr === null ? "Price unconfirmed" : `₹${formatScore(task.resource.cost_inr)}`}</span><a href={task.resource.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">{task.resource.title} <ExternalLink size={14} aria-label="Opens in a new tab" /></a><p>Checked {task.resource.last_checked ?? "date not recorded"}. Task hours are our study estimate, not the full resource duration.</p></div></div> : <p className="no-resource">{task.mode === "milestone" ? "Use the manual activity and checklist above; no external resource is required for this milestone." : "No eligible catalog resource was found. Use the independent activity above; no resource link has been invented."}</p>}
        {blocked && <p className="task-prerequisites"><LockKeyhole size={14} /><span>Complete the earlier prerequisite {missingPrerequisites.length === 1 ? "task" : "tasks"} first: {[...new Set(missingPrerequisites.map((id) => tasksById.get(id)?.skill_label ?? "earlier activity"))].join(", ")}.</span></p>}
        <div className="task-footer"><Button variant={done ? "secondary" : "default"} disabled={blocked} onClick={() => toggleTask(task.id)} aria-pressed={done}>{done ? <><RotateCcw size={16} /> Reopen task</> : <><Check size={16} /> Mark done</>}</Button><span>{done ? "Completion saved locally" : blocked ? "Follow the prerequisite order" : "Self-reported completion"}</span></div>
      </article>;
    })}</div></section>)}</div>
    <details className="formula-details plan-assumptions"><summary><span><ListChecks size={20} /> Assumptions behind your plan</span><ChevronDown size={20} /></summary><div className="formula-content"><ul>{roadmap.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}</ul></div></details>
    <section className="roadmap-footnote"><Check size={20} /><p>Completion records what you report doing. It does not raise your skill levels, change exploration scores, or prove job readiness. Reopening a prerequisite also reopens dependent completed tasks.</p></section>
    <Link href="/dashboard" className="text-link"><ArrowLeft size={16} /> Back to my pathways</Link>
  <QuizBadges /><OptionalWording slug={roadmap.career_slug} /></>;
}
