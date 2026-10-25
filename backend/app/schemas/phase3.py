import re
from typing import Annotated, Literal

from pydantic import Field, StrictInt, field_validator

from app.schemas.api import StrictModel
from app.schemas.roadmap import RoadmapRequest


class Answer(StrictModel):
    question_id: str = Field(min_length=1, max_length=80)
    option_id: str = Field(pattern=r"^[a-d]$")


class GradeRequest(StrictModel):
    answers: list[Answer] = Field(min_length=5, max_length=5)


class Option(StrictModel):
    id: str
    text: str


class Question(StrictModel):
    id: str
    prompt: str
    options: list[Option]


class AssessmentInfo(StrictModel):
    slug: str
    title: str
    skill_id: str
    question_count: int
    version: Literal[1] = 1


class Assessment(AssessmentInfo):
    questions: list[Question]
    notice: str


class QuestionFeedback(StrictModel):
    question_id: str
    selected_option_id: str
    correct_option_id: str
    correct: bool
    explanation: str


class GradeResult(StrictModel):
    slug: str
    title: str
    version: Literal[1] = 1
    score: Annotated[StrictInt, Field(ge=0, le=5)]
    total: Literal[5] = 5
    passed: bool
    badge: Literal["quiz-completed"] | None
    feedback: list[QuestionFeedback]
    notice: str


class WordingRequest(RoadmapRequest):
    consent_to_ai: bool = Field(default=False, strict=True)


class TaskWording(StrictModel):
    task_id: str = Field(min_length=1, max_length=150)
    resource_id: str | None = Field(max_length=80)
    wording: str = Field(min_length=1, max_length=400)

    @field_validator("wording")
    @classmethod
    def plain_wording(cls, value):
        return safe_prose(value)


def safe_prose(value: str) -> str:
    if re.search(r"https?://|www\.|[<>]|\b(?:guaranteed|salary|placement)\b", value, re.I) or any(ord(c) < 32 for c in value):
        raise ValueError("Only plain advisory wording without links or unsupported outcome claims is allowed")
    return value


class GeneratedWording(StrictModel):
    explanation: str = Field(min_length=1, max_length=600)
    tasks: list[TaskWording] = Field(max_length=6)

    @field_validator("explanation")
    @classmethod
    def plain_explanation(cls, value):
        return safe_prose(value)


class WordingResponse(GeneratedWording):
    source: Literal["rules", "llm"]
    reason: Literal["not_requested", "not_configured", "rate_limited", "provider_unavailable", "validated"]
    language: Literal["en"] = "en"
    notice: str
