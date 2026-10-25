import json
import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.datastructures import Headers
from starlette.exceptions import HTTPException
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import Response

from app.schemas.api import ErrorBody, ErrorDetail, ErrorResponse

logger = logging.getLogger("pathforge")


def error_response(
    status: int, code: str, message: str, details=None, headers=None
) -> JSONResponse:
    error = ErrorResponse(error=ErrorBody(code=code, message=message, details=details or []))
    return JSONResponse(status_code=status, content=error.model_dump(), headers=headers)


class JsonCORSMiddleware(CORSMiddleware):
    def preflight_response(self, request_headers: Headers) -> Response:
        response = super().preflight_response(request_headers)
        if response.status_code >= 400:
            headers = {
                key: value
                for key, value in response.headers.items()
                if key.lower() not in {"content-type", "content-length"}
            }
            return error_response(
                400, "cors_error", "Origin, method or headers are not allowed", headers=headers
            )
        return response


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def validation_error(_request: Request, exc: RequestValidationError):
        # Deliberately omit Pydantic's input/context, which can contain profile data.
        details = [
            ErrorDetail(
                location=".".join(str(part) for part in item["loc"]),
                message=item["msg"],
                type=item["type"],
            )
            for item in exc.errors()
        ]
        return error_response(422, "validation_error", "Check the submitted profile", details)

    @app.exception_handler(HTTPException)
    async def http_error(_request: Request, exc: HTTPException):
        codes = {
            404: "not_found",
            405: "method_not_allowed",
            422: "validation_error",
            503: "catalog_unavailable",
        }
        return error_response(
            exc.status_code,
            codes.get(exc.status_code, "request_error"),
            str(exc.detail),
            headers=exc.headers,
        )

    @app.exception_handler(Exception)
    async def internal_error(_request: Request, _exc: Exception):
        # Avoid exception representations/tracebacks that could include request payloads.
        logger.error(json.dumps({"event": "internal_error"}))
        return error_response(500, "internal_error", "Unable to complete this request")
