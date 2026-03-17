import config
from fastapi import APIRouter, Request
from database import SessionLocal
from models import Session, Event, Demographics
from seed_demo_data import seed as _seed

router = APIRouter(prefix="/api/dev", tags=["demo"])
SESSION_COOKIE = config.SESSION_COOKIE


@router.post("/seed")
def load_demo():
    """Add synthetic demo sessions without touching real data."""
    _seed(n_sessions=600, clear=False, random_seed=42)
    return {"ok": True, "sessions": 600}


@router.post("/clear")
def clear_demo_data():
    """Delete only synthetic/demo sessions. Real sessions and data are untouched."""
    db = SessionLocal()
    try:
        synthetic_ids = [
            row.id for row in db.query(Session.id).filter(Session.is_synthetic.is_(True)).all()
        ]
        if synthetic_ids:
            db.query(Demographics).filter(Demographics.session_id.in_(synthetic_ids)).delete(synchronize_session=False)
            db.query(Event).filter(Event.session_id.in_(synthetic_ids)).delete(synchronize_session=False)
            db.query(Session).filter(Session.id.in_(synthetic_ids)).delete(synchronize_session=False)
            db.commit()
    finally:
        db.close()
    return {"ok": True}


@router.post("/reset-survey")
def reset_survey(request: Request):
    """Delete the demographics record for the current session so the survey shows again."""
    session_id = request.cookies.get(SESSION_COOKIE)
    if not session_id:
        return {"ok": False, "reason": "no session"}
    db = SessionLocal()
    try:
        db.query(Demographics).filter(Demographics.session_id == session_id).delete()
        db.commit()
    finally:
        db.close()
    return {"ok": True}
