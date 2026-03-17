import config
from fastapi import APIRouter, Depends, Request, Response
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session as DBSession
from database import get_db
from services.ab_service import create_session, get_session
from schemas import AssignmentResponse

router = APIRouter(prefix="/api", tags=["assignment"])
limiter = Limiter(key_func=get_remote_address)

SESSION_COOKIE = config.SESSION_COOKIE
COOKIE_MAX_AGE = 60 * 60 * 24 * 7  # 7 days


@router.get("/assignment", response_model=AssignmentResponse)
@limiter.limit("30/minute")
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
    is_prod = config.ENVIRONMENT == "production"
    response.set_cookie(
        key=SESSION_COOKIE,
        value=session.id,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite="none" if is_prod else "lax",  # cross-origin fetch requires SameSite=None
        secure=is_prod,  # Secure is required when SameSite=None
    )
    return AssignmentResponse(
        session_id=session.id,
        list_variant=session.list_variant,
        button_variant=session.button_variant,
    )
