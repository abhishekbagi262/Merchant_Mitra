from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.merchant import Merchant
from app.schemas.settings import MerchantSettingsResponse, MerchantSettingsUpdate
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("", response_model=MerchantSettingsResponse)
def get_merchant_settings(db: Session = Depends(get_db)):
    m = db.query(Merchant).filter(Merchant.id == settings.DEMO_MERCHANT_ID).first()
    if not m:
        m = Merchant(
            id=settings.DEMO_MERCHANT_ID,
            name=settings.DEMO_MERCHANT_NAME,
            business_name=settings.DEMO_BUSINESS_NAME,
            location=settings.DEMO_LOCATION,
            currency=settings.DEMO_CURRENCY,
            timezone=settings.DEMO_TIMEZONE
        )
        db.add(m)
        db.commit()
        db.refresh(m)
    return m

@router.put("", response_model=MerchantSettingsResponse)
def update_merchant_settings(payload: MerchantSettingsUpdate, db: Session = Depends(get_db)):
    m = db.query(Merchant).filter(Merchant.id == settings.DEMO_MERCHANT_ID).first()
    if not m:
        raise HTTPException(status_code=404, detail="Merchant not found")

    m.name = payload.name
    m.business_name = payload.business_name
    m.location = payload.location
    m.currency = payload.currency
    m.timezone = payload.timezone
    m.preferred_language = payload.preferred_language
    m.voice_enabled = payload.voice_enabled
    m.auto_login_greeting = payload.auto_login_greeting
    m.voice_responses = payload.voice_responses
    m.preferred_speech_lang = payload.preferred_speech_lang
    m.notify_purchases = payload.notify_purchases
    m.notify_low_stock = payload.notify_low_stock
    m.notify_profit_decline = payload.notify_profit_decline
    m.profit_decline_threshold_pct = payload.profit_decline_threshold_pct
    db.commit()
    db.refresh(m)

    log_audit_event(
        db=db,
        merchant_id=m.id,
        action="SETTINGS_CHANGED",
        entity_type="SETTINGS",
        entity_id=str(m.id),
        description=f"Updated profile: Name='{m.name}', Store='{m.business_name}', Location='{m.location}'."
    )
    return m

@router.post("/reset-demo-data")
def reset_demo_data_endpoint(db: Session = Depends(get_db)):
    from app.seed_data import seed_database
    seed_database(db=db, force_reset=True)
    return {"message": "Demo database successfully reset and re-seeded with realistic retail data."}
