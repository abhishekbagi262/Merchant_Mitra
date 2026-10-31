from datetime import datetime, timedelta, time
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.models.order import Order, OrderItem
from app.models.transaction import Transaction
from app.models.product import Product
from app.models.customer import Customer
from app.schemas.dashboard import (
    DashboardKPIsResponse,
    HourlySalesItem,
    DailySalesTrendItem,
    TopProductItem,
    LowStockAlertItem
)
from app.schemas.analytics import (
    ComprehensiveAnalyticsResponse,
    CategoryRevenueItem,
    SlowMovingProductItem,
    CustomerMetrics
)
from app.services.inventory_service import calculate_stock_cover

def get_dashboard_kpis(db: Session, merchant_id: int) -> DashboardKPIsResponse:
    now = datetime.utcnow()
    today_start = datetime.combine(now.date(), time.min)
    yesterday_start = today_start - timedelta(days=1)
    yesterday_end = today_start

    # 1. Today's successful transactions and sales
    today_txns = db.query(Transaction).join(Order).filter(
        Order.merchant_id == merchant_id,
        Order.status == "PAID",
        Transaction.status == "SUCCESS",
        Order.paid_at >= today_start
    ).all()

    today_sales = sum([t.amount for t in today_txns], Decimal("0.00"))
    today_count = len(today_txns)
    avg_bill = (today_sales / Decimal(str(today_count))).quantize(Decimal("0.01")) if today_count > 0 else Decimal("0.00")

    # 2. Yesterday's sales
    yesterday_txns = db.query(Transaction).join(Order).filter(
        Order.merchant_id == merchant_id,
        Order.status == "PAID",
        Transaction.status == "SUCCESS",
        Order.paid_at >= yesterday_start,
        Order.paid_at < yesterday_end
    ).all()

    yesterday_sales = sum([t.amount for t in yesterday_txns], Decimal("0.00"))

    # Growth %
    growth_pct = None
    if yesterday_sales > Decimal("0.00"):
        diff = today_sales - yesterday_sales
        growth_pct = round(float((diff / yesterday_sales) * Decimal("100.00")), 1)

    # 3. Estimated gross profit today = sum of (line_total - (unit_cost_snapshot * quantity))
    today_order_ids = [t.order_id for t in today_txns]
    today_profit = Decimal("0.00")
    if today_order_ids:
        order_items = db.query(OrderItem).filter(OrderItem.order_id.in_(today_order_ids)).all()
        for oi in order_items:
            item_cost = oi.unit_cost_snapshot * Decimal(str(oi.quantity))
            item_profit = oi.line_total - item_cost
            today_profit += item_profit

    # 4. Total customers
    total_customers = db.query(Customer).filter(Customer.merchant_id == merchant_id).count()

    # 5. Low stock alerts
    products = db.query(Product).filter(Product.merchant_id == merchant_id).all()
    low_stock_items: List[LowStockAlertItem] = []
    for p in products:
        cover = calculate_stock_cover(db, p)
        if cover.status in ["CRITICAL", "LOW"]:
            low_stock_items.append(LowStockAlertItem(
                product_id=p.id,
                name=p.name,
                sku=p.sku,
                current_stock=p.current_stock,
                reorder_threshold=p.reorder_threshold,
                days_left=cover.days_left,
                status=cover.status
            ))

    low_stock_count = len(low_stock_items)

    # 6. Best selling product today or last 7 days
    top_p = db.query(
        Product.name,
        func.sum(OrderItem.quantity).label("total_qty")
    ).join(OrderItem, Product.id == OrderItem.product_id)\
     .join(Order, OrderItem.order_id == Order.id)\
     .join(Transaction, Order.id == Transaction.order_id)\
     .filter(
         Order.merchant_id == merchant_id,
         Order.status == "PAID",
         Transaction.status == "SUCCESS"
     )\
     .group_by(Product.name)\
     .order_by(func.sum(OrderItem.quantity).desc())\
     .first()

    best_selling_product = top_p[0] if top_p else "No sales recorded"

    # 7. Hourly breakdown for today
    hourly_sales_map: Dict[int, Dict[str, Any]] = {
        h: {"sales": Decimal("0.00"), "count": 0} for h in range(24)
    }
    for t in today_txns:
        if t.confirmed_at:
            h = t.confirmed_at.hour
            hourly_sales_map[h]["sales"] += t.amount
            hourly_sales_map[h]["count"] += 1

    hourly_sales_list: List[HourlySalesItem] = []
    peak_h = None
    peak_val = Decimal("0.00")

    for h in range(24):
        s_val = hourly_sales_map[h]["sales"]
        c_val = hourly_sales_map[h]["count"]
        # Format label e.g. "9 AM", "12 PM", "6 PM"
        if h == 0:
            h_lbl = "12 AM"
        elif h < 12:
            h_lbl = f"{h} AM"
        elif h == 12:
            h_lbl = "12 PM"
        else:
            h_lbl = f"{h-12} PM"

        if s_val > peak_val:
            peak_val = s_val
            peak_h = h

        hourly_sales_list.append(HourlySalesItem(
            hour=h,
            hour_label=h_lbl,
            sales=s_val,
            order_count=c_val
        ))

    peak_str = None
    if peak_h is not None and peak_val > Decimal("0.00"):
        peak_str = f"{hourly_sales_list[peak_h].hour_label} - {hourly_sales_list[(peak_h+1)%24].hour_label}"
    else:
        peak_str = "6 PM - 7 PM"

    # 8. Weekly Trend (last 7 days)
    weekly_trend: List[DailySalesTrendItem] = []
    for i in range(6, -1, -1):
        day_date = now.date() - timedelta(days=i)
        d_start = datetime.combine(day_date, time.min)
        d_end = datetime.combine(day_date, time.max)

        day_txns = db.query(Transaction).join(Order).filter(
            Order.merchant_id == merchant_id,
            Order.status == "PAID",
            Transaction.status == "SUCCESS",
            Order.paid_at >= d_start,
            Order.paid_at <= d_end
        ).all()

        d_sales = sum([tx.amount for tx in day_txns], Decimal("0.00"))
        d_order_ids = [tx.order_id for tx in day_txns]
        d_profit = Decimal("0.00")
        if d_order_ids:
            d_items = db.query(OrderItem).filter(OrderItem.order_id.in_(d_order_ids)).all()
            for it in d_items:
                d_profit += (it.line_total - (it.unit_cost_snapshot * Decimal(str(it.quantity))))

        weekly_trend.append(DailySalesTrendItem(
            date=day_date.strftime("%Y-%m-%d"),
            day_name=day_date.strftime("%a"),
            sales=d_sales,
            profit=d_profit.quantize(Decimal("0.01")),
            order_count=len(day_txns)
        ))

    # 9. Top 5 products overall
    top_items_raw = db.query(
        Product.id,
        Product.name,
        Product.category,
        func.sum(OrderItem.quantity).label("units"),
        func.sum(OrderItem.line_total).label("rev"),
        func.sum(OrderItem.unit_cost_snapshot * OrderItem.quantity).label("cost")
    ).join(OrderItem, Product.id == OrderItem.product_id)\
     .join(Order, OrderItem.order_id == Order.id)\
     .join(Transaction, Order.id == Transaction.order_id)\
     .filter(
         Order.merchant_id == merchant_id,
         Order.status == "PAID",
         Transaction.status == "SUCCESS"
     )\
     .group_by(Product.id, Product.name, Product.category)\
     .order_by(func.sum(OrderItem.line_total).desc())\
     .limit(5)\
     .all()

    top_products: List[TopProductItem] = []
    for row in top_items_raw:
        rev = Decimal(str(row.rev or "0.00"))
        cost = Decimal(str(row.cost or "0.00"))
        top_products.append(TopProductItem(
            product_id=row.id,
            name=row.name,
            category=row.category,
            units_sold=row.units or 0,
            total_revenue=rev,
            gross_profit=(rev - cost).quantize(Decimal("0.01"))
        ))

    return DashboardKPIsResponse(
        today_sales=today_sales.quantize(Decimal("0.01")),
        yesterday_sales=yesterday_sales.quantize(Decimal("0.01")),
        sales_growth_pct=growth_pct,
        today_transactions_count=today_count,
        average_bill_value=avg_bill,
        estimated_gross_profit=today_profit.quantize(Decimal("0.01")),
        total_customers=total_customers,
        low_stock_count=low_stock_count,
        best_selling_product=best_selling_product,
        peak_business_hour=peak_str,
        hourly_sales=hourly_sales_list,
        weekly_trend=weekly_trend,
        top_products=top_products,
        low_stock_alerts=low_stock_items[:5]
    )

