import json
from typing import Any, Optional
from sqlalchemy.orm import Session
from app.models.audit import AuditLog

def log_audit_event(
    db: Session,
    merchant_id: int,
    action: str,
    entity_type: str,
    entity_id: Optional[str],
    description: str,
    actor: str = "Merchant Ramesh",
    previous_state: Optional[Any] = None,
    new_state: Optional[Any] = None,
) -> AuditLog:
    """
    Append-only audit logger.
    Records critical state changes and business actions across the platform.
    """
    prev_str = json.dumps(previous_state, default=str) if previous_state is not None else None
    new_str = json.dumps(new_state, default=str) if new_state is not None else None

    entry = AuditLog(
        merchant_id=merchant_id,
        actor=actor,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id is not None else None,
        previous_state=prev_str,
        new_state=new_str,
        description=description,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
