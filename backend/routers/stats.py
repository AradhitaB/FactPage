import config
from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session as DBSession
from database import get_db
from services.ab_service import get_session
from services.stats_service import get_stats
from schemas import StatsResponse

router = APIRouter(prefix="/api", tags=["stats"])
limiter = Limiter(key_func=get_remote_address)

SESSION_COOKIE = config.SESSION_COOKIE


@router.get("/stats", response_model=StatsResponse)
@limiter.limit("60/minute")
def read_stats(request: Request, db: DBSession = Depends(get_db)):
    session_id = request.cookies.get(SESSION_COOKIE) or request.headers.get("X-Session-Id")
    if not session_id or not get_session(db, session_id):
        raise HTTPException(status_code=403, detail="Valid session required")
    return get_stats(db)
