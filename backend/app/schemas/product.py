from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class ProductBase(BaseModel):
    sku: str = Field(..., max_length=50)
    name: str = Field(..., max_length=150)
    category: str = Field(..., max_length=100)
    description: Optional[str] = None
    cost_price: Decimal = Field(..., ge=0)
    selling_price: Decimal = Field(..., ge=0)
    current_stock: int = Field(..., ge=0)
    reorder_threshold: int = Field(default=10, ge=0)
    supplier: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    cost_price: Optional[Decimal] = Field(None, ge=0)
    selling_price: Optional[Decimal] = Field(None, ge=0)
    reorder_threshold: Optional[int] = Field(None, ge=0)
    supplier: Optional[str] = None

class ProductResponse(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    merchant_id: int
    created_at: datetime
    updated_at: datetime
    days_of_stock: Optional[float] = None
    stock_status: str = "HEALTHY" # CRITICAL, LOW, HEALTHY

class StockAdjustmentRequest(BaseModel):
    quantity_change: int = Field(..., description="Positive for addition, negative for reduction")
    reason: str = Field(..., min_length=3, max_length=255)

class StockCoverResponse(BaseModel):
    product_id: int
    product_name: str
    current_stock: int
    avg_daily_sales: float
    days_left: Optional[float]
    status: str # CRITICAL (< 3 days), LOW (< 7 days), HEALTHY
    recommendation: str
