from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel

class RecommendationItem(BaseModel):
    title: str
    action: str
    reason: str
    supporting_data: str
    estimated_benefit: Optional[str] = None
    priority: str = "MEDIUM" # HIGH, MEDIUM, LOW

class DailyBriefResponse(BaseModel):
    generated_at: datetime
    language: str # en, hi, kn
    merchant_name: str
    store_name: str
    today_sales: Decimal
    yesterday_sales: Decimal
    growth_pct: Optional[float]
    transactions_count: int
    average_bill_value: Decimal
    estimated_gross_profit: Decimal
    peak_sales_hour: Optional[str]
    top_selling_product: Optional[str]
    low_stock_summary: List[str] = []
    brief_narrative: str
    actionable_recommendations: List[RecommendationItem] = []
