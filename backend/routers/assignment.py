from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session as DBSession
from database import get_db
from services.ab_service import create_session, get_session
from schemas import AssignmentResponse

router = APIRouter(prefix="/api", tags=["assignment"])

SESSION_COOKIE = "factpage_session"
COOKIE_MAX_AGE = 60 * 60 * 24 * 30  # 30 days


@router.get("/assignment", response_model=AssignmentResponse)
def get_or_create_assignment(
    request: Request,
    response: Response,
    db: DBSession = Depends(get_db),
):
    session_id = request.cookies.get(SESSION_COOKIE)

    if session_id:
        session = get_session(db, session_id)
        if session:
            return AssignmentResponse(
                session_id=session.id,
                list_variant=session.list_variant,
                button_variant=session.button_variant,
            )

    # No valid session — create one
    session = create_session(db)
    response.set_cookie(
        key=SESSION_COOKIE,
        value=session.id,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=False,  # set to True in production behind HTTPS
    )
    return AssignmentResponse(
        session_id=session.id,
        list_variant=session.list_variant,
        button_variant=session.button_variant,
    )
