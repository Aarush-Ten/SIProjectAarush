from functools import lru_cache
import re
from typing import Literal
from urllib.parse import urlsplit

from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    database_url: str = "sqlite:///./pathforge.db"
    environment: Literal["development", "production"] = "development"
    allowed_hosts: list[str] = ["localhost", "127.0.0.1", "testserver"]
    expose_api_docs: bool = False
    max_request_bytes: int = Field(default=65536, ge=1024, le=262144)
    request_body_timeout_seconds: float = Field(default=10, ge=1, le=30)
    api_requests_per_minute: int = Field(default=600, ge=1, le=2000)
    admin_failures_per_minute: int = Field(default=20, ge=1, le=100)
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
        if value is not None:
            token = value.get_secret_value()
            if not re.fullmatch(r"[A-Za-z0-9._~+/-]{32,256}={0,2}", token) or len(set(token)) < 8:
                raise ValueError("ADMIN_TOKEN must be a random 32–256 character ASCII bearer token")
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

    @field_validator("allowed_hosts")
    @classmethod
    def explicit_hosts(cls, values):
        if not values or any(not re.fullmatch(r"[a-zA-Z0-9.-]+", value) or ".." in value for value in values):
            raise ValueError("ALLOWED_HOSTS must contain explicit hostnames without wildcards, ports or schemes")
        return values

    @model_validator(mode="after")
    def production_settings(self):
        if self.environment == "production":
            if any(not origin.startswith("https://") for origin in self.cors_origins):
                raise ValueError("Production CORS origins must use HTTPS")
            if any(host in {"localhost", "127.0.0.1", "testserver"} for host in self.allowed_hosts):
                raise ValueError("Configure explicit production ALLOWED_HOSTS")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
