from secrets import compare_digest
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.routes import database_session
from app.models.experts import Expert
from app.schemas.experts import ExpertInput, ExpertOutput, PublicExpert

router = APIRouter(prefix="/api/v1", tags=["experts"])
bearer = HTTPBearer(auto_error=False)


def administrator(request: Request, response: Response, credentials: HTTPAuthorizationCredentials | None = Depends(bearer)):
    response.headers["Cache-Control"] = "no-store"
    secret = request.app.state.admin_token
    if secret is None:
        raise HTTPException(503, "Expert administration is not configured")
    if credentials is None or not compare_digest(credentials.credentials.encode(), secret.get_secret_value().encode()):
        raise HTTPException(401, "Administrator credentials required", headers={"WWW-Authenticate": "Bearer"})


@router.get("/admin/experts", response_model=list[ExpertOutput], dependencies=[Depends(administrator)])
def list_experts(session: Session = Depends(database_session)):
    return session.scalars(select(Expert).order_by(Expert.name, Expert.id)).all()


@router.post("/admin/experts", response_model=ExpertOutput, status_code=201, dependencies=[Depends(administrator)])
def add_expert(payload: ExpertInput, session: Session = Depends(database_session)):
    expert = Expert(id=str(uuid4()), **payload.model_dump())
    session.add(expert)
    session.commit()
    return expert


@router.put("/admin/experts/{expert_id}", response_model=ExpertOutput, dependencies=[Depends(administrator)])
def edit_expert(expert_id: str, payload: ExpertInput, session: Session = Depends(database_session)):
    expert = session.get(Expert, expert_id)
    if expert is None:
        raise HTTPException(404, "Expert not found")
    for name, value in payload.model_dump().items():
        setattr(expert, name, value)
    session.commit()
    return expert


@router.delete("/admin/experts/{expert_id}", status_code=204, dependencies=[Depends(administrator)])
def remove_expert(expert_id: str, session: Session = Depends(database_session)):
    expert = session.get(Expert, expert_id)
    if expert is None:
        raise HTTPException(404, "Expert not found")
    session.delete(expert)
    session.commit()
    return Response(status_code=204, headers={"Cache-Control": "no-store"})


@router.get("/experts", response_model=list[PublicExpert])
def public_experts(response: Response, session: Session = Depends(database_session)):
    response.headers["Cache-Control"] = "no-store"
    rows = session.scalars(select(Expert).where(
        Expert.active.is_(True), Expert.public_visible.is_(True),
        Expert.verified.is_(True), Expert.approved.is_(True),
    ).order_by(Expert.name, Expert.id)).all()
    return [PublicExpert(
        id=row.id, name=row.name, bio=row.bio, expertise=row.expertise,
        contact=row.contact if row.public_contact and not row.is_demo else None,
        availability=row.availability if not row.is_demo else "Demo only — no real consultations",
        is_demo=row.is_demo,
        consultation_available=bool(row.availability.strip()) and not row.is_demo,
    ) for row in rows]
