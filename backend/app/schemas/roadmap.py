"""Phase 2 contracts: public resources and stateless, deterministic study plans."""

from datetime import date
from typing import Annotated, Literal

from pydantic import Field, HttpUrl, field_validator, model_validator

from app.schemas.api import CareerMatch, MatchFormula, MatchRequest, StrictModel

HalfHours = Annotated[float, Field(gt=0, multiple_of=0.5)]


class LearningResourceOutput(StrictModel):
    id: str = Field(min_length=1, max_length=80, pattern=r"^[a-z][a-z0-9_-]*$")
    title: str = Field(min_length=1, max_length=200)
    provider: str = Field(min_length=1, max_length=100)
    url: HttpUrl
    cost_inr: Annotated[float | None, Field(ge=0)]
    is_free: bool
    skill_ids: list[str] = Field(min_length=1, max_length=40)
    estimated_hours: Annotated[HalfHours, Field(le=200)]
    source_note: str = Field(min_length=1, max_length=1000)
    last_checked: date | None
    device_requirement: Literal["any", "computer"]

    @field_validator("url")
    @classmethod
    def public_https_link(cls, value: HttpUrl) -> HttpUrl:
        if value.scheme != "https" or value.username or value.password:
            raise ValueError("Resources must use HTTPS URLs without credentials")
        return value

    @model_validator(mode="after")
    def consistent_cost_and_skills(self) -> "LearningResourceOutput":
        if self.is_free and self.cost_inr not in {None, 0}:
            raise ValueError("Free resources cannot have a positive fee")
        if len(set(self.skill_ids)) != len(self.skill_ids):
            raise ValueError("Resource skill IDs must be unique")
        return self


class ResourceCatalog(StrictModel):
    resources: list[LearningResourceOutput]


class CareerMatchResponse(StrictModel):
    match: CareerMatch
    formula: MatchFormula
    notice: str


class RoadmapRequest(MatchRequest):
    career_slug: str = Field(min_length=1, max_length=80, pattern=r"^[a-z][a-z0-9-]*$")


class RoadmapTask(StrictModel):
    id: str
    skill_id: str
    skill_label: str
    title: str
    description: str
    activity: str
    verification: str
    estimated_hours: Annotated[HalfHours, Field(le=30)]
    resource: LearningResourceOutput | None
    mode: Literal["theory", "practical", "milestone"]
    device_requirement: Literal["any", "computer"]
    device_note: str
    alternative: str | None
    prerequisite_task_ids: list[str]
    part: Annotated[int, Field(ge=1)]
    total_parts: Annotated[int, Field(ge=1)]
    importance: Literal["essential", "optional", "prerequisite", "milestone"]

    @model_validator(mode="after")
    def valid_parts(self) -> "RoadmapTask":
        if self.part > self.total_parts:
            raise ValueError("Task part cannot exceed its total parts")
        return self


class RoadmapWeek(StrictModel):
    week_number: Annotated[int, Field(ge=1)]
    total_hours: Annotated[HalfHours, Field(le=30)]
    tasks: list[RoadmapTask] = Field(min_length=1)


class RoadmapResponse(StrictModel):
    id: str
    career_slug: str
    career_title: str
    selected_match: CareerMatch
    formula: MatchFormula
    generation_source: Literal["rules"] = "rules"
    hours_per_week: Annotated[int, Field(ge=1, le=30)]
    total_hours: HalfHours
    estimated_weeks: Annotated[int, Field(ge=1)]
    estimated_cost_inr: Annotated[float, Field(ge=0)]
    weeks: list[RoadmapWeek] = Field(min_length=1)
    warnings: list[str]
    assumptions: list[str]

    @model_validator(mode="after")
    def consistent_schedule(self) -> "RoadmapResponse":
        if self.estimated_weeks != len(self.weeks):
            raise ValueError("Estimated weeks must match the schedule")
        if sum(week.total_hours for week in self.weeks) != self.total_hours:
            raise ValueError("Plan total hours must match the schedule")
        seen = set()
        for number, week in enumerate(self.weeks, start=1):
            if week.week_number != number or week.total_hours > self.hours_per_week:
                raise ValueError("Weeks must be sequential and fit the available hours")
            if sum(task.estimated_hours for task in week.tasks) != week.total_hours:
                raise ValueError("Week total hours must match its task hours")
            for task in week.tasks:
                if task.id in seen or not set(task.prerequisite_task_ids).issubset(seen):
                    raise ValueError("Task IDs must be unique and dependencies must precede tasks")
                seen.add(task.id)
        return self
