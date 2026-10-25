import asyncio
from concurrent.futures import ThreadPoolExecutor
import json
import logging

from fastapi import Response
from fastapi.routing import APIRoute
import pytest
from pydantic import ValidationError
from sqlalchemy import select

from app.api.experts import administrator
from app.core.config import Settings
from app.core.database import Base, make_engine, session_for
from app.core.security import SecurityMiddleware
from app.models.experts import Expert
from app.services import security_quota
from app.services.security_quota import DatabaseProviderBudget
from test_experts import admin_client, HEADERS, payload, TOKEN


def test_every_admin_route_has_server_authorization(admin_client):
    operations = {(path, method.upper()) for path, methods in admin_client.app.openapi()["paths"].items() if path.startswith("/api/v1/admin/") for method in methods}
    assert operations == {("/api/v1/admin/experts", "GET"), ("/api/v1/admin/experts", "POST"), ("/api/v1/admin/experts/{expert_id}", "PUT"), ("/api/v1/admin/experts/{expert_id}", "DELETE")}
    for path, method in operations:
        response = admin_client.request(method, path.replace("{expert_id}", "known-id"), json=payload() if method in {"POST", "PUT"} else None)
        assert response.status_code == 401


@pytest.mark.parametrize("method", ["GET", "PUT", "DELETE"])
def test_known_expert_id_does_not_grant_access(admin_client, method):
    created = admin_client.post("/api/v1/admin/experts", json=payload(contact="private-contact-sentinel"), headers=HEADERS).json()
    response = admin_client.request(method, f"/api/v1/admin/experts/{created['id']}", json=payload(name="Unauthorized edit") if method == "PUT" else None)
    assert response.status_code in {401, 405}  # no single-record GET exists
    assert "private-contact-sentinel" not in response.text
    with session_for(admin_client.app.state.engine) as session:
        expert = session.get(Expert, created["id"])
        assert expert.name == "Test expert" and expert.contact == "private-contact-sentinel"
    assert admin_client.get(f"/api/v1/experts/{created['id']}").status_code == 404


@pytest.mark.parametrize("headers", [
    {"Authorization": "Basic YWRtaW46YWRtaW4="},
    {"Authorization": "Bearer forged.jwt.signature"},
    {"X-Admin": "true", "X-Role": "admin"},
    {"Cookie": f"token={TOKEN}; role=admin"},
    {"x-middleware-subrequest": "middleware:middleware:middleware:middleware:middleware"},
    {"Authorization": "Bearer " + "x" * 400},
])
def test_authentication_bypass_attempts_fail(admin_client, headers):
    assert admin_client.get("/api/v1/admin/experts", headers=headers).status_code == 401
    assert admin_client.get("/api/v1/admin/experts", params={"token": TOKEN}).status_code == 401


@pytest.mark.parametrize("origin", ["null", "https://evil.example", "http://localhost:3000.evil.example"])
def test_cross_origin_admin_mutation_rejected_even_with_token(admin_client, origin):
    result = admin_client.post("/api/v1/admin/experts", headers={**HEADERS, "Origin": origin}, json=payload())
    assert result.status_code == 403
    assert admin_client.get("/api/v1/admin/experts", headers=HEADERS).json() == []


def test_legitimate_admin_origin_and_audit_redaction(admin_client, caplog):
    with caplog.at_level(logging.INFO, logger="pathforge"):
        result = admin_client.post("/api/v1/admin/experts", json=payload(contact="private-contact-sentinel"), headers={**HEADERS, "Origin": "http://localhost:3000"})
    assert result.status_code == 201
    assert "expert_admin_action" in caplog.text
    assert TOKEN not in caplog.text and "private-contact-sentinel" not in caplog.text


def test_auth_failure_limit_not_bypassed_by_forwarded_headers(admin_client):
    admin_client.app.state.settings.admin_failures_per_minute = 1
    assert admin_client.get("/api/v1/admin/experts", headers={"X-Forwarded-For": "192.0.2.1"}).status_code == 401
    response = admin_client.get("/api/v1/admin/experts", headers={"X-Forwarded-For": "192.0.2.2", "X-Real-IP": "192.0.2.3"})
    assert response.status_code == 429 and response.headers["retry-after"] == "60"
    # Failed attempts must not let an attacker lock out a correctly authenticated administrator.
    assert admin_client.get("/api/v1/admin/experts", headers=HEADERS).status_code == 200


