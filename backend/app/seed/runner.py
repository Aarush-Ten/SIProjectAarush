from sqlalchemy.orm import Session

from app.models import Career, CareerSkill, LearningResource, LearningResourceSkill, Skill
from app.seed.catalog import CAREERS, SKILLS
from app.seed.resources import RESOURCES


def seed_catalog(session: Session) -> None:
    """Upsert known demo records in one transaction; safe to run repeatedly."""
    for item in SKILLS:
        existing = session.get(Skill, item.id)
        if existing is None:
            session.add(Skill(**item.model_dump()))
        else:
            for key, value in item.model_dump().items():
                setattr(existing, key, value)
    session.flush()
    for item in CAREERS:
        row = session.get(Career, item.slug)
        attributes = item.model_dump(exclude={"skills"})
        if row is None:
            row = Career(**attributes)
            session.add(row)
        else:
            for key, value in attributes.items():
                setattr(row, key, value)
            row.skills.clear()
            session.flush()
        row.skills = [CareerSkill(**skill.model_dump(exclude={"label"})) for skill in item.skills]
    session.flush()
    for item in RESOURCES:
        attributes = item.model_dump(exclude={"skill_ids"})
        attributes["url"] = str(item.url)
        resource = session.get(LearningResource, item.id)
        if resource is None:
            resource = LearningResource(**attributes)
            session.add(resource)
        else:
            for key, value in attributes.items():
                setattr(resource, key, value)
            resource.skills.clear()
            session.flush()
        resource.skills = [LearningResourceSkill(skill_id=skill_id) for skill_id in item.skill_ids]
    session.commit()
