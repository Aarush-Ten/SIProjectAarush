from pathlib import Path

import pytest
from alembic.config import Config
from sqlalchemy import func, inspect, select
from sqlalchemy.exc import IntegrityError

from alembic import command
from app.core.config import Settings, get_settings
from app.core.database import Base, make_engine, session_for
from app.models import Career, CareerSkill, Skill
from app.seed.catalog import CAREERS, INTERESTS, SKILLS
from app.seed.runner import seed_catalog
from app.services.catalog import list_careers


def test_curated_catalog_counts_and_relationship_integrity():
    assert len(CAREERS) == 12
    assert 25 <= len(SKILLS) <= 40
    assert len({skill.id for skill in SKILLS}) == len(SKILLS)
    assert len({career.slug for career in CAREERS}) == len(CAREERS)
    known = {skill.id for skill in SKILLS}
    interests = {interest.id for interest in INTERESTS}
    for career in CAREERS:
        assert 3 <= sum(skill.importance == "essential" for skill in career.skills) <= 8
        assert 2 <= sum(skill.importance == "optional" for skill in career.skills) <= 5
        assert all(skill.skill_id in known for skill in career.skills)
        assert set(career.interest_tags).issubset(interests)
        assert len(career.tasks) >= 3
        assert career.source_note == "curated_demo"


def test_seed_is_idempotent_and_persists_database_constraints():
    engine = make_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    try:
        with session_for(engine) as session:
            seed_catalog(session)
            expected = list_careers(session)
            seed_catalog(session)
            assert list_careers(session) == expected
            assert session.scalar(select(func.count()).select_from(Skill)) == 36
            assert session.scalar(select(func.count()).select_from(Career)) == 12
            assert session.scalar(select(func.count()).select_from(CareerSkill)) == sum(
                len(career.skills) for career in CAREERS
            )
            session.add(
                CareerSkill(
                    career_id="soc-analyst",
                    skill_id="html",
                    required_level=0,
                    importance="essential",
                    weight=1,
                )
            )
            with pytest.raises(IntegrityError):
                session.commit()
            session.rollback()
            session.add(
                CareerSkill(
                    career_id="soc-analyst",
                    skill_id="unknown",
                    required_level=1,
                    importance="essential",
                    weight=1,
                )
            )
            with pytest.raises(IntegrityError):
                session.commit()
    finally:
        engine.dispose()


def test_alembic_upgrade_seed_and_downgrade(tmp_path: Path, monkeypatch):
    url = f"sqlite:///{(tmp_path / 'migration.db').as_posix()}"
    monkeypatch.setenv("DATABASE_URL", url)
    get_settings.cache_clear()
    config = Config("alembic.ini")
    try:
        command.upgrade(config, "head")
        command.check(config)
        engine = make_engine(url)
        with session_for(engine) as session:
            seed_catalog(session)
            assert len(list_careers(session)) == 12
        engine.dispose()
        command.downgrade(config, "base")
        engine = make_engine(url)
        assert "careers" not in inspect(engine).get_table_names()
        engine.dispose()
    finally:
        get_settings.cache_clear()


@pytest.mark.parametrize(
    "origin",
    [
        "*",
        "https://*.example.com",
        "ftp://localhost:3000",
        "http://localhost:3000/path",
        "not-an-origin",
    ],
)
def test_config_rejects_wildcard_or_invalid_cors(origin):
    with pytest.raises(ValueError):
        Settings(cors_origins=[origin], _env_file=None)