def test_api_rate_limit_ignores_forwarded_identity(client):
    client.app.state.settings.api_requests_per_minute = 2
    assert client.get("/api/v1/assessments").status_code == 200
    assert client.get("/api/v1/assessments", headers={"X-Forwarded-For": "192.0.2.1"}).status_code == 200
    assert client.get("/api/v1/assessments", headers={"X-Forwarded-For": "192.0.2.2"}).status_code == 429
    assert client.get("/api/v1/health").status_code == 200


def test_duplicate_authorization_headers_rejected(admin_client):
    response = admin_client.get("/api/v1/admin/experts", headers=[("Authorization", "Bearer wrong"), ("Authorization", HEADERS["Authorization"])])
    assert response.status_code == 400
    assert response.headers["cache-control"] == "no-store"


@pytest.mark.parametrize("header", ["authorization", "content-length", "origin", "host"])
def test_ambiguous_headers_rejected_at_asgi_boundary(header):
    messages = []
    async def app(*args): pytest.fail("Ambiguous headers must not reach routing")
    async def receive(): return {"type": "http.request", "body": b""}
    async def send(message): messages.append(message)
    scope = {"type": "http", "path": "/api/v1/matches", "method": "POST", "headers": [(header.encode(), b"a"), (header.encode(), b"b")]}
    asyncio.run(SecurityMiddleware(app, Settings(_env_file=None))(scope, receive, send))
    assert messages[0]["status"] == 400


@pytest.mark.parametrize("chunked", [False, True])
def test_oversized_bodies_are_rejected_without_echo(client, chunked):
    client.app.state.settings.max_request_bytes = 1024
    content = b"private-body-sentinel" * 100
    response = client.post("/api/v1/matches", content=iter([content[:1000], content[1000:]]) if chunked else content, headers={"Content-Type": "application/json"})
    assert response.status_code == 413
    assert "private-body-sentinel" not in response.text


def test_body_timeout_prevents_slow_upload():
    messages = []
    async def app(*args): pytest.fail("Timed out body must not reach routing")
    async def receive(): await asyncio.sleep(2)
    async def send(message): messages.append(message)
    scope = {"type": "http", "path": "/api/v1/matches", "method": "POST", "headers": []}
    asyncio.run(SecurityMiddleware(app, Settings(request_body_timeout_seconds=1, _env_file=None))(scope, receive, send))
    assert messages[0]["status"] == 408


@pytest.mark.parametrize("headers", [{"Content-Type": "text/plain"}, {"Content-Type": "application/x-www-form-urlencoded"}, {"Content-Type": "application/json", "Content-Encoding": "gzip"}])
def test_non_json_or_compressed_mutations_rejected(client, headers):
    assert client.post("/api/v1/matches", content="{}", headers=headers).status_code == 415


@pytest.mark.parametrize("path", ["/api/v1/health", "/api/v1/missing", "/api/v1/admin/experts"])
def test_sensitive_and_error_responses_have_security_headers(client, path):
    response = client.get(path)
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["cache-control"] == "no-store"
    assert response.headers["referrer-policy"] == "no-referrer"
    assert "default-src 'none'" in response.headers["content-security-policy"]


def test_exception_is_sanitized_and_has_security_headers(client):
    @client.app.get("/api/v1/failure-for-test")
    def failure(): raise RuntimeError("private-error-sentinel")
    result = client.get("/api/v1/failure-for-test")
    assert result.status_code == 500
    assert "private-error-sentinel" not in result.text
    assert result.headers["cache-control"] == "no-store"


def test_untrusted_host_rejected(client):
    assert client.get("/api/v1/health", headers={"Host": "evil.example"}).status_code == 400


def test_exception_after_headers_does_not_send_second_response_or_details():
    messages = []
    async def app(scope, receive, send):
        await send({"type": "http.response.start", "status": 200, "headers": []})
        await send({"type": "http.response.body", "body": b"partial", "more_body": True})
        raise RuntimeError("private-after-start-sentinel")
    async def receive(): return {"type": "http.request", "body": b""}
    async def send(message): messages.append(message)
    scope = {"type": "http", "path": "/api/v1/test", "method": "GET", "headers": []}
    asyncio.run(SecurityMiddleware(app, Settings(_env_file=None))(scope, receive, send))
    assert sum(message["type"] == "http.response.start" for message in messages) == 1
    assert messages[-1]["more_body"] is False
    assert "private-after-start-sentinel" not in str(messages)


