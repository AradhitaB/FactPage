import secrets
from sqlalchemy.orm import Session as DBSession
from models import Session, Variant

_VARIANTS = [Variant.A, Variant.B]


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
