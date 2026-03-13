import os
from urllib.parse import urlparse
from dotenv import load_dotenv

# Load .env before any other module reads os.getenv
load_dotenv()

ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
if ENVIRONMENT not in ("development", "production"):
    raise ValueError(f"ENVIRONMENT must be 'development' or 'production', got: {ENVIRONMENT!r}")

FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
_parsed = urlparse(FRONTEND_URL)
if _parsed.scheme not in ("http", "https") or not _parsed.netloc:
    raise ValueError(f"FRONTEND_URL must be a valid http/https URL, got: {FRONTEND_URL!r}")

ALPHA: float = float(os.getenv("ALPHA", "0.05"))
if not (0 < ALPHA < 1):
    raise ValueError(f"ALPHA must be in (0, 1), got: {ALPHA}")

POWER: float = float(os.getenv("POWER", "0.80"))
if not (0 < POWER < 1):
    raise ValueError(f"POWER must be in (0, 1), got: {POWER}")

MDE: float = float(os.getenv("MDE", "0.10"))
if not (0 < MDE < 1):
    raise ValueError(f"MDE must be in (0, 1), got: {MDE}")

BASELINE_CONVERSION: float = float(os.getenv("BASELINE_CONVERSION", "0.50"))
if not (0 < BASELINE_CONVERSION < 1):
    raise ValueError(f"BASELINE_CONVERSION must be in (0, 1), got: {BASELINE_CONVERSION}")

# Extra allowed CORS origins — comma-separated, for local network dev (e.g. testing on a phone)
# Example: EXTRA_ORIGINS=http://192.168.1.154:3000
EXTRA_ORIGINS: list[str] = [
    o.strip() for o in os.getenv("EXTRA_ORIGINS", "").split(",") if o.strip()
]

# Shared cookie name — single source of truth for all routers
SESSION_COOKIE: str = "factpage_session"
