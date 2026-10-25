from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from app.api.routes import database_session, load_career, validate_catalog_selections
from app.schemas.phase3 import Assessment, AssessmentInfo, GradeRequest, GradeResult, WordingRequest, WordingResponse
from app.services import assessments
from app.services.ai_provider import enhance_wording
from app.services.catalog import list_resources, list_skills
from app.services.roadmap import generate_roadmap
from app.schemas.roadmap import RoadmapRequest

router = APIRouter(prefix="/api/v1", tags=["learning"])


@router.get("/assessments", response_model=list[AssessmentInfo])
def assessment_catalog():
    return assessments.list_assessments()


def ensure_quiz(slug):
    if slug not in assessments.QUIZZES:
        raise HTTPException(404, "Assessment not found")


@router.get("/assessments/{slug}", response_model=Assessment)
def assessment(slug: str):
    ensure_quiz(slug)
    return assessments.get_assessment(slug)


@router.post("/assessments/{slug}/grade", response_model=GradeResult)
def grade(slug: str, payload: GradeRequest, response: Response):
    ensure_quiz(slug)
    response.headers["Cache-Control"] = "no-store"
    try:
        return assessments.grade_assessment(slug, payload)
    except ValueError as error:
        raise HTTPException(422, str(error)) from None


@router.post("/guidance/wording", response_model=WordingResponse)
async def wording(payload: WordingRequest, request: Request, response: Response, session: Session = Depends(database_session)):
    response.headers["Cache-Control"] = "no-store"
    validate_catalog_selections(payload, session)
    canonical = RoadmapRequest.model_validate(payload.model_dump(exclude={"consent_to_ai"}))
    plan = generate_roadmap(load_career(payload.career_slug, session), canonical, list_resources(session), list_skills(session))
    return await enhance_wording(plan, payload, request.app.state.settings, request.app.state.ai_budget)
