"""Shared rate-limiter instance used by main.py and all routers.

Keeping this in its own module avoids circular imports: routers can import
`limiter` here without pulling in the entire FastAPI app from main.py.
"""

import config
from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address


def get_client_ip(request: Request) -> str:
    """Rate-limiter key function.

    When TRUST_PROXY_HEADERS is True (production on PythonAnywhere) we read
    X-Forwarded-For so that per-IP limits apply to individual visitors rather
    than the shared gateway IP.  We take the *first* value in the header —
    PythonAnywhere's proxy prepends the real client IP, so index 0 is the
    original caller.  Falls back to the raw socket address in all other cases.
    """
    if config.TRUST_PROXY_HEADERS:
        forwarded_for = request.headers.get("x-forwarded-for", "")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
    return get_remote_address(request)


limiter = Limiter(key_func=get_client_ip, default_limits=["60/minute"])
