from copy import deepcopy

import pytest

from app.schemas.api import CareerOutput, MatchFormula, MatchRequest
from app.seed.catalog import CAREERS, SKILLS
from app.services import matching
from app.services.matching import (
    constraint_feasibility,
    rank_careers,
    score_career,
    skill_coverage,
    skill_gaps,
)

SOC = CAREERS[0]


def test_demo_top_three_and_hand_calculated_soc(demo_request):
    result = rank_careers(CAREERS, demo_request)
    assert [match.career.slug for match in result.matches] == [
        "soc-analyst",
        "frontend-developer",
        "data-analyst",
    ]
    soc = result.matches[0]
    # Python contributes weight 3 out of 21; all other essential skills are missing.
    assert soc.coverage == 14.29
    assert soc.interest_match == 100
    assert soc.feasibility.score == 90
    assert soc.fit_score == 47.07
    assert result.total_careers_evaluated == 12
    assert result.formula.coverage_weight == 0.6
    assert result.formula.interest_weight == 0.25
    assert result.formula.feasibility_weight == 0.15


def test_configured_weights_are_disclosed_and_response_cannot_mutate_them(
    demo_request,
    monkeypatch,
):
    configured = MatchFormula(
        coverage_weight=0.5,
        interest_weight=0.3,
        feasibility_weight=0.2,
    )
    monkeypatch.setattr(matching, "FORMULA", configured)
    result = rank_careers(CAREERS, demo_request)
    assert result.formula == configured
    assert result.formula is not configured
    assert result.matches[0].career.slug == "soc-analyst"
    # Independently calculated SOC score under the configured 50/30/20 weights.
    assert result.matches[0].fit_score == round(0.5 * (100 * 3 / 21) + 0.3 * 100 + 0.2 * 90, 2)
    for match in result.matches:
        disclosed_fit = (
            result.formula.coverage_weight * match.coverage
            + result.formula.interest_weight * match.interest_match
            + result.formula.feasibility_weight * match.feasibility.score
        )
        # Component and fit values are independently rounded to two decimal places.
        assert match.fit_score == pytest.approx(disclosed_fit, abs=0.01)
    result.formula.coverage_weight = 0
    assert configured.coverage_weight == 0.5
    assert rank_careers(CAREERS, demo_request).formula == configured


def test_demo_soc_exact_gaps_with_missing_levels_zero(demo_request):
    result = score_career(SOC, demo_request)
    actual = {
        gap.skill_id: (gap.user_level, gap.required_level, gap.missing_level)
        for gap in result.missing_skills
        if gap.importance == "essential"
    }
    assert actual == {
        "incident_response": (0, 1, 1),
        "linux": (0, 2, 2),
        "networking": (0, 2, 2),
        "security_basics": (0, 2, 2),
    }
    assert "sql" not in {gap.skill_id for gap in result.missing_skills}


def test_optional_missing_never_reduces_coverage():
    levels = {
        skill.skill_id: skill.required_level
        for skill in SOC.skills
        if skill.importance == "essential"
    }
    assert skill_coverage(SOC, levels) == 100
    assert all(gap.importance == "optional" for gap in skill_gaps(SOC, levels))
    levels.update({skill.skill_id: 3 for skill in SOC.skills})
    assert skill_coverage(SOC, levels) == 100
    assert skill_gaps(SOC, levels) == []


def test_partial_levels_are_weighted_and_bounded():
    # Python is 3*(1/2), networking is 5*(1/2); denominator is 21.
    assert skill_coverage(SOC, {"python": 1, "networking": 1}) == pytest.approx(100 * 4 / 21)
    assert skill_coverage(SOC, {}) == 0


@pytest.mark.parametrize("hours,score", [(1, 50), (3, 50), (4, 75), (7, 75), (8, 100), (30, 100)])
def test_schedule_rule_boundaries(demo_request, hours, score):
    profile = demo_request.profile.model_copy(update={"hours_per_week": hours})
    result = constraint_feasibility(SOC, profile)
    assert result.components[0].score == score
    assert result.score == 0.4 * score + 60


