"""Pure study planning from curated rules; no I/O, profile storage, or AI calls."""

import json
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from decimal import Decimal
from hashlib import sha256

from app.schemas.api import CareerOutput, SkillOutput
from app.schemas.roadmap import (
    LearningResourceOutput,
    RoadmapRequest,
    RoadmapResponse,
    RoadmapTask,
    RoadmapWeek,
)
from app.services import matching

HOURS_PER_LEVEL = 2
MILESTONE_HOURS = 1
Prerequisites = Mapping[str, tuple[tuple[str, int], ...]]

# Minimum prerequisite levels are illustrative learning-order assumptions.
# They are not additional employment requirements and do not alter match scores.
PREREQUISITES: Prerequisites = {
    "css": (("html", 1),),
    "javascript": (("html", 1),),
    "security_basics": (("networking", 1),),
    "incident_response": (("networking", 1), ("linux", 1), ("security_basics", 1)),
    "testing": (("troubleshooting", 1),),
    "test_automation": (("testing", 1), ("python", 1)),
    "statistics": (("spreadsheets", 1),),
    "data_visualization": (("spreadsheets", 1), ("statistics", 1)),
    "prototyping": (("user_research", 1), ("visual_design", 1)),
    "accessibility": (("html", 1),),
    "seo": (("html", 1), ("content_writing", 1)),
    "analytics": (("spreadsheets", 1),),
    "cad": (("technical_drawing", 1), ("measurement", 1)),
    "technical_drawing": (("measurement", 1),),
    "electrical_basics": (("safety", 1),),
    "solar_systems": (("electrical_basics", 1), ("safety", 1)),
    "installation": (("safety", 2), ("electrical_basics", 1), ("measurement", 1)),
    "inventory": (("spreadsheets", 1),),
    "logistics": (("inventory", 1), ("communication", 1)),
}
PHYSICAL_SKILLS = {"solar_systems", "electrical_basics", "installation", "measurement", "safety"}
COMPUTER_SKILLS = {
    "python",
    "html",
    "css",
    "javascript",
    "sql",
    "networking",
    "linux",
    "git",
    "incident_response",
    "troubleshooting",
    "hardware_basics",
    "testing",
    "test_automation",
    "spreadsheets",
    "data_visualization",
    "prototyping",
    "accessibility",
    "analytics",
    "cad",
    "inventory",
    "logistics",
    "office_tools",
}
ACTIVITIES = {
    "python": "Write a small local program using sample inputs and explain its output.",
    "html": "Build a small semantic HTML page with headings, a list, and labeled controls.",
    "css": "Style the sample page and check it at a narrow and a wide viewport.",
    "javascript": "Add a small interaction to a local page and check a valid and invalid input.",
    "sql": "Query a small fictional table and explain how filtering changes the result.",
    "networking": "Draw a fictional network and trace how a browser reaches a named website.",
    "linux": "Use a local practice directory to demonstrate files, paths, and permissions.",
    "security_basics": "Write a threat-and-mitigation checklist for a fictional student device.",
    "incident_response": (
        "Triage a fictional alert and write observations, uncertainty, and escalation notes."
    ),
    "git": "Track a small sample folder through a change and explain its revision history.",
    "troubleshooting": (
        "Document a fictional fault, two hypotheses, checks, and a reasoned conclusion."
    ),
    "communication": (
        "Write a concise status update and a respectful clarification question for a sample "
        "scenario."
    ),
    "hardware_basics": (
        "Label a computer-component diagram; do not open powered or unfamiliar equipment."
    ),
    "testing": (
        "Write a small test checklist and a reproducible defect report for a sample interface."
    ),
    "test_automation": (
        "Automate a repeatable check on a small local example and explain a failure."
    ),
    "spreadsheets": (
        "Create a fictional expense or stock table, apply formulas, and check two results manually."
    ),
    "data_visualization": (
        "Chart a small fictional dataset and write a conclusion plus one limitation."
    ),
    "statistics": (
        "Calculate a mean and range for a tiny sample and explain why it is not representative."
    ),
    "user_research": (
        "Draft neutral interview questions and label assumptions without inventing interview "
        "results."
    ),
    "visual_design": (
        "Sketch an interface using consistent spacing, readable type, and a clear hierarchy."
    ),
    "prototyping": (
        "Create a short interactive sample flow and record where a user could get stuck."
    ),
    "accessibility": "Check a sample page's headings, labels, contrast, and keyboard path.",
    "content_writing": (
        "Draft a short audience-specific message and revise it for clarity and accuracy."
    ),
    "seo": (
        "Review a fictional page's title, headings, and description without making ranking "
        "promises."
    ),
    "analytics": (
        "Summarize a fictional campaign table and distinguish observations from assumptions."
    ),
    "social_media": (
        "Draft a responsible sample content calendar and a response to a fictional question."
    ),
    "cad": "Produce a small non-safety-critical practice drawing and check its dimensions.",
    "technical_drawing": "Interpret dimensions on a sample drawing and annotate uncertainties.",
    "inventory": "Reconcile a fictional stock table and explain a discrepancy.",
    "logistics": "Prepare a sample dispatch schedule and explain a delay-handling decision.",
    "office_tools": "Prepare a short sample document, schedule, and organized records checklist.",
}


