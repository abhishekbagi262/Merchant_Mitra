import uuid
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.customer import Customer
from app.models.order import Order, OrderItem
from app.models.transaction import Transaction
from app.models.product import Product
from app.models.coupon import Coupon
from app.schemas.customer import (
    CustomerResponse,
    CustomerDetailResponse,
    LapsedCustomerResponse,
    LoyaltyEligibleCustomerResponse
)
from app.services.audit_service import log_audit_event

def get_customer_summary(db: Session, customer: Customer) -> Dict[str, Any]:
    # Aggregated stats from PAID orders
    stats = db.query(
        func.count(Order.id).label("total_orders"),
        func.coalesce(func.sum(Order.final_amount), Decimal("0.00")).label("total_spend"),
    ).join(Transaction).filter(
        Order.customer_id == customer.id,
        Order.status == "PAID",
        Transaction.status == "SUCCESS"
    ).first()

    total_orders = stats.total_orders or 0
    total_spend = Decimal(str(stats.total_spend or "0.00"))
    avg_bill = (total_spend / Decimal(str(total_orders))) if total_orders > 0 else Decimal("0.00")

    # Segment
    days_since_last = None
    if customer.last_purchase_at:
        days_since_last = (datetime.utcnow() - customer.last_purchase_at).days

    if total_orders == 0:
        segment = "NEW"
    elif total_orders >= 3 and days_since_last and days_since_last >= 30:
        segment = "LAPSED"
    elif total_spend >= Decimal("1500.00"):
        segment = "HIGH_VALUE"
    else:
        segment = "REGULAR"

    return {
        "total_orders": total_orders,
        "total_spend": total_spend,
        "average_bill_value": avg_bill.quantize(Decimal("0.01")),
        "segment": segment,
        "days_since_last_visit": days_since_last
    }

def get_customer_detail(db: Session, customer_id: int) -> CustomerDetailResponse:
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise ValueError(f"Customer ID {customer_id} not found.")

    summary = get_customer_summary(db, customer)

    # Favorite products
    fav_products = db.query(
        Product.name,
        func.sum(OrderItem.quantity).label("units")
    ).join(OrderItem, Product.id == OrderItem.product_id)\
     .join(Order, OrderItem.order_id == Order.id)\
     .join(Transaction, Order.id == Transaction.order_id)\
     .filter(
         Order.customer_id == customer.id,
         Order.status == "PAID",
         Transaction.status == "SUCCESS"
     )\
     .group_by(Product.name)\
     .order_by(func.sum(OrderItem.quantity).desc())\
     .limit(3)\
     .all()

    fav_list = [p[0] for p in fav_products]

    # Active coupons
    active_coupons = db.query(Coupon.coupon_code).filter(
        Coupon.customer_id == customer.id,
        Coupon.status == "ACTIVE",
        Coupon.expiry_date >= datetime.utcnow()
    ).all()

    is_loyalty_eligible = (summary["total_spend"] >= Decimal("500.00")) and len(active_coupons) == 0

    return CustomerDetailResponse(
        id=customer.id,
        merchant_id=customer.merchant_id,
        display_name=customer.display_name,
        phone=customer.phone,
        marketing_consent=customer.marketing_consent,
        first_purchase_at=customer.first_purchase_at,
        last_purchase_at=customer.last_purchase_at,
        created_at=customer.created_at,
        total_orders=summary["total_orders"],
        total_spend=summary["total_spend"],
        average_bill_value=summary["average_bill_value"],
        segment=summary["segment"],
        favorite_products=fav_list,
        days_since_last_visit=summary["days_since_last_visit"],
        is_loyalty_eligible=is_loyalty_eligible,
        active_coupons=[c[0] for c in active_coupons]
    )

