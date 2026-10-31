from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.audit import AuditLog
from app.schemas.audit import AuditLogResponse

router = APIRouter(prefix="/api/audit-logs", tags=["audit-logs"])

@router.get("", response_model=List[AuditLogResponse])
def list_audit_logs(
    action: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog).filter(
        AuditLog.merchant_id == settings.DEMO_MERCHANT_ID
    )
    if action and action != "ALL":
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))

    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
    return logs