@pytest.mark.parametrize("token", ["a" * 40, " " * 40, "short", "random-token-with-space " * 3])
def test_weak_admin_tokens_rejected(token):
    with pytest.raises(ValidationError): Settings(admin_token=token, _env_file=None)


@pytest.mark.parametrize("values", [dict(allowed_hosts=["*"]), dict(allowed_hosts=["https://api.example"]), dict(environment="production"), dict(environment="production", allowed_hosts=["api.example"], cors_origins=["http://app.example"])])
def test_insecure_production_configuration_fails_closed(values):
    with pytest.raises(ValidationError): Settings(**values, _env_file=None)


def test_production_docs_disabled_and_hsts_present():
    from app.main import create_app
    from fastapi.testclient import TestClient
    app = create_app(Settings(environment="production", allowed_hosts=["api.example"], cors_origins=["https://app.example"], database_url="sqlite:///:memory:", _env_file=None))
    with TestClient(app, base_url="https://api.example") as client:
        assert client.get("/docs").status_code == 404
        assert client.get("/openapi.json").status_code == 404
        assert client.get("/api/v1/health").headers["strict-transport-security"] == "max-age=31536000"


def test_sql_injection_payload_does_not_change_expert_table(admin_client):
    value = "Robert'); DROP TABLE experts;--"
    response = admin_client.post("/api/v1/admin/experts", json=payload(name=value), headers=HEADERS)
    assert response.status_code == 201
    assert admin_client.get("/api/v1/admin/experts", headers=HEADERS).json()[0]["name"] == value


def test_mass_assignment_rejected_for_public_and_admin(admin_client):
    assert admin_client.post("/api/v1/experts", json=payload(verified=True, approved=True)).status_code == 405
    assert admin_client.post("/api/v1/admin/experts", json=payload(id="chosen", role="admin"), headers=HEADERS).status_code == 422
    assert admin_client.get("/api/v1/admin/experts", headers=HEADERS).json() == []


def test_paid_budget_survives_restart_and_multiple_engines(tmp_path, monkeypatch):
    monkeypatch.setattr(security_quota, "time", lambda: 1700000000)
    url = "sqlite:///" + (tmp_path / "quotas.db").as_posix()
    engine = make_engine(url); Base.metadata.create_all(engine)
    assert DatabaseProviderBudget(engine).acquire(2, 2)
    engine.dispose()
    engine = make_engine(url)
    other = make_engine(url)
    try:
        assert DatabaseProviderBudget(other).acquire(2, 2)
        assert DatabaseProviderBudget(engine).acquire(2, 2) is False
    finally: engine.dispose(); other.dispose()


def test_paid_budget_atomic_under_concurrency(tmp_path, monkeypatch):
    monkeypatch.setattr(security_quota, "time", lambda: 1700000000)
    engine = make_engine("sqlite:///" + (tmp_path / "quotas.db").as_posix())
    Base.metadata.create_all(engine)
    try:
        with ThreadPoolExecutor(max_workers=8) as pool:
            accepted = list(pool.map(lambda _: DatabaseProviderBudget(engine).acquire(3, 3), range(12)))
        assert sum(accepted) == 3
    finally: engine.dispose()


def test_paid_daily_budget_persists_across_minute_windows(client, monkeypatch):
    now = [1700000000]
    monkeypatch.setattr(security_quota, "time", lambda: now[0])
    budget = DatabaseProviderBudget(client.app.state.engine)
    assert budget.acquire(1, 2)
    assert budget.acquire(1, 2) is False
    now[0] += 60
    assert budget.acquire(1, 2)
    now[0] += 60
    assert budget.acquire(1, 2) is False
    now[0] += 86400
    assert budget.acquire(1, 2)


def test_paid_budget_database_failure_denies_access():
    engine = make_engine("sqlite:///:memory:")
    try: assert DatabaseProviderBudget(engine).acquire(5, 100) is False
    finally: engine.dispose()
