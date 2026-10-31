from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

class CartItemSchema(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)

class CartDiscountSchema(BaseModel):
    discount_type: str = Field(default="NONE", description="NONE, FIXED, PERCENT")
    discount_value: Decimal = Field(default=Decimal("0.00"), ge=0)

class CartValidationRequest(BaseModel):
    items: List[CartItemSchema]
    discount: Optional[CartDiscountSchema] = None

class CalculatedItemSchema(BaseModel):
    product_id: int
    name: str
    sku: str
    quantity: int
    unit_price: Decimal
    unit_cost: Decimal
    line_subtotal: Decimal
    allocated_discount: Decimal
    line_total: Decimal
    estimated_gross_profit: Decimal

class CartValidationResponse(BaseModel):
    subtotal: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    final_amount: Decimal
    estimated_gross_profit: Decimal
    items: List[CalculatedItemSchema]
    is_valid: bool = True
    error_message: Optional[str] = None

class OrderCreateRequest(BaseModel):
    items: List[CartItemSchema]
    discount: Optional[CartDiscountSchema] = None
    customer_id: Optional[int] = None

class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    product_name: Optional[str] = None
    quantity: int
    unit_price: Decimal
    unit_cost_snapshot: Decimal
    discount_amount: Decimal
    line_total: Decimal

class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    merchant_id: int
    customer_id: Optional[int]
    customer_name: Optional[str] = None
    order_number: str
    subtotal: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    final_amount: Decimal
    status: str
    created_at: datetime
    paid_at: Optional[datetime]
    items: List[OrderItemResponse] = []
