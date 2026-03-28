from contextlib import asynccontextmanager
import config  # must be first — loads .env before any other module reads os.getenv
import logging
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from limiter import limiter
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


_SAFE_METHODS = frozenset({"GET", "HEAD", "OPTIONS"})
_ALLOWED_ORIGINS: frozenset[str] | None = None


def _get_allowed_origins() -> frozenset[str]:
    """Build once after config is loaded."""
    global _ALLOWED_ORIGINS
    if _ALLOWED_ORIGINS is None:
        _ALLOWED_ORIGINS = frozenset({config.FRONTEND_URL, *config.EXTRA_ORIGINS})
    return _ALLOWED_ORIGINS


class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """Reject state-mutating requests whose Origin is set but not in the allow-list.

    Browsers always send Origin on cross-origin requests, so this blocks CSRF
    from third-party pages while leaving same-origin and server-side calls
    (which omit Origin) unaffected.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.method not in _SAFE_METHODS:
            origin = request.headers.get("origin")
            if origin is not None and origin not in _get_allowed_origins():
                logger.warning("CSRF block: origin=%r method=%s path=%s", origin, request.method, request.url.path)
                return Response(
                    content='{"detail":"Forbidden"}',
                    status_code=403,
                    media_type="application/json",
                )
        return await call_next(request)


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
app.add_middleware(CSRFProtectionMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.FRONTEND_URL, *config.EXTRA_ORIGINS],
    allow_credentials=True,  # required for cookies
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
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
