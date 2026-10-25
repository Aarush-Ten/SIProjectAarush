from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import Career, CareerSkill, LearningResource, Skill
from app.schemas.api import CareerOutput, CareerSkillOutput, SkillOutput
from app.schemas.roadmap import LearningResourceOutput


def list_skills(session: Session) -> list[SkillOutput]:
    return [
        SkillOutput(
            id=skill.id,
            label_en=skill.label_en,
            label_mr=skill.label_mr,
            description=skill.description,
        )
        for skill in session.scalars(select(Skill).order_by(Skill.label_en))
    ]


def list_careers(session: Session) -> list[CareerOutput]:
    rows = session.scalars(
        select(Career)
        .options(selectinload(Career.skills).joinedload(CareerSkill.skill))
        .order_by(Career.slug)
    ).all()
    return [serialize_career(row) for row in rows]


def serialize_career(row: Career) -> CareerOutput:
    return CareerOutput(
        slug=row.slug,
        title=row.title,
        summary=row.summary,
        interest_tags=row.interest_tags,
        device_requirement=row.device_requirement,
        recommended_hours_per_week=row.recommended_hours_per_week,
        practice_budget_inr=row.practice_budget_inr,
        device_note=row.device_note,
        source_note=row.source_note,
        tasks=row.tasks,
        skills=[
            CareerSkillOutput(
                skill_id=skill.skill_id,
                label=skill.skill.label_en,
                required_level=skill.required_level,
                importance=skill.importance,
                weight=skill.weight,
            )
            for skill in row.skills
        ],
    )


def list_resources(session: Session) -> list[LearningResourceOutput]:
    rows = session.scalars(
        select(LearningResource)
        .options(selectinload(LearningResource.skills))
        .order_by(LearningResource.id)
    )
    return [
        LearningResourceOutput(
            id=row.id,
            title=row.title,
            provider=row.provider,
            url=row.url,
            cost_inr=row.cost_inr,
            is_free=row.is_free,
            skill_ids=[skill.skill_id for skill in row.skills],
            estimated_hours=row.estimated_hours,
            source_note=row.source_note,
            last_checked=row.last_checked,
            device_requirement=row.device_requirement,
        )
        for row in rows
    ]
