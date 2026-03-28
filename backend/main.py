from contextlib import asynccontextmanager
import config  # must be first — loads .env before any other module reads os.getenv
import logging
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from sqlalchemy import text
from database import engine, Base, SessionLocal
from routers import assignment, demographics, events, stats
from services.ab_service import cleanup_old_sessions

logging.basicConfig(
    level=logging.DEBUG if config.ENVIRONMENT == "development" else logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("factpage")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        ms = (time.perf_counter() - start) * 1000
        logger.info("%s %s %d %.1fms", request.method, request.url.path, response.status_code, ms)
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if config.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    # Schema migration: add is_synthetic column if it doesn't exist yet (existing DBs)
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE sessions ADD COLUMN is_synthetic BOOLEAN NOT NULL DEFAULT 0"))
            conn.commit()
            logger.info("Schema migration: added is_synthetic column to sessions")
        except Exception:
            pass  # column already exists

    db = SessionLocal()
    try:
        deleted = cleanup_old_sessions(db)
        if deleted:
            logger.info("Startup cleanup: removed %d expired session(s)", deleted)
    finally:
        db.close()
    logger.info("FactPage API started (environment=%s, frontend=%s)", config.ENVIRONMENT, config.FRONTEND_URL)
    yield
    logger.info("FactPage API shutting down")


limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

app = FastAPI(
    title="FactPage A/B API",
    docs_url="/docs" if config.ENVIRONMENT == "development" else None,
    redoc_url=None,
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.FRONTEND_URL, *config.EXTRA_ORIGINS],
    allow_credentials=True,  # required for cookies
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Session-Id"],
)

app.include_router(assignment.router)
app.include_router(demographics.router)
app.include_router(events.router)
app.include_router(stats.router)

if config.ENVIRONMENT == "development":
    from routers import dev  # noqa: PLC0415
    app.include_router(dev.router)


@app.get("/health")
def health():
    return {"status": "ok"}