@dataclass(frozen=True)
class _Target:
    skill_id: str
    level: int
    importance: str


@dataclass(frozen=True)
class _Block:
    key: str
    skill_id: str
    label: str
    hours: float
    importance: str
    title: str
    description: str
    activity: str
    verification: str
    resource: LearningResourceOutput | None
    mode: str
    device_requirement: str
    device_note: str
    alternative: str | None
    dependency_keys: tuple[str, ...]


def _validate_prerequisites(prerequisites: Prerequisites, known: set[str]) -> None:
    visiting: set[str] = set()
    visited: set[str] = set()

    def visit(skill_id: str) -> None:
        if skill_id not in known:
            raise ValueError("Prerequisite definitions must use catalog skill IDs")
        if skill_id in visiting:
            raise ValueError("Cyclic skill prerequisites are not allowed")
        if skill_id in visited:
            return
        visiting.add(skill_id)
        for dependency, level in prerequisites.get(skill_id, ()):
            if isinstance(level, bool) or level not in {1, 2, 3}:
                raise ValueError("Prerequisite levels must be between 1 and 3")
            visit(dependency)
        visiting.remove(skill_id)
        visited.add(skill_id)

    for skill_id in sorted(prerequisites):
        visit(skill_id)


def _ordered_targets(
    requirements: Sequence[tuple[str, int]],
    levels: dict[str, int],
    importance: str,
    prerequisites: Prerequisites,
) -> list[_Target]:
    desired: dict[str, int] = {}
    requested = {skill_id for skill_id, _level in requirements}

    def include(skill_id: str, level: int) -> None:
        if levels.get(skill_id, 0) >= level or desired.get(skill_id, 0) >= level:
            return
        desired[skill_id] = level
        for dependency, minimum in prerequisites.get(skill_id, ()):
            include(dependency, minimum)

    for skill_id, level in requirements:
        include(skill_id, level)
    ordered: list[_Target] = []
    seen: set[str] = set()

    def visit(skill_id: str) -> None:
        if skill_id in seen or skill_id not in desired:
            return
        for dependency, _minimum in sorted(prerequisites.get(skill_id, ())):
            visit(dependency)
        seen.add(skill_id)
        ordered.append(
            _Target(
                skill_id, desired[skill_id], importance if skill_id in requested else "prerequisite"
            )
        )

    for skill_id, _level in requirements:
        visit(skill_id)
    return ordered


