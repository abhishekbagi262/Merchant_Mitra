from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.schemas.brief import DailyBriefResponse
from app.services.ai_service import generate_daily_brief

router = APIRouter(prefix="/api/brief", tags=["brief"])

@router.get("", response_model=DailyBriefResponse)
def get_brief(language: str = Query("en", description="en, hi, kn"), db: Session = Depends(get_db)):
    return generate_daily_brief(db, merchant_id=settings.DEMO_MERCHANT_ID, language=language)
