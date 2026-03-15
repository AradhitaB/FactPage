import config
from fastapi import APIRouter, HTTPException
from database import SessionLocal
from models import Session, Event
from seed_demo_data import seed as _seed

router = APIRouter(prefix="/api/dev", tags=["dev"])


def _require_dev() -> None:
    if config.ENVIRONMENT != "development":
        raise HTTPException(status_code=403, detail="Dev endpoints are disabled in production")


@router.post("/seed")
def load_demo():
    """Clear the DB and seed 500 synthetic sessions (dev only)."""
    _require_dev()
    _seed(n_sessions=500, clear=False, random_seed=42)
    return {"ok": True, "sessions": 500}


@router.post("/clear")
def clear_data():
    """Delete all sessions and events (dev only)."""
    _require_dev()
    db = SessionLocal()
    try:
        db.query(Event).delete()
        db.query(Session).delete()
        db.commit()
    finally:
        db.close()
    return {"ok": True}
