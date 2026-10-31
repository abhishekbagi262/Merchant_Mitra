from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

class CampaignDraftRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=150)
    objective: str = Field(..., description="WIN_BACK_LAPSED, REPEAT_PURCHASES, CLEAR_SLOW_STOCK, BOOST_AOV")
    target_audience: str = Field(default="LAPSED_CUSTOMERS", description="ALL, LAPSED_CUSTOMERS, FREQUENT_CUSTOMERS, CONSENTED_ONLY")
    product_id: Optional[int] = None
    discount_type: str = Field(default="PERCENT", description="PERCENT or FIXED")
    discount_value: Decimal = Field(..., gt=0)
    duration_days: int = Field(default=7, ge=1, le=60)
    budget: Decimal = Field(default=Decimal("250.00"), ge=0)
    language: str = Field(default="en", description="en, hi, kn")

class MarginValidationWarning(BaseModel):
    is_safe: bool
    product_name: Optional[str] = None
    selling_price: Optional[Decimal] = None
    cost_price: Optional[Decimal] = None
    discounted_price: Optional[Decimal] = None
    potential_loss_per_unit: Optional[Decimal] = None
    warning_message: Optional[str] = None

class CampaignResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    merchant_id: int
    name: str
    objective: str
    message: str
    discount_type: str
    discount_value: Decimal
    budget: Decimal
    status: str
    language: str
    created_at: datetime
    approved_at: Optional[datetime] = None
    eligible_count: int = 0
    treatment_count: int = 0
    holdout_count: int = 0
    estimated_maximum_discount_cost: Decimal = Decimal("0.00")
    margin_warning: Optional[MarginValidationWarning] = None

class CampaignApprovalRequest(BaseModel):
    action: str = Field(..., description="APPROVE or REJECT")

class FastForwardRequest(BaseModel):
    observation_days: int = Field(default=7, ge=1, le=30)

class CampaignUpliftResponse(BaseModel):
    campaign_id: int
    campaign_name: str
    observation_period_days: int
    treatment_customers: int
    holdout_customers: int
    treatment_revenue: Decimal
    holdout_revenue: Decimal
    treatment_revenue_per_customer: Decimal
    holdout_revenue_per_customer: Decimal
    incremental_revenue_per_customer: Decimal
    incremental_revenue: Decimal
    campaign_cost: Decimal
    revenue_to_cost_ratio: Decimal
    incremental_gross_profit: Optional[Decimal] = None
    profit_roi_percentage: Optional[Decimal] = None
    is_profit_roi_available: bool = False
    ai_explanation: str
    methodology_notes: str
    disclaimer: str = "SIMULATED EXPERIMENT RESULTS — ILLUSTRATIVE, NOT ACTUAL MEASURED RESULTS"
    generated_at: datetime
