from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel
from app.schemas.dashboard import DailySalesTrendItem, TopProductItem

class CategoryRevenueItem(BaseModel):
    category: str
    revenue: Decimal
    percentage: float

class CustomerMetrics(BaseModel):
    total_customers: int
    repeat_customers: int
    repeat_customer_rate: float
    new_customers_last_30_days: int
    average_customer_spend: Decimal

class SlowMovingProductItem(BaseModel):
    product_id: int
    name: str
    current_stock: int
    units_sold_30_days: int
    days_since_last_sale: Optional[int]

class ComprehensiveAnalyticsResponse(BaseModel):
    costing_method: str = "Snapshot unit cost at purchase time"
    total_revenue_all_time: Decimal
    total_gross_profit_all_time: Decimal
    profit_margin_pct: float
    sales_trend_30_days: List[DailySalesTrendItem] = []
    category_distribution: List[CategoryRevenueItem] = []
    top_products: List[TopProductItem] = []
    slow_moving_products: List[SlowMovingProductItem] = []
    customer_metrics: CustomerMetrics
