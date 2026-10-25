from functools import lru_cache
from typing import Literal
from urllib.parse import urlsplit

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    database_url: str = "sqlite:///./pathforge.db"
    admin_token: SecretStr | None = None
    ai_provider: Literal["none", "gemini"] = "none"
    ai_api_key: SecretStr | None = None
    ai_model: str = Field(default="", max_length=100, pattern=r"^[a-zA-Z0-9._-]*$")
    ai_timeout_seconds: float = Field(default=8, ge=1, le=15)
    ai_requests_per_minute: int = Field(default=5, ge=1, le=20)
    ai_requests_per_day: int = Field(default=100, ge=1, le=500)

    @field_validator("admin_token")
    @classmethod
    def strong_admin_token(cls, value):
        if value is not None and len(value.get_secret_value()) < 32:
            raise ValueError("ADMIN_TOKEN must contain at least 32 characters")
        return value
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"

    @field_validator("cors_origins")
    @classmethod
    def explicit_origins(cls, values: list[str]) -> list[str]:
        for value in values:
            parsed = urlsplit(value)
            if (
                parsed.scheme not in {"http", "https"}
                or not parsed.netloc
                or parsed.path
                or parsed.query
                or parsed.fragment
                or parsed.username
                or parsed.password
                or "*" in value
            ):
                raise ValueError("CORS origins must be explicit HTTP(S) origins without paths")
        return values


@lru_cache
def get_settings() -> Settings:
    return Settings()
