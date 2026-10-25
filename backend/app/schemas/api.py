from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StrictInt, field_validator, model_validator

Education = Literal["school", "iti", "diploma", "undergraduate", "other"]
Goal = Literal["internship", "first_job", "career_exploration", "upskilling"]
Device = Literal["smartphone_only", "laptop", "shared_computer"]
Importance = Literal["essential", "optional"]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False, str_strip_whitespace=True)


class ProfileSnapshot(StrictModel):
    education_level: Education
    study_field: str = Field(min_length=1, max_length=100)
    goal: Goal
    hours_per_week: Annotated[StrictInt, Field(ge=1, le=30)]
    budget_inr: float = Field(ge=0, le=1_000_000, strict=True)
    device_access: Device
    language: Literal["en", "mr"]

    @field_validator("study_field")
    @classmethod
    def readable_text(cls, value: str) -> str:
        if any(ord(character) < 32 for character in value):
            raise ValueError("Study field must not include control characters")
        return value


class ProfileSkillInput(StrictModel):
    skill_id: str = Field(min_length=1, max_length=80, pattern=r"^[a-z][a-z0-9_]*$")
    self_reported_level: Annotated[StrictInt, Field(ge=0, le=3)]


class MatchRequest(StrictModel):
    profile: ProfileSnapshot
    skills: list[ProfileSkillInput] = Field(max_length=40)
    interests: list[str] = Field(max_length=12)

    @model_validator(mode="after")
    def unique_selections(self) -> "MatchRequest":
        ids = [skill.skill_id for skill in self.skills]
        if len(ids) != len(set(ids)):
            raise ValueError("Each skill can appear only once")
        if len(self.interests) != len(set(self.interests)):
            raise ValueError("Each interest can appear only once")
        return self


class SkillOutput(StrictModel):
    id: str
    label_en: str
    label_mr: str | None = None
    description: str


class InterestOutput(StrictModel):
    id: str
    label: str


class SkillCatalog(StrictModel):
    skills: list[SkillOutput]
    interests: list[InterestOutput]


class CareerSkillOutput(StrictModel):
    skill_id: str
    label: str
    required_level: Annotated[int, Field(ge=1, le=3)]
    importance: Importance
    weight: Annotated[int, Field(ge=1, le=5)]


class CareerOutput(StrictModel):
    slug: str
    title: str
    summary: str
    interest_tags: list[str] = Field(min_length=1)
    device_requirement: Literal["computer", "any"]
    recommended_hours_per_week: Annotated[int, Field(ge=1, le=30)]
    practice_budget_inr: Annotated[int, Field(ge=0)]
    device_note: str
    source_note: Literal["curated_demo"]
    tasks: list[str]
    skills: list[CareerSkillOutput]

    @model_validator(mode="after")
    def valid_essentials(self) -> "CareerOutput":
        if not any(skill.importance == "essential" for skill in self.skills):
            raise ValueError("A career must have essential skills")
        if len({skill.skill_id for skill in self.skills}) != len(self.skills):
            raise ValueError("Career skills must be unique")
        return self


class CareerCatalog(StrictModel):
    careers: list[CareerOutput]


class GapOutput(StrictModel):
    skill_id: str
    label: str
    user_level: int
    required_level: int
    missing_level: int
    importance: Importance


class FeasibilityComponent(StrictModel):
    factor: Literal["schedule", "device", "budget"]
    score: float
    weight: float
    reason: str


class FeasibilityOutput(StrictModel):
    score: float
    components: list[FeasibilityComponent]
    warnings: list[str]


class CareerMatch(StrictModel):
    career: CareerOutput
    coverage: float
    interest_match: float
    interest_status: Literal["matched", "unknown"]
    feasibility: FeasibilityOutput
    fit_score: float
    missing_skills: list[GapOutput]
    reasons: list[str]


class MatchFormula(StrictModel):
    coverage_weight: float = 0.60
    interest_weight: float = 0.25
    feasibility_weight: float = 0.15


class MatchResponse(StrictModel):
    matches: list[CareerMatch]
    total_careers_evaluated: int
    formula: MatchFormula = Field(default_factory=MatchFormula)
    notice: str


class ErrorDetail(StrictModel):
    location: str
    message: str
    type: str


class ErrorBody(StrictModel):
    code: str
    message: str
    details: list[ErrorDetail] = Field(default_factory=list)


class ErrorResponse(StrictModel):
    error: ErrorBody
