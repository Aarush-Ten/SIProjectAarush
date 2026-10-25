import json
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from time import perf_counter

from fastapi import FastAPI, Request

from app.api.errors import JsonCORSMiddleware, install_error_handlers
from app.api.routes import router
from app.api.experts import router as experts_router
from app.api.phase3 import router as phase3_router
from app.services.ai_provider import ProviderBudget
from app.core.config import Settings, get_settings
from app.core.database import make_engine
from app.schemas.api import ErrorResponse

logger = logging.getLogger("pathforge")


def create_app(settings: Settings | None = None) -> FastAPI:
    configuration = settings or get_settings()
    logging.basicConfig(format="%(message)s")
    logger.setLevel(configuration.log_level)

    @asynccontextmanager
    async def lifespan(application: FastAPI) -> AsyncIterator[None]:
        application.state.engine = make_engine(configuration.database_url)
        yield
        application.state.engine.dispose()

    application = FastAPI(
        title="PathForge AI",
        version="0.1.0",
        description=(
            "Phases 1 and 2: stateless deterministic career exploration and weekly learning plans."
        ),
        lifespan=lifespan,
        responses={code: {"model": ErrorResponse} for code in [404, 405, 422, 500, 503]},
    )
    application.state.admin_token = configuration.admin_token
    application.state.settings = configuration
    application.state.ai_budget = ProviderBudget()
    application.add_middleware(
        JsonCORSMiddleware,
        allow_origins=configuration.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["Content-Type", "Authorization"],
    )
    install_error_handlers(application)
    application.include_router(router)
    application.include_router(experts_router)
    application.include_router(phase3_router)

    @application.middleware("http")
    async def log_request(request: Request, call_next):
        started = perf_counter()
        response = await call_next(request)
        route = request.scope.get("route")
        logger.info(
            json.dumps(
                {
                    "event": "request_complete",
                    "method": request.method,
                    "route": getattr(route, "path", "unmatched"),
                    "status": response.status_code,
                    "duration_ms": round((perf_counter() - started) * 1000, 2),
                }
            )
        )
        return response

    return application


app = create_app()