def select_resource(
    skill_id: str,
    resources: Sequence[LearningResourceOutput],
    phone_only: bool,
    remaining_budget: Decimal,
    paid_resource_ids: set[str],
) -> LearningResourceOutput | None:
    """Free first; reuse is charged once and unknown paid fees are never assumed free."""
    candidates = []
    for resource in resources:
        if skill_id not in resource.skill_ids:
            continue
        if phone_only and resource.device_requirement == "computer":
            continue
        if not resource.is_free and resource.cost_inr is None:
            continue
        fee = Decimal("0") if resource.is_free else Decimal(str(resource.cost_inr))
        additional = Decimal("0") if resource.id in paid_resource_ids else fee
        if additional <= remaining_budget:
            candidates.append(
                (not resource.is_free, additional, resource.estimated_hours, resource.id, resource)
            )
    return min(candidates, key=lambda candidate: candidate[:4])[-1] if candidates else None


def _study_block(
    key: str,
    target: _Target,
    label: str,
    before: int,
    resource: LearningResourceOutput | None,
    phone: bool,
    dependencies: tuple[str, ...],
) -> _Block:
    physical = target.skill_id in PHYSICAL_SKILLS
    computer = target.skill_id in COMPUTER_SKILLS
    alternative = None
    if physical:
        mode, device = "theory", "any"
        activity = (
            f"Read introductory {label.lower()} material and annotate a fictional diagram or "
            "risk checklist. Do not perform physical installation, wiring, or equipment work."
        )
        device_note = (
            "Theory only: practical work needs qualified supervision and safe equipment/site "
            "access."
        )
        alternative = (
            "Use a written case study now; arrange qualified supervised training before "
            "practical work."
        )
    elif phone and computer:
        mode, device = "theory", "any"
        activity = (
            f"Read about {label.lower()} and write a step-by-step walkthrough for a fictional "
            "example using notes or a paper sketch. Label steps that still need computer practice."
        )
        device_note = (
            "Phone-friendly theory alternative; this does not complete computer-based "
            "practical work."
        )
        alternative = (
            "Revisit this activity on a suitable computer to create and check a practical artifact."
        )
    else:
        mode, device = "practical", "computer" if computer else "any"
        activity = ACTIVITIES.get(
            target.skill_id, f"Create an annotated fictional example of {label.lower()}."
        )
        device_note = (
            "Use suitable computer access for this local practice exercise."
            if computer
            else "A written or sketched example can be prepared with your available device."
        )
    return _Block(
        key=key,
        skill_id=target.skill_id,
        label=label,
        hours=(target.level - before) * HOURS_PER_LEVEL,
        importance=target.importance,
        title=("Theory alternative: " if alternative else "Practise: ") + label,
        description=(
            f"Study toward level {target.level} from reported/planned level {before}. "
            "Allocated hours are illustrative and do not certify a skill level. "
            + (
                "Use the linked reference selectively; this is not its full course duration."
                if resource
                else "No suitable catalog resource was found; use an independent activity."
            )
        ),
        activity=activity,
        verification=(
            "Save your notes or artifact and explain one decision, one limitation, and the next "
            "practical check to a peer, trainer, or yourself. Completion is self-reported."
        ),
        resource=resource,
        mode=mode,
        device_requirement=device,
        device_note=device_note,
        alternative=alternative,
        dependency_keys=dependencies,
    )


def _milestone(career: CareerOutput, phone: bool, dependencies: tuple[str, ...]) -> _Block:
    physical = bool(
        PHYSICAL_SKILLS.intersection(
            skill.skill_id for skill in career.skills if skill.importance == "essential"
        )
    )
    written = phone or physical
    return _Block(
        key="core-milestone",
        skill_id=next(skill.skill_id for skill in career.skills if skill.importance == "essential"),
        label="Career mini-project",
        hours=MILESTONE_HOURS,
        importance="milestone",
        title="Mini-project: explain a realistic case",
        description=(
            "Review your essential study in one small manual-verification milestone; no quiz "
            "or readiness badge is awarded."
        ),
        activity=(
            f"Create a written case brief for {career.title}: describe a fictional task, your "
            "proposed approach, an example output, and the checks you would perform."
            if written
            else f"Combine your essential study into a small local {career.title} example. "
            "Save an artifact and describe its purpose, checks, and limitations."
        ),
        verification=(
            "Use a checklist to explain your result and one unresolved gap; record what "
            "further practice or trainer feedback is needed."
        ),
        resource=None,
        mode="milestone",
        device_requirement="any" if written else career.device_requirement,
        device_note=(
            (
                "Written preparation only; practical competence still needs suitable "
                "equipment and qualified supervision."
            )
            if physical
            else "Written preparation does not replace computer practicals."
            if phone and career.device_requirement == "computer"
            else career.device_note
        ),
        alternative=(
            "Complete a written case now and revisit practical work when access is available."
            if written
            else None
        ),
        dependency_keys=dependencies,
    )


