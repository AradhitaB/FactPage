import config
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session as DBSession
from database import get_db
from services.ab_service import get_session
from services.stats_service import get_stats
from schemas import RawStats, FullStats

router = APIRouter(prefix="/api", tags=["stats"])

SESSION_COOKIE = config.SESSION_COOKIE


@router.get("/stats", response_model=RawStats | FullStats)
def read_stats(request: Request, db: DBSession = Depends(get_db)):
    session_id = request.cookies.get(SESSION_COOKIE)
    if not session_id or not get_session(db, session_id):
        raise HTTPException(status_code=403, detail="Valid session required")
    return get_stats(db)
