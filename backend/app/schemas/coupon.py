from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict

class CouponResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    customer_name: str
    coupon_code: str
    discount_type: str
    discount_value: Decimal
    expiry_date: datetime
    status: str
    approved_at: datetime
