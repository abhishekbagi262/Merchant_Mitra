from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.schemas.dashboard import DashboardKPIsResponse
from app.services.analytics_service import get_dashboard_kpis

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("", response_model=DashboardKPIsResponse)
def get_dashboard_data(db: Session = Depends(get_db)):
    return get_dashboard_kpis(db, merchant_id=settings.DEMO_MERCHANT_ID)