def get_lapsed_customers(
    db: Session,
    merchant_id: int,
    min_purchases: int = 3,
    inactivity_days: int = 30
) -> List[LapsedCustomerResponse]:
    """
    Identifies frequent customers (min_purchases >= 3) who have not visited in inactivity_days (>= 30).
    Never includes anonymous or new customers without sufficient verified history.
    """
    now = datetime.utcnow()
    cutoff_date = now - timedelta(days=inactivity_days)

    customers = db.query(Customer).filter(
        Customer.merchant_id == merchant_id,
        Customer.last_purchase_at.isnot(None),
        Customer.last_purchase_at <= cutoff_date
    ).all()

    lapsed_list: List[LapsedCustomerResponse] = []

    for c in customers:
        summary = get_customer_summary(db, c)
        if summary["total_orders"] >= min_purchases:
            days_inactive = (now - c.last_purchase_at).days

            # Get top 2 favorite products
            favs = db.query(
                Product.name
            ).join(OrderItem, Product.id == OrderItem.product_id)\
             .join(Order, OrderItem.order_id == Order.id)\
             .join(Transaction, Order.id == Transaction.order_id)\
             .filter(
                 Order.customer_id == c.id,
                 Order.status == "PAID",
                 Transaction.status == "SUCCESS"
             )\
             .group_by(Product.name)\
             .order_by(func.sum(OrderItem.quantity).desc())\
             .limit(2)\
             .all()

            fav_names = [f[0] for f in favs]
            fav_str = " and ".join(fav_names) if fav_names else "groceries"

            reason = (
                f"{c.display_name} has made {summary['total_orders']} purchases "
                f"(₹{summary['total_spend']} total spend) but has not visited in {days_inactive} days. "
                f"Previous purchases frequently included {fav_str}."
            )

            lapsed_list.append(LapsedCustomerResponse(
                customer_id=c.id,
                display_name=c.display_name,
                phone=c.phone,
                last_visit=c.last_purchase_at,
                days_inactive=days_inactive,
                previous_purchase_count=summary["total_orders"],
                total_spend=summary["total_spend"],
                average_spend=summary["average_bill_value"],
                favorite_products=fav_names,
                reason_for_recommendation=reason
            ))

    lapsed_list.sort(key=lambda x: x.days_inactive, reverse=True)
    return lapsed_list

def get_loyalty_eligible_customers(
    db: Session,
    merchant_id: int,
    threshold: Decimal = Decimal("500.00")
) -> List[LoyaltyEligibleCustomerResponse]:
    customers = db.query(Customer).filter(Customer.merchant_id == merchant_id).all()
    eligible_list: List[LoyaltyEligibleCustomerResponse] = []

    for c in customers:
        summary = get_customer_summary(db, c)
        if summary["total_spend"] >= threshold:
            has_active_coupon = db.query(Coupon).filter(
                Coupon.customer_id == c.id,
                Coupon.status == "ACTIVE",
                Coupon.expiry_date >= datetime.utcnow()
            ).first() is not None

            eligible_list.append(LoyaltyEligibleCustomerResponse(
                customer_id=c.id,
                display_name=c.display_name,
                phone=c.phone,
                cumulative_spend=summary["total_spend"],
                threshold=threshold,
                total_visits=summary["total_orders"],
                eligible=not has_active_coupon,
                already_rewarded=has_active_coupon
            ))

    eligible_list.sort(key=lambda x: x.cumulative_spend, reverse=True)
    return eligible_list

def issue_loyalty_coupon(
    db: Session,
    merchant_id: int,
    customer_id: int,
    discount_type: str = "FIXED",
    discount_value: Decimal = Decimal("50.00"),
    validity_days: int = 30,
    actor: str = "Merchant Ramesh"
) -> Coupon:
    customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.merchant_id == merchant_id
    ).first()
    if not customer:
        raise ValueError(f"Customer ID {customer_id} not found.")

    # Generate coupon code e.g. MITRA50-A1B2
    short_uuid = uuid.uuid4().hex[:4].upper()
    prefix = "MITRA" + ("PCT" if discount_type == "PERCENT" else "INR")
    coupon_code = f"{prefix}{int(discount_value)}-{short_uuid}"

    expiry_date = datetime.utcnow() + timedelta(days=validity_days)

    coupon = Coupon(
        customer_id=customer.id,
        coupon_code=coupon_code,
        discount_type=discount_type.upper(),
        discount_value=discount_value,
        expiry_date=expiry_date,
        status="ACTIVE",
        approved_at=datetime.utcnow()
    )
    db.add(coupon)
    db.commit()
    db.refresh(coupon)

    log_audit_event(
        db=db,
        merchant_id=merchant_id,
        action="COUPON_APPROVED",
        entity_type="COUPON",
        entity_id=str(coupon.id),
        description=f"Loyalty coupon '{coupon_code}' ({discount_type} {discount_value}) issued to customer '{customer.display_name}' valid until {expiry_date.strftime('%Y-%m-%d')}.",
        actor=actor,
        new_state={"coupon_code": coupon_code, "value": str(discount_value), "customer": customer.display_name}
    )

    return coupon
