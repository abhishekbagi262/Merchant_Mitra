from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.order import OrderItemResponse

class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: int
    order_number: Optional[str] = None
    transaction_reference: str
    payment_method: str
    amount: Decimal
    status: str
    simulated: bool
    created_at: datetime
    confirmed_at: Optional[datetime] = None
    customer_name: Optional[str] = None
    item_count: Optional[int] = None

class TransactionDetailResponse(TransactionResponse):
    customer_id: Optional[int] = None
    subtotal: Optional[Decimal] = None
    discount_amount: Optional[Decimal] = None
    tax_amount: Optional[Decimal] = None
    items: List[OrderItemResponse] = []
    inventory_movements: List[dict] = []
