import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.core.database import Base, session_for
from app.main import create_app
from app.schemas.api import MatchRequest
from app.seed.runner import seed_catalog


@pytest.fixture
def demo_payload() -> dict:
    return {
        "profile": {
            "education_level": "diploma",
            "study_field": "Computer engineering",
            "goal": "first_job",
            "hours_per_week": 6,
            "budget_inr": 0,
            "device_access": "laptop",
            "language": "en",
        },
        "skills": [
            {"skill_id": "python", "self_reported_level": 2},
            {"skill_id": "html", "self_reported_level": 2},
            {"skill_id": "sql", "self_reported_level": 1},
        ],
        "interests": ["cybersecurity"],
    }


@pytest.fixture
def demo_request(demo_payload) -> MatchRequest:
    return MatchRequest.model_validate(demo_payload)


@pytest.fixture
def client():
    application = create_app(Settings(database_url="sqlite:///:memory:", _env_file=None))
    with TestClient(application, raise_server_exceptions=False) as test_client:
        Base.metadata.create_all(application.state.engine)
        with session_for(application.state.engine) as session:
            seed_catalog(session)
        yield test_client
