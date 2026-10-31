from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.notification import Notification
from app.models.merchant import Merchant
from app.models.product import Product
from app.models.order import Order
from app.models.transaction import Transaction
from app.models.customer import Customer

def create_notification(
    db: Session,
    merchant_id: int,
    notification_type: str,
    title: str,
    message: str,
    severity: str = "INFO",
    related_entity_type: Optional[str] = None,
    related_entity_id: Optional[str] = None,
    link: Optional[str] = None,
    deduplication_key: Optional[str] = None
) -> Optional[Notification]:
    """
    Creates persistent notification with deduplication prevention.
    """
    if deduplication_key:
        existing = db.query(Notification).filter(
            Notification.merchant_id == merchant_id,
            Notification.deduplication_key == deduplication_key,
            Notification.is_read == False
        ).first()
        if existing:
            return existing

    notification = Notification(
        merchant_id=merchant_id,
        notification_type=notification_type,
        title=title,
        message=message,
        severity=severity,
        related_entity_type=related_entity_type,
        related_entity_id=str(related_entity_id) if related_entity_id else None,
        link=link,
        deduplication_key=deduplication_key,
        created_at=datetime.utcnow()
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification

def create_purchase_notification(db: Session, order: Order, txn: Transaction) -> Optional[Notification]:
    """
    Generates notification on successful payment confirmation.
    """
    merchant = db.query(Merchant).filter(Merchant.id == order.merchant_id).first()
    if merchant and not merchant.notify_purchases:
        return None

    cust_name = order.customer.display_name if order.customer else "New customer"
    item_summaries = []
    for item in order.items:
        p_name = item.product.name if item.product else f"Item #{item.product_id}"
        item_summaries.append(f"{item.quantity}x {p_name}")

    items_str = ", ".join(item_summaries[:3])
    if len(item_summaries) > 3:
        items_str += f" and {len(item_summaries) - 3} more"

    title = "New sale received!"
    msg = f"{cust_name} purchased {items_str} for ₹{order.final_amount}. (Ref: {txn.transaction_reference})"

    notif = create_notification(
        db=db,
        merchant_id=order.merchant_id,
        notification_type="PURCHASE",
        title=title,
        message=msg,
        severity="SUCCESS",
        related_entity_type="ORDER",
        related_entity_id=str(order.id),
        link="/transactions",
        deduplication_key=f"purchase_{order.id}"
    )

    # Large value sale check
    if order.final_amount >= Decimal("500.00"):
        create_notification(
            db=db,
            merchant_id=order.merchant_id,
            notification_type="LARGE_SALE",
            title="High-value sale recorded!",
            message=f"Order {order.order_number} totaled ₹{order.final_amount} from {cust_name}.",
            severity="INFO",
            related_entity_type="ORDER",
            related_entity_id=str(order.id),
            link="/transactions",
            deduplication_key=f"large_sale_{order.id}"
        )

    return notif

def check_and_create_stock_notifications(db: Session, merchant_id: int):
    """
    Checks stock levels across all products and creates low/critical stock alerts.
    """
    from app.services.inventory_service import calculate_stock_cover

    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if merchant and not merchant.notify_low_stock:
        return

    products = db.query(Product).filter(Product.merchant_id == merchant_id).all()
    today_str = datetime.utcnow().strftime("%Y-%m-%d")

    for p in products:
        if p.current_stock <= 0:
            create_notification(
                db=db,
                merchant_id=merchant_id,
                notification_type="OUT_OF_STOCK",
                title=f"Out of stock: {p.name}",
                message=f"{p.name} (SKU: {p.sku}) is completely out of stock. Replenish immediately to prevent lost sales.",
                severity="CRITICAL",
                related_entity_type="PRODUCT",
                related_entity_id=str(p.id),
                link="/products",
                deduplication_key=f"out_of_stock_{p.id}_{today_str}"
            )
        elif p.current_stock <= p.reorder_threshold:
            cover = calculate_stock_cover(db, p)
            if cover.status == "CRITICAL" or (cover.days_left is not None and cover.days_left <= 1):
                create_notification(
                    db=db,
                    merchant_id=merchant_id,
                    notification_type="CRITICAL_STOCK",
                    title="Critical stock warning!",
                    message=f"{p.name} may run out within the next 24 hours ({p.current_stock} units left).",
                    severity="CRITICAL",
                    related_entity_type="PRODUCT",
                    related_entity_id=str(p.id),
                    link="/products",
                    deduplication_key=f"crit_stock_{p.id}_{today_str}"
                )
            else:
                days_txt = f"stock may last approximately {cover.days_left} days" if cover.days_left else "reorder threshold reached"
                create_notification(
                    db=db,
                    merchant_id=merchant_id,
                    notification_type="LOW_STOCK",
                    title=f"Low stock alert: {p.name}",
                    message=f"Only {p.current_stock} units remain (threshold is {p.reorder_threshold}). Based on recent sales, {days_txt}.",
                    severity="WARNING",
                    related_entity_type="PRODUCT",
                    related_entity_id=str(p.id),
                    link="/products",
                    deduplication_key=f"low_stock_{p.id}_{p.current_stock}"
                )

def check_profit_decline_notification(db: Session, merchant_id: int):
    """
    Detects significant gross profit declines comparing today vs yesterday.
    Default threshold: 20%.
    """
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if merchant and not merchant.notify_profit_decline:
        return

    threshold_pct = merchant.profit_decline_threshold_pct if merchant else 20

    from app.services.analytics_service import get_dashboard_kpis
    kpis = get_dashboard_kpis(db, merchant_id)

    today_sales = kpis.today_sales
    yesterday_sales = kpis.yesterday_sales

    # We compute estimated profit comparison
    today_profit = kpis.estimated_gross_profit
    # Approximate yesterday profit from weekly trend
    yesterday_trend = [w for w in kpis.weekly_trend if "Yesterday" in w.day_name or "Thu" in w.day_name or "Wed" in w.day_name]
    yesterday_profit = yesterday_trend[-2].profit if len(kpis.weekly_trend) >= 2 else Decimal("0.00")

    today_str = datetime.utcnow().strftime("%Y-%m-%d")

    if yesterday_profit > Decimal("0.00") and today_profit < yesterday_profit:
        decline_pct = int(((yesterday_profit - today_profit) / yesterday_profit) * Decimal("100"))
        if decline_pct >= threshold_pct:
            create_notification(
                db=db,
                merchant_id=merchant_id,
                notification_type="PROFIT_DECLINE",
                title=f"Gross profit has dropped by {decline_pct}% compared with yesterday",
                message=(
                    f"Today's estimated gross profit is ₹{today_profit} compared to ₹{yesterday_profit} yesterday "
                    f"({decline_pct}% reduction). Consider reviewing discount levels and evening promotion."
                ),
                severity="WARNING",
                related_entity_type="ANALYTICS",
                related_entity_id="dashboard",
                link="/analytics",
                deduplication_key=f"profit_decline_{today_str}"
            )

def get_merchant_notifications(
    db: Session,
    merchant_id: int,
    limit: int = 30,
    unread_only: bool = False
) -> Dict[str, Any]:
    query = db.query(Notification).filter(Notification.merchant_id == merchant_id)
    if unread_only:
        query = query.filter(Notification.is_read == False)

    total_count = query.count()
    unread_count = db.query(Notification).filter(
        Notification.merchant_id == merchant_id,
        Notification.is_read == False
    ).count()

    notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()

    return {
        "notifications": notifications,
        "unread_count": unread_count,
        "total_count": total_count
    }

def mark_notification_read(db: Session, notification_id: int, merchant_id: int) -> bool:
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.merchant_id == merchant_id
    ).first()
    if notif:
        notif.is_read = True
        notif.read_at = datetime.utcnow()
        db.commit()
        return True
    return False

def mark_all_notifications_read(db: Session, merchant_id: int) -> int:
    unread = db.query(Notification).filter(
        Notification.merchant_id == merchant_id,
        Notification.is_read == False
    ).all()
    count = len(unread)
    now = datetime.utcnow()
    for n in unread:
        n.is_read = True
        n.read_at = now
    db.commit()
    return count
