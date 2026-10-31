from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    actor: str
    action: str
    entity_type: str
    entity_id: Optional[str]
    previous_state: Optional[str]
    new_state: Optional[str]
    description: str
    created_at: datetime
