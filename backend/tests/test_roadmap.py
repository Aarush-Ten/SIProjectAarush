from copy import deepcopy
from decimal import Decimal

import pytest
from sqlalchemy import inspect

from app.schemas.api import CareerSkillOutput
from app.schemas.roadmap import LearningResourceOutput, RoadmapRequest
from app.seed.catalog import CAREERS, SKILLS
from app.seed.resources import RESOURCES
from app.services.roadmap import generate_roadmap, select_resource


def request_for(payload, slug="soc-analyst", **constraints):
    body = deepcopy(payload)
    body["profile"].update(constraints)
    return RoadmapRequest(career_slug=slug, **body)


def tasks(plan):
    return [task for week in plan.weeks for task in week.tasks]


def reference(identifier, skills, cost=0, free=True, device="any"):
    return LearningResourceOutput(
        id=identifier, title="Test reference", provider="Python documentation",
        url="https://docs.python.org/3/tutorial/", cost_inr=cost, is_free=free,
        skill_ids=skills, estimated_hours=2, source_note="Test fixture",
        last_checked=None, device_requirement=device,
    )


@pytest.mark.parametrize("career", CAREERS, ids=lambda career: career.slug)
@pytest.mark.parametrize("hours", [1, 4, 6, 30])
def test_all_careers_pack_exact_hours_and_dependencies(demo_payload, career, hours):
    plan = generate_roadmap(career, request_for(demo_payload, career.slug, hours_per_week=hours), RESOURCES, SKILLS)
    assert plan.estimated_weeks == len(plan.weeks)
    assert sum(week.total_hours for week in plan.weeks) == plan.total_hours
    seen = set()
    for week in plan.weeks:
        assert 0 < week.total_hours <= hours
        assert sum(task.estimated_hours for task in week.tasks) == week.total_hours
        for task in week.tasks:
            assert task.id not in seen
            assert set(task.prerequisite_task_ids) <= seen
            assert task.activity and task.verification
            assert task.estimated_hours % 0.5 == 0
            assert task.resource is None or task.resource.is_free
            seen.add(task.id)
    assert any(task.mode == "milestone" for task in tasks(plan))
    assert plan.estimated_cost_inr == 0


def test_soc_demo_hand_calculated_hours_and_split_conservation(demo_payload):
    plan = generate_roadmap(CAREERS[0], request_for(demo_payload), RESOURCES, SKILLS)
    # Four missing essential levels/groups: 4+4+4+2; communication4, Git2; milestone1.
    assert plan.total_hours == 21
    assert [week.total_hours for week in plan.weeks] == [6, 6, 6, 3]
    assert plan.selected_match.fit_score == 47.07
    networking = [task for task in tasks(plan) if task.skill_id == "networking"]
    assert sum(task.estimated_hours for task in networking) == 4
    assert all(task.part <= task.total_parts for task in networking)
    milestone = next(i for i, task in enumerate(tasks(plan)) if task.mode == "milestone")
    assert all(task.importance != "optional" for task in tasks(plan)[:milestone])


def test_phone_plan_is_theory_with_computer_practical_limitations(demo_payload):
    plan = generate_roadmap(CAREERS[0], request_for(demo_payload, device_access="smartphone_only", hours_per_week=4), RESOURCES, SKILLS)
    assert plan.estimated_weeks == 6
    assert all(task.device_requirement == "any" for task in tasks(plan))
    assert any(task.mode == "theory" and task.alternative for task in tasks(plan))
    assert "computer" in " ".join(plan.warnings).lower()


@pytest.mark.parametrize("slug", ["solar-pv-technician", "electrical-technician"])
def test_physical_work_requires_supervision_even_with_laptop(demo_payload, slug):
    career = next(item for item in CAREERS if item.slug == slug)
    plan = generate_roadmap(career, request_for(demo_payload, slug), RESOURCES, SKILLS)
    physical = {"safety", "solar_systems", "electrical_basics", "installation", "measurement"}
    assert all(task.mode != "practical" for task in tasks(plan) if task.skill_id in physical)
    assert any("qualified supervision" in warning for warning in plan.warnings)
    assert any("budget" in warning for warning in plan.warnings)


def test_free_first_and_unknown_paid_cost_excluded():
    free = reference("free", ["python"])
    paid = reference("paid", ["python"], 0, False)
    assert select_resource("python", [paid, free], False, Decimal(0), set()).id == "free"
    assert select_resource("python", [reference("unknown", ["python"], None, False)], False, Decimal(100), set()) is None
    assert select_resource("python", [reference("computer", ["python"], device="computer")], True, Decimal(100), set()) is None


