import json
import logging

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, inspect, select

from app.api.routes import database_session
from app.core.config import Settings
from app.core.database import Base, session_for
from app.main import create_app
from app.models import Career, CareerSkill, Skill


def assert_error(response, status):
    assert response.status_code == status
    error = response.json()["error"]
    assert set(error) == {"code", "message", "details"}
    assert isinstance(error["details"], list)


def test_health_and_catalog_contract(client):
    assert client.get("/api/v1/health").json() == {"status": "ok", "version": "0.1.0"}
    skills = client.get("/api/v1/catalog/skills").json()
    assert len(skills["skills"]) == 36
    assert len(skills["interests"]) == 12
    assert len(client.get("/api/v1/catalog/careers").json()["careers"]) == 12
    soc = client.get("/api/v1/catalog/careers/soc-analyst").json()
    assert soc["source_note"] == "curated_demo"
    assert len(soc["skills"]) == 8
    assert_error(client.get("/api/v1/catalog/careers/unknown"), 404)
    assert_error(client.get("/api/v1/not-found"), 404)
    assert_error(client.get("/api/v1/matches"), 405)


def test_stateless_repeatable_demo_and_no_api_key(client, demo_payload, monkeypatch):
    monkeypatch.delenv("AI_API_KEY", raising=False)
    response = client.post("/api/v1/matches", json=demo_payload)
    assert response.status_code == 200
    assert len(response.json()["matches"]) == 3
    assert response.json() == client.post("/api/v1/matches", json=demo_payload).json()
    assert "self-reported" in response.json()["notice"]
    assert "profile" not in response.json()
    assert_error(client.get("/api/v1/profiles/anything"), 404)
    assert_error(client.post("/api/v1/roadmaps/generate", json={}), 422)
    assert len(client.get("/api/v1/assessments").json()) == 3


@pytest.mark.parametrize(
    "field,value",
    [
        ("hours_per_week", 0),
        ("hours_per_week", 31),
        ("hours_per_week", 1.5),
        ("hours_per_week", "6"),
        ("hours_per_week", True),
        ("budget_inr", -0.01),
        ("budget_inr", "0"),
        ("budget_inr", True),
        ("budget_inr", 1_000_001),
        ("education_level", "graduate"),
        ("device_access", "phone"),
        ("language", "hi"),
        ("study_field", "  "),
        ("study_field", "a" * 101),
        ("study_field", "a\x01b"),
        ("goal", "guaranteed_job"),
    ],
)
def test_rejects_invalid_profile_fields(client, demo_payload, field, value):
    demo_payload["profile"][field] = value
    assert_error(client.post("/api/v1/matches", json=demo_payload), 422)


@pytest.mark.parametrize("level", [-1, 4, 1.5, "2", True, None])
def test_rejects_impossible_or_coerced_skill_levels(client, demo_payload, level):
    demo_payload["skills"][0]["self_reported_level"] = level
    assert_error(client.post("/api/v1/matches", json=demo_payload), 422)


@pytest.mark.parametrize("value", ["NaN", "Infinity", "-Infinity"])
def test_rejects_nonfinite_budget_with_serializable_errors(client, demo_payload, value):
    body = json.dumps(demo_payload).replace('"budget_inr": 0', f'"budget_inr": {value}')
    response = client.post(
        "/api/v1/matches", content=body, headers={"Content-Type": "application/json"}
    )
    assert_error(response, 422)
    assert "input" not in response.json()["error"]["details"][0]


@pytest.mark.parametrize(
    "mutation",
    [
        "duplicate_skill",
        "duplicate_interest",
        "unknown_skill",
        "unknown_interest",
        "extra_root",
        "extra_profile",
        "extra_skill",
        "too_many_skills",
        "too_many_interests",
    ],
)
def test_catalog_validation_and_extra_field_rejection(client, demo_payload, mutation):
    if mutation == "duplicate_skill":
        demo_payload["skills"].append(demo_payload["skills"][0])
    elif mutation == "duplicate_interest":
        demo_payload["interests"] *= 2
    elif mutation == "unknown_skill":
        demo_payload["skills"][0]["skill_id"] = "invented"
    elif mutation == "unknown_interest":
        demo_payload["interests"] = ["invented"]
    elif mutation == "extra_root":
        demo_payload["email"] = "not-required"
    elif mutation == "extra_profile":
        demo_payload["profile"]["email"] = "not-required"
    elif mutation == "extra_skill":
        demo_payload["skills"][0]["proof"] = "not-required"
    elif mutation == "too_many_skills":
        demo_payload["skills"] = [
            {"skill_id": f"skill_{i}", "self_reported_level": 0} for i in range(41)
        ]
    else:
        demo_payload["interests"] = [f"interest_{i}" for i in range(13)]
    assert_error(client.post("/api/v1/matches", json=demo_payload), 422)


