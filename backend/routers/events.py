from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session as DBSession
from database import get_db
from models import Event, EventType
from services.ab_service import get_session
from schemas import EventRequest, EventResponse

router = APIRouter(prefix="/api", tags=["events"])

SESSION_COOKIE = "factpage_session"


@router.post("/events", response_model=EventResponse)
def record_event(
    body: EventRequest,
    request: Request,
    db: DBSession = Depends(get_db),
):
    # Validate session matches cookie
    cookie_session_id = request.cookies.get(SESSION_COOKIE)
    if cookie_session_id != body.session_id:
        raise HTTPException(status_code=403, detail="Session mismatch")

    session = get_session(db, body.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Idempotent — ignore duplicate events of the same type for this session
    already_recorded = (
        db.query(Event)
        .filter(Event.session_id == body.session_id)
        .filter(Event.event_type == body.event_type)
        .first()
    )
    if already_recorded:
        return EventResponse(ok=True)

    event = Event(session_id=body.session_id, event_type=body.event_type)
    db.add(event)
    db.commit()
    return EventResponse(ok=True)
