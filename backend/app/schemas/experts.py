from pydantic import BaseModel, ConfigDict, Field, field_validator


class ExpertInput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True, strict=True)

    name: str = Field(min_length=2, max_length=100)
    bio: str = Field(default="", max_length=2000)
    expertise: list[str] = Field(min_length=1, max_length=12)
    contact: str | None = Field(default=None, max_length=250)
    availability: str = Field(default="", max_length=300)
    verified: bool = False
    approved: bool = False
    active: bool = True
    public_visible: bool = False
    public_contact: bool = False
    is_demo: bool = False

    @field_validator("expertise")
    @classmethod
    def validate_expertise(cls, values):
        cleaned = [value.strip() for value in values]
        if any(not value or len(value) > 80 for value in cleaned):
            raise ValueError("Provide 1–12 nonempty expertise areas, each at most 80 characters")
        if len({value.casefold() for value in cleaned}) != len(cleaned):
            raise ValueError("Expertise areas must be unique")
        return cleaned

    @field_validator("name", "bio", "contact", "availability")
    @classmethod
    def plain_text(cls, value):
        if value is not None and any(ord(char) < 32 and char not in "\n\t" for char in value):
            raise ValueError("Control characters are not allowed")
        return value


class ExpertOutput(ExpertInput):
    model_config = ConfigDict(from_attributes=True)
    id: str


class PublicExpert(BaseModel):
    id: str
    name: str
    bio: str
    expertise: list[str]
    contact: str | None
    availability: str
    is_demo: bool
    consultation_available: bool