def test_empty_selections_and_valid_input_boundaries(client, demo_payload):
    demo_payload.update({"skills": [], "interests": []})
    for hours, budget in [(1, 0), (30, 1_000_000)]:
        demo_payload["profile"].update(hours_per_week=hours, budget_inr=budget)
        response = client.post("/api/v1/matches", json=demo_payload)
        assert response.status_code == 200
        assert all(match["interest_status"] == "unknown" for match in response.json()["matches"])


def test_malformed_json_and_missing_body(client):
    assert_error(
        client.post("/api/v1/matches", content="{", headers={"Content-Type": "application/json"}),
        422,
    )
    assert_error(client.post("/api/v1/matches"), 422)


def test_explicit_cors_allowed_and_untrusted_origins(client):
    allowed = client.options(
        "/api/v1/matches",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert allowed.status_code == 200
    assert allowed.headers["access-control-allow-origin"] == "http://localhost:3000"
    untrusted = client.get("/api/v1/health", headers={"Origin": "https://untrusted.example"})
    assert "access-control-allow-origin" not in untrusted.headers
    assert "access-control-allow-credentials" not in allowed.headers
    denied = client.options(
        "/api/v1/matches",
        headers={
            "Origin": "https://untrusted.example",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert_error(denied, 400)
    assert denied.json()["error"]["code"] == "cors_error"


def test_logs_and_errors_do_not_contain_profile_payloads(client, demo_payload, caplog):
    sentinel = "private-profile-field-sentinel"
    demo_payload["profile"]["study_field"] = sentinel
    with caplog.at_level(logging.INFO, logger="pathforge"):
        assert client.post("/api/v1/matches", json=demo_payload).status_code == 200
        assert client.get("/api/v1/catalog/careers/secret-student-slug").status_code == 404
    messages = [record.getMessage() for record in caplog.records if record.name == "pathforge"]
    assert len(messages) == 2
    assert all(json.loads(message)["event"] == "request_complete" for message in messages)
    assert sentinel not in " ".join(messages)
    assert "secret-student-slug" not in " ".join(messages)
    demo_payload["profile"]["hours_per_week"] = sentinel
    invalid = client.post("/api/v1/matches", json=demo_payload)
    assert sentinel not in invalid.text


def test_unseeded_catalog_returns_503_without_persisting_profile(demo_payload, caplog):
    application = create_app(Settings(database_url="sqlite:///:memory:", _env_file=None))
    demo_payload.update(skills=[], interests=[])
    profile_sentinel = "unseeded-private-profile-sentinel"
    demo_payload["profile"]["study_field"] = profile_sentinel
    with TestClient(application, raise_server_exceptions=False) as client:
        Base.metadata.create_all(application.state.engine)
        with caplog.at_level(logging.INFO, logger="pathforge"):
            response = client.post("/api/v1/matches", json=demo_payload)
        assert_error(response, 503)
        assert response.json()["error"]["code"] == "catalog_unavailable"
        assert "initialize the demo data" in response.json()["error"]["message"]
        assert set(inspect(application.state.engine).get_table_names()) == {
            "experts",
            "skills",
            "careers",
            "career_skills",
            "learning_resources",
            "learning_resource_skills",
        }
        with session_for(application.state.engine) as session:
            for model in [Skill, Career, CareerSkill]:
                assert session.scalar(select(func.count()).select_from(model)) == 0
    assert profile_sentinel not in response.text
    assert profile_sentinel not in caplog.text


def test_unexpected_internal_error_is_sanitized_in_response_and_logs(
    client,
    demo_payload,
    caplog,
):
    profile_sentinel = "unexpected-error-private-profile-sentinel"
    secret_sentinel = "unexpected-error-secret-sentinel"
    demo_payload["profile"]["study_field"] = profile_sentinel

    def failing_database_session():
        raise RuntimeError(f"{secret_sentinel}: {profile_sentinel}")

    client.app.dependency_overrides[database_session] = failing_database_session
    try:
        with caplog.at_level(logging.INFO, logger="pathforge"):
            response = client.post("/api/v1/matches", json=demo_payload)
    finally:
        client.app.dependency_overrides.clear()

    assert_error(response, 500)
    assert response.json() == {
        "error": {
            "code": "internal_error",
            "message": "Unable to complete this request",
            "details": [],
        }
    }
    messages = [record.getMessage() for record in caplog.records if record.name == "pathforge"]
    assert any(json.loads(message)["event"] == "internal_error" for message in messages)
    for sentinel in [profile_sentinel, secret_sentinel]:
        assert sentinel not in response.text
        assert sentinel not in caplog.text
