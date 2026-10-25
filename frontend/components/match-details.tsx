import { Check, ChevronDown, ShieldCheck } from "lucide-react";
import type { CareerMatch, MatchesResponse, SkillGap } from "@/lib/types/api";
import { formatScore } from "@/lib/utils";

export function SkillGapTable({ gaps }: { gaps: SkillGap[] }) {
  if (!gaps.length) return <p className="complete-skills"><Check size={18} /> Your self-reported levels cover these curated requirements.</p>;
  return <div className="gap-table"><div className="gap-table-heading" aria-hidden="true"><span>Skill</span><span>Your level</span><span>Required</span><span>Gap</span></div>{gaps.map((gap) => <div className="gap-row" key={gap.skill_id} data-testid={`gap-${gap.skill_id}`}><strong>{gap.label}</strong><span><span className="sr-only">Your level </span><b data-testid="gap-user-level">{gap.user_level}</b><small> / 3</small></span><span><span className="sr-only">Required level </span><b data-testid="gap-required-level">{gap.required_level}</b><small> / 3</small></span><span className="gap-value"><span className="sr-only">Missing levels </span>+<b data-testid="gap-missing-level">{gap.missing_level}</b></span></div>)}</div>;
}

export function FormulaDetails({ formula }: { formula: MatchesResponse["formula"] }) {
  return <details className="formula-details"><summary><span><ShieldCheck size={20} /> How this match was calculated</span><ChevronDown size={20} /></summary><div className="formula-content"><p>Every score comes directly from deterministic backend rules. No language model selects or ranks your career paths.</p><div className="formula-line">Exploration fit = <strong>{formatScore(formula.coverage_weight * 100)}% skill coverage</strong> + <strong>{formatScore(formula.interest_weight * 100)}% interest alignment</strong> + <strong>{formatScore(formula.feasibility_weight * 100)}% feasibility</strong></div><div className="formula-grid"><div><h3>Essential skill coverage</h3><p>100 × Σ(weight × min(your level ÷ required level, 1)) ÷ Σ(weight). Missing skills count as 0; optional skills do not reduce this measure, and coverage cannot exceed 100%.</p></div><div><h3>Interest alignment</h3><p>The share of a career’s interest tags that overlap your interests. If none are selected, alignment is a neutral 50, marked unknown.</p></div><div><h3>Practical feasibility</h3><p>Schedule contributes 40%, device 40%, and budget 20%. This highlights constraints to plan around; it does not establish eligibility.</p></div></div><details className="rule-details"><summary>View the feasibility rule table <ChevronDown size={15} /></summary><div className="rule-table"><div><strong>Schedule</strong><p>At or above suggested weekly hours: 100. At least half: 75. Below half: 50.</p></div><div><strong>Device</strong><p>Suitable device or laptop: 100. Shared computer when a computer is needed: 75. Smartphone only for that career: 25.</p></div><div><strong>Budget</strong><p>Meets the illustrative practice budget: 100. Below that assumption: 50. These are not course prices.</p></div></div></details><p className="formula-limit">Weights are an initial hypothesis for future review. Rankings use full precision; the API rounds displayed scores to two decimal places. Scores are not employment probabilities.</p></div></details>;
}

export function MatchScores({ match }: { match: CareerMatch }) {
  return <dl className="detail-score-grid">{[
    ["Exploration fit", match.fit_score, "fit-score"],
    ["Self-reported skill coverage", match.coverage, "coverage-score"],
    [match.interest_status === "unknown" ? "Interest alignment · unknown" : "Interest alignment", match.interest_match, "interest-score"],
    ["Practical feasibility", match.feasibility.score, "feasibility-score"],
  ].map(([label, value, id]) => <div key={id}><dt>{label}</dt><dd data-testid={id}>{formatScore(Number(value))}<small> / 100</small></dd></div>)}</dl>;
}
