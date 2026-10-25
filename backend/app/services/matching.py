"""Pure deterministic rules. No I/O, LLM calls, persistence, or demographic scoring."""

from app.schemas.api import (
    CareerMatch,
    CareerOutput,
    FeasibilityComponent,
    FeasibilityOutput,
    GapOutput,
    MatchFormula,
    MatchRequest,
    MatchResponse,
    ProfileSnapshot,
)

FORMULA = MatchFormula()
NOTICE = (
    "Illustrative career exploration only. Coverage reflects self-reported skills, "
    "not verified competence or an employment probability. Catalog requirements, "
    "time and practice budgets are curated demo assumptions."
)


def skill_coverage(career: CareerOutput, levels: dict[str, int]) -> float:
    essentials = [skill for skill in career.skills if skill.importance == "essential"]
    total_weight = sum(skill.weight for skill in essentials)
    return (
        100
        * sum(
            skill.weight * min(levels.get(skill.skill_id, 0) / skill.required_level, 1)
            for skill in essentials
        )
        / total_weight
    )


def skill_gaps(career: CareerOutput, levels: dict[str, int]) -> list[GapOutput]:
    return [
        GapOutput(
            skill_id=skill.skill_id,
            label=skill.label,
            user_level=levels.get(skill.skill_id, 0),
            required_level=skill.required_level,
            missing_level=skill.required_level - levels.get(skill.skill_id, 0),
            importance=skill.importance,
        )
        for skill in sorted(
            career.skills, key=lambda skill: (skill.importance != "essential", skill.skill_id)
        )
        if levels.get(skill.skill_id, 0) < skill.required_level
    ]


def constraint_feasibility(
    career: CareerOutput,
    profile: ProfileSnapshot,
) -> FeasibilityOutput:
    """Schedule 40%, device 40%, budget 20%; catalog values are demo assumptions.

    Schedule: >= recommended 100, >= half recommended 75, otherwise 50.
    Device: any requirement or laptop 100; shared computer 75; phone/computer mismatch 25.
    Budget: meets illustrative practice equipment budget 100; otherwise 50.
    No education, language, study-field or other demographic field affects scoring.
    """
    hours = profile.hours_per_week
    recommended = career.recommended_hours_per_week
    schedule = 100 if hours >= recommended else (75 if hours >= recommended / 2 else 50)
    device = (
        100
        if career.device_requirement == "any" or profile.device_access == "laptop"
        else (75 if profile.device_access == "shared_computer" else 25)
    )
    budget = 100 if profile.budget_inr >= career.practice_budget_inr else 50
    components = [
        FeasibilityComponent(
            factor="schedule",
            score=schedule,
            weight=0.4,
            reason=(
                f"{hours} hours/week compared with an illustrative "
                f"{recommended}-hour practice target."
            ),
        ),
        FeasibilityComponent(
            factor="device",
            score=device,
            weight=0.4,
            reason=(
                "Phone access supports introductory theory for this pathway. "
                if career.device_requirement == "any"
                else ""
            )
            + career.device_note,
        ),
        FeasibilityComponent(
            factor="budget",
            score=budget,
            weight=0.2,
            reason=(
                f"INR {profile.budget_inr:g} available against an illustrative "
                f"INR {career.practice_budget_inr} practice budget; actual costs vary."
            ),
        ),
    ]
    warnings = []
    if hours < recommended:
        warnings.append("Your available time may mean a slower learning pace.")
    if career.device_requirement == "computer" and profile.device_access == "smartphone_only":
        warnings.append("A computer is required for practical exercises; a phone is insufficient.")
    if career.device_requirement == "computer" and profile.device_access == "shared_computer":
        warnings.append("Arrange reliable shared computer access for practical exercises.")
    if career.practice_budget_inr > 0:
        warnings.append(career.device_note)
    if budget < 100:
        warnings.append("The illustrative practice budget exceeds your budget; check lab access.")
    return FeasibilityOutput(
        score=sum(component.score * component.weight for component in components),
        components=components,
        warnings=warnings,
    )


def score_career(career: CareerOutput, request: MatchRequest) -> CareerMatch:
    """Return full precision scores; round only when preparing an API response."""
    levels = {skill.skill_id: skill.self_reported_level for skill in request.skills}
    coverage = skill_coverage(career, levels)
    intersection = set(career.interest_tags).intersection(request.interests)
    interest = 100 * len(intersection) / len(career.interest_tags) if request.interests else 50
    feasibility = constraint_feasibility(career, request.profile)
    fit = (
        FORMULA.coverage_weight * coverage
        + FORMULA.interest_weight * interest
        + FORMULA.feasibility_weight * feasibility.score
    )
    gaps = skill_gaps(career, levels)
    essential_gaps = sum(gap.importance == "essential" for gap in gaps)
    return CareerMatch(
        career=career,
        coverage=coverage,
        interest_match=interest,
        interest_status="matched" if request.interests else "unknown",
        feasibility=feasibility,
        fit_score=fit,
        missing_skills=gaps,
        reasons=[
            f"Self-reported skills cover {coverage:.2f}% of weighted essential requirements.",
            (
                f"{len(intersection)} of {len(career.interest_tags)} interest tags overlap."
                if request.interests
                else "No interests supplied: neutral 50% alignment, marked unknown."
            ),
            f"{essential_gaps} essential skills have a remaining level gap.",
            "Feasibility combines schedule (40%), device (40%) and practice budget (20%).",
        ],
    )


def rank_careers(careers: list[CareerOutput], request: MatchRequest) -> MatchResponse:
    ranked = sorted(
        [score_career(career, request) for career in careers],
        key=lambda result: (-result.fit_score, -result.coverage, result.career.slug),
    )
    matches = [
        match.model_copy(
            update={
                "coverage": round(match.coverage, 2),
                "interest_match": round(match.interest_match, 2),
                "fit_score": round(match.fit_score, 2),
            }
        )
        for match in ranked[:3]
    ]
    return MatchResponse(
        matches=matches,
        total_careers_evaluated=len(careers),
        formula=FORMULA.model_copy(),
        notice=NOTICE,
    )
