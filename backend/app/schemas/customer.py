from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

class CustomerBase(BaseModel):
    display_name: str = Field(..., max_length=150)
    phone: Optional[str] = Field(None, max_length=20)
    marketing_consent: bool = True

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    merchant_id: int
    first_purchase_at: Optional[datetime]
    last_purchase_at: Optional[datetime]
    created_at: datetime
    total_orders: int = 0
    total_spend: Decimal = Decimal("0.00")
    average_bill_value: Decimal = Decimal("0.00")
    segment: str = "NEW" # NEW, REGULAR, LAPSED, HIGH_VALUE

class CustomerDetailResponse(CustomerResponse):
    favorite_products: List[str] = []
    days_since_last_visit: Optional[int] = None
    is_loyalty_eligible: bool = False
    active_coupons: List[str] = []

class LapsedCustomerResponse(BaseModel):
    customer_id: int
    display_name: str
    phone: Optional[str] = None
    last_visit: Optional[datetime] = None
    days_inactive: int
    previous_purchase_count: int
    total_spend: Decimal
    average_spend: Decimal
    favorite_products: List[str] = []
    reason_for_recommendation: str

class LoyaltyEligibleCustomerResponse(BaseModel):
    customer_id: int
    display_name: str
    phone: Optional[str] = None
    cumulative_spend: Decimal
    threshold: Decimal = Decimal("500.00")
    total_visits: int
    eligible: bool = True
    already_rewarded: bool = False

class IssueRewardRequest(BaseModel):
    customer_id: int
    discount_type: str = Field(default="FIXED", description="FIXED or PERCENT")
    discount_value: Decimal = Field(default=Decimal("50.00"), gt=0)
    validity_days: int = Field(default=30, gt=0)
