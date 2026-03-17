import secrets
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session as DBSession
from models import Session, Event, Variant

_VARIANTS = [Variant.A, Variant.B]
_SESSION_TTL_DAYS = 30


def assign_variants() -> tuple[Variant, Variant]:
    """Independently and randomly assign list and button variants (50/50 each)."""
    list_variant = secrets.choice(_VARIANTS)
    button_variant = secrets.choice(_VARIANTS)
    return list_variant, button_variant


def create_session(db: DBSession) -> Session:
    """Create a new session with independently assigned variants."""
    list_variant, button_variant = assign_variants()
    session = Session(list_variant=list_variant, button_variant=button_variant)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_session(db: DBSession, session_id: str) -> Session | None:
    return db.query(Session).filter(Session.id == session_id).first()


def cleanup_old_sessions(db: DBSession) -> int:
    """Delete sessions (and their events) older than _SESSION_TTL_DAYS. Returns count deleted."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=_SESSION_TTL_DAYS)
    old_session_ids = select(Session.id).where(Session.created_at < cutoff)
    db.query(Event).filter(Event.session_id.in_(old_session_ids)).delete(synchronize_session=False)
    deleted = db.query(Session).filter(Session.created_at < cutoff).delete(synchronize_session=False)
    db.commit()
    return deleted
