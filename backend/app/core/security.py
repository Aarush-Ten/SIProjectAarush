"""Small, explicit HTTP boundary controls; edge limits are still required."""
import asyncio
from collections import deque
import json
import logging
from threading import Lock
from time import monotonic

from app.api.errors import error_response

logger = logging.getLogger("pathforge")


class RequestBudget:
    def __init__(self):
        self.events = deque()
        self.lock = Lock()

    def acquire(self, limit):
        now = monotonic()
        with self.lock:
            while self.events and self.events[0] <= now - 60:
                self.events.popleft()
            if len(self.events) >= limit:
                return False
            self.events.append(now)
            return True


class SecurityMiddleware:
    def __init__(self, app, settings):
        self.app = app
        self.settings = settings
        self.requests = RequestBudget()

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        response_started = False
        response_finished = False

        async def secure_send(message):
            nonlocal response_started, response_finished
            if message["type"] == "http.response.start":
                response_started = True
                headers = list(message.get("headers", []))
                headers.extend([
                    (b"x-content-type-options", b"nosniff"),
                    (b"x-frame-options", b"DENY"),
                    (b"referrer-policy", b"no-referrer"),
                    (b"permissions-policy", b"camera=(), microphone=(), geolocation=()"),
                ])
                if scope["path"].startswith("/api/"):
                    headers = [(key, value) for key, value in headers if key.lower() != b"cache-control"]
                    headers.append((b"cache-control", b"no-store"))
                    headers.append((b"content-security-policy", b"default-src 'none'; frame-ancestors 'none'; base-uri 'none'"))
                if self.settings.environment == "production":
                    headers.append((b"strict-transport-security", b"max-age=31536000"))
                message = {**message, "headers": headers}
            if message["type"] == "http.response.body" and not message.get("more_body", False):
                response_finished = True
            await send(message)

        async def reject(status, code, message):
            logger.warning(json.dumps({"event": "security_rejection", "status": status, "code": code}))
            response = error_response(status, code, message, headers={"Retry-After": "60"} if status == 429 else None)
            await response(scope, receive, secure_send)

        raw_headers = scope.get("headers", [])
        headers = {key.lower(): value for key, value in raw_headers}
        for name in (b"authorization", b"content-length", b"origin", b"host"):
            if sum(key.lower() == name for key, _ in raw_headers) > 1:
                return await reject(400, "ambiguous_headers", "Duplicate security-sensitive headers are not allowed")
        if b"content-length" in headers:
            try:
                size = int(headers[b"content-length"])
                if size < 0:
                    raise ValueError
            except ValueError:
                return await reject(400, "invalid_length", "Invalid content length")
            if size > self.settings.max_request_bytes:
                return await reject(413, "request_too_large", "Request exceeds the allowed size")
        if headers.get(b"content-encoding", b"identity").lower() != b"identity":
            return await reject(415, "unsupported_encoding", "Compressed request bodies are not supported")
        if len(headers.get(b"authorization", b"")) > 300:
            return await reject(401, "invalid_credentials", "Administrator credentials required")
        if scope["path"].startswith("/api/v1/") and scope["path"] != "/api/v1/health" and scope["method"] != "OPTIONS":
            if not self.requests.acquire(self.settings.api_requests_per_minute):
                return await reject(429, "rate_limited", "Request limit reached; try again later")
        body = bytearray()
        try:
            async with asyncio.timeout(self.settings.request_body_timeout_seconds):
                while True:
                    message = await receive()
                    if message["type"] == "http.disconnect":
                        return
                    body.extend(message.get("body", b""))
                    if len(body) > self.settings.max_request_bytes:
                        return await reject(413, "request_too_large", "Request exceeds the allowed size")
                    if not message.get("more_body", False):
                        break
        except TimeoutError:
            return await reject(408, "request_timeout", "Request body took too long")
        if body and scope["method"] in {"POST", "PUT", "PATCH", "DELETE"}:
            media_type = headers.get(b"content-type", b"").split(b";", 1)[0].strip().lower()
            if media_type != b"application/json":
                return await reject(415, "unsupported_media_type", "Send JSON using application/json")
        delivered = False

        async def replay():
            nonlocal delivered
            if not delivered:
                delivered = True
                return {"type": "http.request", "body": bytes(body), "more_body": False}
            return await receive()

        try:
            await self.app(scope, replay, secure_send)
        except Exception:
            logger.error(json.dumps({"event": "internal_error"}))
            if response_started:
                if not response_finished:
                    await secure_send({"type": "http.response.body", "body": b"", "more_body": False})
                return
            await error_response(500, "internal_error", "Unable to complete this request")(scope, replay, secure_send)
