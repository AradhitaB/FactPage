import config
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session as DBSession
from database import get_db
from models import Demographics
from services.ab_service import get_session
from schemas import DemographicsRequest, DemographicsResponse
from limiter import limiter

router = APIRouter(prefix="/api", tags=["demographics"])

SESSION_COOKIE = config.SESSION_COOKIE


@router.get("/demographics", response_model=DemographicsResponse)
@limiter.limit("30/minute")
def get_demographics(request: Request, db: DBSession = Depends(get_db)):
    session_id = request.cookies.get(SESSION_COOKIE)
    if not session_id:
        raise HTTPException(status_code=403, detail="No session")

    session = get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=403, detail="Session not found")

    row = db.query(Demographics).filter(Demographics.session_id == session_id).first()
    if not row:
        return DemographicsResponse(submitted=False)
    return DemographicsResponse(
        submitted=True,
        age_range=row.age_range,
        technical_background=row.technical_background,
        prior_knowledge=row.prior_knowledge,
        device_type=row.device_type,
    )


@router.post("/demographics", response_model=DemographicsResponse)
@limiter.limit("10/minute")
def submit_demographics(
    body: DemographicsRequest,
    request: Request,
    db: DBSession = Depends(get_db),
):
    session_id = request.cookies.get(SESSION_COOKIE)
    if not session_id:
        raise HTTPException(status_code=403, detail="No session")

    session = get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=403, detail="Session not found")

    # Idempotent — one row per session
    existing = db.query(Demographics).filter(Demographics.session_id == session_id).first()
    if existing:
        return DemographicsResponse(
            submitted=True,
            age_range=existing.age_range,
            technical_background=existing.technical_background,
            prior_knowledge=existing.prior_knowledge,
            device_type=existing.device_type,
        )

    row = Demographics(
        session_id=session_id,
        age_range=body.age_range,
        technical_background=body.technical_background,
        prior_knowledge=body.prior_knowledge,
        device_type=body.device_type,
    )
    db.add(row)
    db.commit()
    return DemographicsResponse(
        submitted=True,
        age_range=row.age_range,
        technical_background=row.technical_background,
        prior_knowledge=row.prior_knowledge,
        device_type=row.device_type,
    )
