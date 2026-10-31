from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class NotificationBase(BaseModel):
    notification_type: str
    title: str
    message: str
    severity: str = "INFO" # INFO, SUCCESS, WARNING, CRITICAL
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[str] = None
    link: Optional[str] = None
    deduplication_key: Optional[str] = None

class NotificationResponse(NotificationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    merchant_id: int
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None

class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponse]
    unread_count: int
    total_count: int