def test_combined_budget_and_reused_resource_charged_once(demo_payload):
    request = request_for(demo_payload, budget_inr=30)
    shared = reference("shared", ["communication", "git"], 25, False)
    plan = generate_roadmap(CAREERS[0], request, [shared], SKILLS)
    assert plan.estimated_cost_inr == 25
    assert sum(task.estimated_hours for task in tasks(plan) if task.resource) == 6
    choices = [reference("communication", ["communication"], 20, False), reference("git", ["git"], 20, False)]
    limited = generate_roadmap(CAREERS[0], request, choices, SKILLS)
    assert limited.estimated_cost_inr == 20
    assert len({task.resource.id for task in tasks(limited) if task.resource}) == 1


def test_no_resources_and_zero_budget_still_return_honest_plan(demo_payload):
    plan = generate_roadmap(CAREERS[0], request_for(demo_payload), [], SKILLS)
    assert plan.total_hours == 21
    assert plan.estimated_cost_inr == 0
    assert all(task.resource is None for task in tasks(plan))
    assert any("without a link" in warning for warning in plan.warnings)


def test_prerequisite_minimum_precedes_core_optional_upgrade_follows(demo_payload):
    base = next(item for item in CAREERS if item.slug == "digital-marketing-associate")
    career = base.model_copy(update={"skills": base.skills + [CareerSkillOutput(skill_id="html", label="HTML", required_level=3, importance="optional", weight=1)]})
    request = request_for(demo_payload, career.slug)
    request.skills = []
    plan = generate_roadmap(career, request, RESOURCES, SKILLS)
    sequence = tasks(plan)
    foundation = next(i for i, task in enumerate(sequence) if task.skill_id == "html" and task.importance == "prerequisite")
    seo = next(i for i, task in enumerate(sequence) if task.skill_id == "seo")
    milestone = next(i for i, task in enumerate(sequence) if task.mode == "milestone")
    advanced = next(i for i, task in enumerate(sequence) if task.skill_id == "html" and task.importance == "optional")
    assert foundation < seo < milestone < advanced
    assert sum(task.estimated_hours for task in sequence if task.skill_id == "html") == 6


def test_full_coverage_has_manual_verification_not_empty_plan(demo_payload):
    payload = deepcopy(demo_payload)
    payload["skills"] = [{"skill_id": skill.id, "self_reported_level": 3} for skill in SKILLS]
    plan = generate_roadmap(CAREERS[0], request_for(payload), RESOURCES, SKILLS)
    assert plan.total_hours == 1
    assert len(tasks(plan)) == 1
    assert tasks(plan)[0].mode == "milestone"


def test_determinism_no_mutation_and_catalog_changes_invalidate_id(demo_payload):
    request = request_for(demo_payload)
    before = request.model_dump()
    plan = generate_roadmap(CAREERS[0], request, RESOURCES, SKILLS)
    request.skills.reverse()
    assert plan == generate_roadmap(CAREERS[0], request, list(reversed(RESOURCES)), SKILLS)
    request.skills.reverse()
    assert request.model_dump() == before
    changed = [item.model_copy(update={"title": item.title + " updated"}) for item in RESOURCES]
    assert plan.id != generate_roadmap(CAREERS[0], request, changed, SKILLS).id


def test_cycles_and_unknown_prerequisites_rejected(demo_payload):
    for rules in [{"python": (("html", 1),), "html": (("python", 1),)}, {"python": (("invented", 1),)}]:
        with pytest.raises(ValueError):
            generate_roadmap(CAREERS[0], request_for(demo_payload), RESOURCES, SKILLS, prerequisites=rules)


def test_resource_catalog_and_stateless_roadmap_api(client, demo_payload):
    resources = client.get("/api/v1/catalog/resources").json()["resources"]
    assert 20 <= len(resources) <= 35
    assert {skill.id for skill in SKILLS} <= {skill for row in resources for skill in row["skill_ids"]}
    body = {"career_slug": "soc-analyst", **demo_payload}
    response = client.post("/api/v1/roadmaps/generate", json=body)
    assert response.status_code == 200
    assert response.json() == client.post("/api/v1/roadmaps/generate", json=body).json()
    chosen = client.post("/api/v1/catalog/careers/soc-analyst/match", json=demo_payload)
    assert chosen.status_code == 200
    assert chosen.json()["match"] == response.json()["selected_match"]
    assert not {"profiles", "roadmaps", "roadmap_tasks"}.intersection(inspect(client.app.state.engine).get_table_names())


@pytest.mark.parametrize("change,status", [("career", 404), ("skill", 422), ("hours", 422), ("budget", 422)])
def test_roadmap_api_rejects_invalid_snapshot(client, demo_payload, change, status):
    body = {"career_slug": "soc-analyst", **deepcopy(demo_payload)}
    if change == "career":
        body["career_slug"] = "unknown-career"
    elif change == "skill":
        body["skills"][0]["skill_id"] = "unknown"
    elif change == "hours":
        body["profile"]["hours_per_week"] = 0
    else:
        body["profile"]["budget_inr"] = -1
    response = client.post("/api/v1/roadmaps/generate", json=body)
    assert response.status_code == status
    assert set(response.json()) == {"error"}
