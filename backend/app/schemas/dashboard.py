from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel

class HourlySalesItem(BaseModel):
    hour: int # 0-23
    hour_label: str # e.g. "9 AM", "6 PM"
    sales: Decimal
    order_count: int

class DailySalesTrendItem(BaseModel):
    date: str # YYYY-MM-DD
    day_name: str # Mon, Tue, etc.
    sales: Decimal
    profit: Decimal
    order_count: int

class TopProductItem(BaseModel):
    product_id: int
    name: str
    category: str
    units_sold: int
    total_revenue: Decimal
    gross_profit: Decimal

class LowStockAlertItem(BaseModel):
    product_id: int
    name: str
    sku: str
    current_stock: int
    reorder_threshold: int
    days_left: Optional[float]
    status: str # CRITICAL, LOW

class DashboardKPIsResponse(BaseModel):
    today_sales: Decimal
    yesterday_sales: Decimal
    sales_growth_pct: Optional[float]
    today_transactions_count: int
    average_bill_value: Decimal
    estimated_gross_profit: Decimal
    total_customers: int
    low_stock_count: int
    best_selling_product: Optional[str] = None
    peak_business_hour: Optional[str] = None
    hourly_sales: List[HourlySalesItem] = []
    weekly_trend: List[DailySalesTrendItem] = []
    top_products: List[TopProductItem] = []
    low_stock_alerts: List[LowStockAlertItem] = []