def _pack_weeks(blocks: list[_Block], plan_id: str, weekly_hours: int) -> list[RoadmapWeek]:
    weeks: list[RoadmapWeek] = []
    tasks: list[RoadmapTask] = []
    used = 0.0
    last_part_ids: dict[str, str] = {}
    for block in blocks:
        remaining = block.hours
        portions: list[float] = []
        capacity = weekly_hours - used
        while remaining:
            if not capacity:
                capacity = weekly_hours
            hours = min(remaining, capacity)
            portions.append(hours)
            remaining -= hours
            capacity -= hours
        prior_id = None
        for part, hours in enumerate(portions, start=1):
            if used == weekly_hours:
                weeks.append(RoadmapWeek(week_number=len(weeks) + 1, total_hours=used, tasks=tasks))
                used, tasks = 0.0, []
            dependencies = [
                last_part_ids[key] for key in block.dependency_keys if key in last_part_ids
            ]
            if prior_id:
                dependencies.append(prior_id)
            task_id = f"{plan_id}-{block.key}-{part}"
            tasks.append(
                RoadmapTask(
                    id=task_id,
                    skill_id=block.skill_id,
                    skill_label=block.label,
                    title=block.title
                    + (f" (part {part}/{len(portions)})" if len(portions) > 1 else ""),
                    description=block.description,
                    activity=block.activity,
                    verification=block.verification,
                    estimated_hours=hours,
                    resource=block.resource,
                    mode=block.mode,
                    device_requirement=block.device_requirement,
                    device_note=block.device_note,
                    alternative=block.alternative,
                    prerequisite_task_ids=list(dict.fromkeys(dependencies)),
                    part=part,
                    total_parts=len(portions),
                    importance=block.importance,
                )
            )
            used += hours
            prior_id = task_id
        last_part_ids[block.key] = prior_id
    if tasks:
        weeks.append(RoadmapWeek(week_number=len(weeks) + 1, total_hours=used, tasks=tasks))
    return weeks


