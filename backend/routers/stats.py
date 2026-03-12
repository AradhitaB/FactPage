from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DBSession
from database import get_db
from services.stats_service import get_stats
from schemas import RawStats, FullStats

router = APIRouter(prefix="/api", tags=["stats"])


@router.get("/stats", response_model=RawStats | FullStats)
def read_stats(db: DBSession = Depends(get_db)):
    return get_stats(db)