@pytest.mark.parametrize(
    "device,score",
    [
        ("laptop", 100),
        ("shared_computer", 75),
        ("smartphone_only", 25),
    ],
)
def test_device_rules_and_phone_warning(demo_request, device, score):
    profile = demo_request.profile.model_copy(update={"device_access": device})
    result = constraint_feasibility(SOC, profile)
    assert result.components[1].score == score
    if device == "smartphone_only":
        assert any("phone is insufficient" in warning for warning in result.warnings)


@pytest.mark.parametrize("budget,score", [(0, 50), (499.99, 50), (500, 100), (1000, 100)])
def test_vocational_budget_rules_and_supervision_warning(demo_request, budget, score):
    solar = next(career for career in CAREERS if career.slug == "solar-pv-technician")
    profile = demo_request.profile.model_copy(
        update={
            "budget_inr": budget,
            "device_access": "smartphone_only",
        }
    )
    result = constraint_feasibility(solar, profile)
    assert result.components[2].score == score
    assert result.components[1].score == 100
    assert any("supervised" in warning for warning in result.warnings)


def test_neutral_interest_unknown_and_partial_overlap(demo_payload):
    demo_payload["interests"] = []
    unknown = score_career(SOC, MatchRequest.model_validate(demo_payload))
    assert unknown.interest_match == 50
    assert unknown.interest_status == "unknown"
    demo_payload["interests"] = ["design"]
    frontend = score_career(CAREERS[1], MatchRequest.model_validate(demo_payload))
    assert frontend.interest_match == 50
    assert frontend.interest_status == "matched"


def test_ranking_is_deterministic_with_slug_tie_break_and_no_mutation(demo_request):
    careers = [SOC.model_copy(update={"slug": slug}) for slug in ["z", "a", "b", "c"]]
    original = deepcopy(careers)
    request_before = demo_request.model_dump()
    result = rank_careers(careers, demo_request)
    reverse = rank_careers(list(reversed(careers)), demo_request)
    assert [match.career.slug for match in result.matches] == ["a", "b", "c"]
    assert result == reverse
    assert careers == original
    assert demo_request.model_dump() == request_before


def test_protected_or_background_fields_do_not_change_scores(demo_payload):
    before = rank_careers(CAREERS, MatchRequest.model_validate(demo_payload))
    demo_payload["profile"].update(
        {
            "education_level": "school",
            "study_field": "Other",
            "goal": "upskilling",
            "language": "mr",
        }
    )
    after = rank_careers(CAREERS, MatchRequest.model_validate(demo_payload))
    assert before == after


def test_all_component_scores_and_fit_remain_bounded(demo_payload):
    for level in range(4):
        demo_payload["skills"] = [
            {"skill_id": skill.id, "self_reported_level": level} for skill in SKILLS
        ]
        for career in CAREERS:
            result = score_career(career, MatchRequest.model_validate(demo_payload))
            assert all(
                0 <= value <= 100
                for value in [
                    result.coverage,
                    result.interest_match,
                    result.feasibility.score,
                    result.fit_score,
                ]
            )
            expected = 0.6 * result.coverage + 0.25 * result.interest_match
            assert result.fit_score == pytest.approx(expected + 0.15 * result.feasibility.score)


def test_invalid_catalog_levels_weights_and_empty_essentials_rejected():
    record = SOC.model_dump()
    record["skills"][0]["weight"] = 0
    with pytest.raises(ValueError):
        CareerOutput.model_validate(record)
    record = SOC.model_dump()
    record["skills"][0]["required_level"] = 0
    with pytest.raises(ValueError):
        CareerOutput.model_validate(record)
    record["skills"] = []
    with pytest.raises(ValueError):
        CareerOutput.model_validate(record)