def generate_roadmap(
    career: CareerOutput,
    request: RoadmapRequest,
    resources: Sequence[LearningResourceOutput],
    skills: Sequence[SkillOutput],
    prerequisites: Prerequisites = PREREQUISITES,
) -> RoadmapResponse:
    """Build a deterministic introductory plan from validated catalog data and a profile."""
    if request.career_slug != career.slug:
        raise ValueError("Roadmap request and career must refer to the same career")
    labels = {skill.id: skill.label_en for skill in skills}
    _validate_prerequisites(prerequisites, set(labels))
    phone = request.profile.device_access == "smartphone_only"
    levels = {skill.skill_id: skill.self_reported_level for skill in request.skills}
    planned_levels = dict(levels)
    score = matching.score_career(career, request)
    selected_match = score.model_copy(
        update={
            "coverage": round(score.coverage, 2),
            "interest_match": round(score.interest_match, 2),
            "fit_score": round(score.fit_score, 2),
        }
    )
    warnings = list(score.feasibility.warnings)
    blocks: list[_Block] = []
    skill_block_keys: dict[str, str] = {}
    paid_ids: set[str] = set()
    spent = Decimal("0")
    budget = Decimal(str(request.profile.budget_inr))
    for stage in ["essential", "optional"]:
        requirements = [
            (skill.skill_id, skill.required_level)
            for skill in sorted(career.skills, key=lambda skill: (-skill.weight, skill.skill_id))
            if skill.importance == stage
        ]
        targets = _ordered_targets(requirements, planned_levels, stage, prerequisites)
        for target in targets:
            if target.skill_id not in labels:
                raise ValueError("Career requirements must use catalog skill IDs")
            resource = select_resource(target.skill_id, resources, phone, budget - spent, paid_ids)
            if resource is None:
                warnings.append(
                    f"No compatible resource within budget for {labels[target.skill_id]}; "
                    "an independent activity is provided without a link."
                )
            elif not resource.is_free and resource.id not in paid_ids:
                spent += Decimal(str(resource.cost_inr))
                paid_ids.add(resource.id)
            dependencies = [
                skill_block_keys[dependency]
                for dependency, _level in prerequisites.get(target.skill_id, ())
                if dependency in skill_block_keys
            ]
            if target.skill_id in skill_block_keys:
                dependencies.append(skill_block_keys[target.skill_id])
            key = f"{stage}-{target.skill_id}"
            blocks.append(
                _study_block(
                    key,
                    target,
                    labels[target.skill_id],
                    planned_levels.get(target.skill_id, 0),
                    resource,
                    phone,
                    tuple(dict.fromkeys(dependencies)),
                )
            )
            skill_block_keys[target.skill_id] = key
            planned_levels[target.skill_id] = target.level
        if stage == "essential":
            blocks.append(_milestone(career, phone, tuple(skill_block_keys.values())))
    if phone:
        warnings.append(
            "This phone-accessible plan supports introductory preparation. Computer-based"
            " practical skills still require suitable computer access."
        )
    if PHYSICAL_SKILLS.intersection(skill.skill_id for skill in career.skills):
        warnings.append(
            "Physical and electrical work is not assigned for unsupervised practice; "
            "arrange qualified supervision and safe equipment/site access."
        )
    identity_request = request.model_dump(mode="json")
    identity_request["skills"] = sorted(
        identity_request["skills"], key=lambda skill: skill["skill_id"]
    )
    identity_request["interests"] = sorted(identity_request["interests"])
    identity = {
        "rules_version": 1,
        "request": identity_request,
        "career": career.model_dump(mode="json"),
        "resources": sorted(
            [resource.model_dump(mode="json") for resource in resources],
            key=lambda resource: resource["id"],
        ),
        "prerequisites": prerequisites,
        "hours_per_level": HOURS_PER_LEVEL,
        "milestone_hours": MILESTONE_HOURS,
        "formula": matching.FORMULA.model_dump(),
    }
    plan_id = "roadmap-" + sha256(json.dumps(identity, sort_keys=True).encode()).hexdigest()[:16]
    weeks = _pack_weeks(blocks, plan_id, request.profile.hours_per_week)
    return RoadmapResponse(
        id=plan_id,
        career_slug=career.slug,
        career_title=career.title,
        selected_match=selected_match,
        formula=matching.FORMULA.model_copy(),
        hours_per_week=request.profile.hours_per_week,
        total_hours=sum(week.total_hours for week in weeks),
        estimated_weeks=len(weeks),
        estimated_cost_inr=float(spent),
        weeks=weeks,
        warnings=list(dict.fromkeys(warnings)),
        assumptions=[
            f"{request.profile.hours_per_week} hours per week, "
            "based on self-reported skill levels.",
            (
                "Two illustrative study hours per missing level plus a one-hour manual "
                "verification milestone; these are not provider course durations or proof of "
                "proficiency."
            ),
            (
                "Essential skills and minimum-level prerequisites come first; optional "
                "additions follow the core milestone."
            ),
            (
                "Free-first references; resource fees count once. Estimates exclude devices, "
                "data, tools, travel, certification and supervised training costs."
            ),
            (
                "Tasks and completion are advisory and self-reported; completing a plan does "
                "not establish job readiness or automatically change skill levels."
            ),
        ],
    )
