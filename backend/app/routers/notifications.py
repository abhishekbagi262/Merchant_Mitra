from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.schemas.notification import NotificationListResponse, NotificationResponse
from app.services.notification_service import (
    get_merchant_notifications,
    mark_notification_read,
    mark_all_notifications_read,
    check_and_create_stock_notifications,
    check_profit_decline_notification
)

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

@router.get("", response_model=NotificationListResponse)
def list_notifications(
    limit: int = Query(default=30, ge=1, le=100),
    unread_only: bool = Query(default=False),
    db: Session = Depends(get_db)
):
    # Proactively check periodic alerts (stock, profit decline)
    check_and_create_stock_notifications(db, settings.DEMO_MERCHANT_ID)
    check_profit_decline_notification(db, settings.DEMO_MERCHANT_ID)

    result = get_merchant_notifications(
        db=db,
        merchant_id=settings.DEMO_MERCHANT_ID,
        limit=limit,
        unread_only=unread_only
    )
    return result

@router.put("/{notification_id}/read")
def mark_read(notification_id: int, db: Session = Depends(get_db)):
    success = mark_notification_read(
        db=db,
        notification_id=notification_id,
        merchant_id=settings.DEMO_MERCHANT_ID
    )
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read", "id": notification_id}

@router.put("/read-all")
def mark_all_read(db: Session = Depends(get_db)):
    count = mark_all_notifications_read(
        db=db,
        merchant_id=settings.DEMO_MERCHANT_ID
    )
    return {"message": f"{count} notifications marked as read", "marked_count": count}