def get_comprehensive_analytics(db: Session, merchant_id: int) -> ComprehensiveAnalyticsResponse:
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)

    # All-time revenue and profit
    all_txns = db.query(Transaction).join(Order).filter(
        Order.merchant_id == merchant_id,
        Order.status == "PAID",
        Transaction.status == "SUCCESS"
    ).all()

    all_order_ids = [t.order_id for t in all_txns]
    total_rev = sum([t.amount for t in all_txns], Decimal("0.00"))

    total_profit = Decimal("0.00")
    if all_order_ids:
        items = db.query(OrderItem).filter(OrderItem.order_id.in_(all_order_ids)).all()
        for item in items:
            item_cost = item.unit_cost_snapshot * Decimal(str(item.quantity))
            total_profit += (item.line_total - item_cost)

    margin_pct = float((total_profit / total_rev) * Decimal("100.00")) if total_rev > Decimal("0.00") else 0.0

    # 30 days trend
    trend_30: List[DailySalesTrendItem] = []
    for i in range(29, -1, -1):
        day_date = now.date() - timedelta(days=i)
        d_start = datetime.combine(day_date, time.min)
        d_end = datetime.combine(day_date, time.max)

        day_txns = db.query(Transaction).join(Order).filter(
            Order.merchant_id == merchant_id,
            Order.status == "PAID",
            Transaction.status == "SUCCESS",
            Order.paid_at >= d_start,
            Order.paid_at <= d_end
        ).all()

        d_sales = sum([tx.amount for tx in day_txns], Decimal("0.00"))
        d_order_ids = [tx.order_id for tx in day_txns]
        d_profit = Decimal("0.00")
        if d_order_ids:
            d_items = db.query(OrderItem).filter(OrderItem.order_id.in_(d_order_ids)).all()
            for it in d_items:
                d_profit += (it.line_total - (it.unit_cost_snapshot * Decimal(str(it.quantity))))

        trend_30.append(DailySalesTrendItem(
            date=day_date.strftime("%Y-%m-%d"),
            day_name=day_date.strftime("%d %b"),
            sales=d_sales,
            profit=d_profit.quantize(Decimal("0.01")),
            order_count=len(day_txns)
        ))

    # Category breakdown
    cat_raw = db.query(
        Product.category,
        func.sum(OrderItem.line_total).label("cat_rev")
    ).join(OrderItem, Product.id == OrderItem.product_id)\
     .join(Order, OrderItem.order_id == Order.id)\
     .join(Transaction, Order.id == Transaction.order_id)\
     .filter(
         Order.merchant_id == merchant_id,
         Order.status == "PAID",
         Transaction.status == "SUCCESS"
     )\
     .group_by(Product.category)\
     .all()

    cat_list: List[CategoryRevenueItem] = []
    for c_name, c_rev in cat_raw:
        rev_dec = Decimal(str(c_rev or "0.00"))
        pct = float((rev_dec / total_rev) * Decimal("100.00")) if total_rev > Decimal("0.00") else 0.0
        cat_list.append(CategoryRevenueItem(
            category=c_name,
            revenue=rev_dec.quantize(Decimal("0.01")),
            percentage=round(pct, 1)
        ))

    cat_list.sort(key=lambda x: x.revenue, reverse=True)

    # Top products (top 10)
    top_raw = db.query(
        Product.id,
        Product.name,
        Product.category,
        func.sum(OrderItem.quantity).label("units"),
        func.sum(OrderItem.line_total).label("rev"),
        func.sum(OrderItem.unit_cost_snapshot * OrderItem.quantity).label("cost")
    ).join(OrderItem, Product.id == OrderItem.product_id)\
     .join(Order, OrderItem.order_id == Order.id)\
     .join(Transaction, Order.id == Transaction.order_id)\
     .filter(
         Order.merchant_id == merchant_id,
         Order.status == "PAID",
         Transaction.status == "SUCCESS"
     )\
     .group_by(Product.id, Product.name, Product.category)\
     .order_by(func.sum(OrderItem.line_total).desc())\
     .limit(10)\
     .all()

    top_products = [
        TopProductItem(
            product_id=r.id,
            name=r.name,
            category=r.category,
            units_sold=r.units or 0,
            total_revenue=Decimal(str(r.rev or "0.00")).quantize(Decimal("0.01")),
            gross_profit=(Decimal(str(r.rev or "0.00")) - Decimal(str(r.cost or "0.00"))).quantize(Decimal("0.01"))
        )
        for r in top_raw
    ]

    # Slow moving products (sold < 3 units in 30 days)
    products = db.query(Product).filter(Product.merchant_id == merchant_id).all()
    slow_moving: List[SlowMovingProductItem] = []
    for p in products:
        units_sold = db.query(func.coalesce(func.sum(OrderItem.quantity), 0))\
            .join(Order).join(Transaction)\
            .filter(
                OrderItem.product_id == p.id,
                Transaction.status == "SUCCESS",
                Order.status == "PAID",
                Order.created_at >= thirty_days_ago
            ).scalar() or 0

        if units_sold <= 2:
            slow_moving.append(SlowMovingProductItem(
                product_id=p.id,
                name=p.name,
                current_stock=p.current_stock,
                units_sold_30_days=units_sold,
                days_since_last_sale=30
            ))

    slow_moving.sort(key=lambda x: x.current_stock, reverse=True)

    # Customer Metrics
    all_custs = db.query(Customer).filter(Customer.merchant_id == merchant_id).all()
    repeat_count = 0
    new_30_count = 0
    total_cust_spend = Decimal("0.00")

    for c in all_custs:
        cust_orders = db.query(Order).join(Transaction).filter(
            Order.customer_id == c.id,
            Order.status == "PAID",
            Transaction.status == "SUCCESS"
        ).count()
        if cust_orders > 1:
            repeat_count += 1
        if c.created_at >= thirty_days_ago:
            new_30_count += 1

    total_c = len(all_custs)
    repeat_rate = round((repeat_count / total_c) * 100.0, 1) if total_c > 0 else 0.0
    avg_spend = (total_rev / Decimal(str(total_c))).quantize(Decimal("0.01")) if total_c > 0 else Decimal("0.00")

    customer_metrics = CustomerMetrics(
        total_customers=total_c,
        repeat_customers=repeat_count,
        repeat_customer_rate=repeat_rate,
        new_customers_last_30_days=new_30_count,
        average_customer_spend=avg_spend
    )

    return ComprehensiveAnalyticsResponse(
        costing_method="Snapshot unit cost at purchase time (Gross Profit = Revenue - Snapshot COGS - Discounts)",
        total_revenue_all_time=total_rev.quantize(Decimal("0.01")),
        total_gross_profit_all_time=total_profit.quantize(Decimal("0.01")),
        profit_margin_pct=round(margin_pct, 1),
        sales_trend_30_days=trend_30,
        category_distribution=cat_list,
        top_products=top_products,
        slow_moving_products=slow_moving[:8],
        customer_metrics=customer_metrics
    )
