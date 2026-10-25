from collections.abc import Generator

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import session_for
from app.models import Career
from app.schemas.api import (
    CareerCatalog,
    CareerOutput,
    MatchRequest,
    MatchResponse,
    SkillCatalog,
)
from app.schemas.roadmap import (
    CareerMatchResponse,
    ResourceCatalog,
    RoadmapRequest,
    RoadmapResponse,
)
from app.seed.catalog import INTERESTS
from app.services import matching
from app.services.catalog import list_careers, list_resources, list_skills, serialize_career
from app.services.roadmap import generate_roadmap

router = APIRouter(prefix="/api/v1")


def database_session(request: Request) -> Generator[Session]:
    with session_for(request.app.state.engine) as session:
        yield session


@router.get("/health", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok", "version": "0.1.0"}


@router.get("/catalog/skills", response_model=SkillCatalog, tags=["catalog"])
def skills(session: Session = Depends(database_session)) -> SkillCatalog:
    return SkillCatalog(skills=list_skills(session), interests=INTERESTS)


@router.get("/catalog/careers", response_model=CareerCatalog, tags=["catalog"])
def careers(session: Session = Depends(database_session)) -> CareerCatalog:
    return CareerCatalog(careers=list_careers(session))


@router.get("/catalog/careers/{slug}", response_model=CareerOutput, tags=["catalog"])
def career(slug: str, session: Session = Depends(database_session)) -> CareerOutput:
    return load_career(slug, session)


def load_career(slug: str, session: Session) -> CareerOutput:
    row = session.scalar(select(Career).where(Career.slug == slug))
    if row is None:
        raise HTTPException(status_code=404, detail="Career not found")
    return serialize_career(row)


def validate_catalog_selections(payload: MatchRequest, session: Session) -> None:
    known_skills = {skill.id for skill in list_skills(session)}
    known_interests = {interest.id for interest in INTERESTS}
    if any(skill.skill_id not in known_skills for skill in payload.skills):
        raise HTTPException(status_code=422, detail="Select skills from the current catalog")
    if any(interest not in known_interests for interest in payload.interests):
        raise HTTPException(status_code=422, detail="Select interests from the current catalog")


@router.get("/catalog/resources", response_model=ResourceCatalog, tags=["catalog"])
def resources(session: Session = Depends(database_session)) -> ResourceCatalog:
    return ResourceCatalog(resources=list_resources(session))


@router.post("/catalog/careers/{slug}/match", response_model=CareerMatchResponse, tags=["matching"])
def career_match(
    slug: str,
    payload: MatchRequest,
    session: Session = Depends(database_session),
) -> CareerMatchResponse:
    validate_catalog_selections(payload, session)
    evaluated = matching.score_career(load_career(slug, session), payload)
    return CareerMatchResponse(
        match=evaluated.model_copy(
            update={
                "coverage": round(evaluated.coverage, 2),
                "interest_match": round(evaluated.interest_match, 2),
                "fit_score": round(evaluated.fit_score, 2),
            }
        ),
        formula=matching.FORMULA.model_copy(),
        notice=matching.NOTICE,
    )


@router.post("/roadmaps/generate", response_model=RoadmapResponse, tags=["roadmaps"])
def roadmap(
    payload: RoadmapRequest,
    session: Session = Depends(database_session),
) -> RoadmapResponse:
    validate_catalog_selections(payload, session)
    return generate_roadmap(
        load_career(payload.career_slug, session),
        payload,
        list_resources(session),
        list_skills(session),
    )


@router.post("/matches", response_model=MatchResponse, tags=["matching"])
def matches(
    payload: MatchRequest,
    session: Session = Depends(database_session),
) -> MatchResponse:
    validate_catalog_selections(payload, session)
    catalog = list_careers(session)
    if len(catalog) < 3:
        raise HTTPException(status_code=503, detail="Catalog unavailable; initialize the demo data")
    return matching.rank_careers(catalog, payload)
