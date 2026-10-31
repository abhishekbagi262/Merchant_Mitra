from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class InventoryMovementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    product_name: Optional[str] = None
    movement_type: str
    quantity_change: int
    previous_stock: int
    new_stock: int
    reason: Optional[str] = None
    reference_id: Optional[str] = None
    created_at: datetime
