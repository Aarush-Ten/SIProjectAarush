import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import select

from app.core.config import Settings
from app.core.database import Base, session_for
from app.main import create_app
from app.models.experts import Expert
from app.core.database import make_engine

TOKEN = "test-only-administrator-token-123456789"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}


@pytest.fixture
def admin_client():
    app = create_app(Settings(database_url="sqlite:///:memory:", admin_token=TOKEN, _env_file=None))
    with TestClient(app) as client:
        Base.metadata.create_all(app.state.engine)
        yield client


def payload(**overrides):
    return {"name": "Test expert", "expertise": ["Career exploration"], **overrides}


def test_admin_disabled_without_configuration(client):
    assert client.get("/api/v1/admin/experts").status_code == 503


def test_expert_survives_database_reconnection(tmp_path):
    url = "sqlite:///" + (tmp_path / "experts.db").as_posix()
    engine = make_engine(url)
    Base.metadata.create_all(engine)
    with session_for(engine) as session:
        session.add(Expert(id="persistent-test-id", name="Test profile", bio="", expertise=["Guidance"], contact=None, availability=""))
        session.commit()
    engine.dispose()
    engine = make_engine(url)
    try:
        with session_for(engine) as session:
            assert session.get(Expert, "persistent-test-id").expertise == ["Guidance"]
    finally:
        engine.dispose()


def test_weak_token_rejected():
    with pytest.raises(ValidationError):
        Settings(admin_token="weak", _env_file=None)


@pytest.mark.parametrize("method,path", [("get", "/admin/experts"), ("post", "/admin/experts"), ("put", "/admin/experts/id"), ("delete", "/admin/experts/id")])
def test_admin_requires_credentials(admin_client, method, path):
    response = getattr(admin_client, method)("/api/v1" + path)
    assert response.status_code == 401
    assert admin_client.get("/api/v1/admin/experts", headers={"Authorization": "Bearer incorrect"}).status_code == 401


def test_crud_persists_and_does_not_pollute_catalog(admin_client):
    created = admin_client.post("/api/v1/admin/experts", json=payload(contact="private test contact"), headers=HEADERS)
    assert created.status_code == 201
    expert = created.json()
    assert expert["public_visible"] is False
    with session_for(admin_client.app.state.engine) as session:
        assert session.scalar(select(Expert)).contact == "private test contact"
    assert admin_client.get("/api/v1/experts").json() == []
    assert admin_client.get("/api/v1/admin/experts", headers=HEADERS).json() == [expert]
    expert.pop("id")
    expert["name"] = "Updated expert"
    url = "/api/v1/admin/experts/" + created.json()["id"]
    assert admin_client.put(url, json=expert, headers=HEADERS).json()["name"] == "Updated expert"
    assert admin_client.delete(url, headers=HEADERS).status_code == 204
    assert admin_client.get("/api/v1/admin/experts", headers=HEADERS).json() == []
    assert admin_client.delete(url, headers=HEADERS).status_code == 404
    assert admin_client.put(url, json=expert, headers=HEADERS).status_code == 404


@pytest.mark.parametrize("flag", ["verified", "approved", "active", "public_visible"])
def test_all_publication_gates_required(admin_client, flag):
    values = dict(verified=True, approved=True, active=True, public_visible=True, availability="Saturday", contact="private", **{})
    values[flag] = False
    assert admin_client.post("/api/v1/admin/experts", json=payload(**values), headers=HEADERS).status_code == 201
    assert admin_client.get("/api/v1/experts").json() == []


def test_contact_consent_demo_and_availability(admin_client):
    data = payload(verified=True, approved=True, public_visible=True, contact="consented contact", availability="Saturday")
    result = admin_client.post("/api/v1/admin/experts", json=data, headers=HEADERS).json()
    public = admin_client.get("/api/v1/experts").json()[0]
    assert public["consultation_available"] is True
    assert public["contact"] is None
    assert "approved" not in public
    url = "/api/v1/admin/experts/" + result["id"]
    data["public_contact"] = True
    admin_client.put(url, json=data, headers=HEADERS)
    assert admin_client.get("/api/v1/experts").json()[0]["contact"] == "consented contact"
    data["is_demo"] = True
    admin_client.put(url, json=data, headers=HEADERS)
    public = admin_client.get("/api/v1/experts").json()[0]
    assert public["is_demo"] is True
    assert public["consultation_available"] is False
    assert public["contact"] is None
    data.update(is_demo=False, availability="")
    admin_client.put(url, json=data, headers=HEADERS)
    assert admin_client.get("/api/v1/experts").json()[0]["consultation_available"] is False


@pytest.mark.parametrize("values", [dict(name=" "), dict(expertise=[]), dict(expertise=[" "]), dict(expertise=["Python", "python"]), dict(verified="yes"), dict(unknown="field"), dict(contact="x" * 251)])
def test_invalid_experts_rejected(admin_client, values):
    assert admin_client.post("/api/v1/admin/experts", json=payload(**values), headers=HEADERS).status_code == 422


def test_admin_preflight_explicit_origin_and_header(admin_client):
    response = admin_client.options("/api/v1/admin/experts/id", headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "PUT", "Access-Control-Request-Headers": "authorization,content-type"})
    assert response.status_code == 200
    response = admin_client.options("/api/v1/admin/experts", headers={"Origin": "https://untrusted.example", "Access-Control-Request-Method": "POST"})
    assert response.status_code == 400
