from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.schemas.analytics import ComprehensiveAnalyticsResponse
from app.services.analytics_service import get_comprehensive_analytics

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("", response_model=ComprehensiveAnalyticsResponse)
def get_analytics(db: Session = Depends(get_db)):
    return get_comprehensive_analytics(db, merchant_id=settings.DEMO_MERCHANT_ID)
