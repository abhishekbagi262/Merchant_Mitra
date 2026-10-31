from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.product import Product
from app.models.inventory import InventoryMovement
from app.models.order import Order, OrderItem
from app.models.transaction import Transaction
from app.schemas.product import StockCoverResponse
from app.services.audit_service import log_audit_event

def adjust_stock(
    db: Session,
    product_id: int,
    quantity_change: int,
    reason: str,
    reference_id: Optional[str] = None,
    actor: str = "Merchant Ramesh"
) -> Product:
    product = db.query(Product).filter(Product.id == product_id).with_for_update().first()
    if not product:
        raise ValueError(f"Product ID {product_id} not found.")

    prev_stock = product.current_stock
    new_stock = prev_stock + quantity_change

    if new_stock < 0:
        raise ValueError(f"Cannot adjust stock below 0. Current: {prev_stock}, change: {quantity_change}")

    product.current_stock = new_stock
    product.updated_at = datetime.utcnow()

    movement = InventoryMovement(
        product_id=product.id,
        movement_type="RESTOCK" if quantity_change > 0 else "ADJUSTMENT",
        quantity_change=quantity_change,
        previous_stock=prev_stock,
        new_stock=new_stock,
        reason=reason,
        reference_id=reference_id,
        created_at=datetime.utcnow()
    )
    db.add(movement)
    db.commit()
    db.refresh(product)

    log_audit_event(
        db=db,
        merchant_id=product.merchant_id,
        action="STOCK_ADJUSTED",
        entity_type="PRODUCT",
        entity_id=str(product.id),
        description=f"Stock adjusted for '{product.name}' by {quantity_change} ({reason}). Stock: {prev_stock} -> {new_stock}",
        actor=actor,
        previous_state={"current_stock": prev_stock},
        new_state={"current_stock": new_stock}
    )

    return product

def deduct_stock_for_order(
    db: Session,
    order: Order,
    actor: str = "System Payment Processor"
) -> List[InventoryMovement]:
    """
    Deducts inventory only once upon confirmed successful payment.
    Atomic operation per order.
    """
    movements: List[InventoryMovement] = []
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
        if not product:
            continue

        prev_stock = product.current_stock
        new_stock = prev_stock - item.quantity

        product.current_stock = new_stock
        product.updated_at = datetime.utcnow()

        movement = InventoryMovement(
            product_id=product.id,
            movement_type="SALE",
            quantity_change=-item.quantity,
            previous_stock=prev_stock,
            new_stock=new_stock,
            reason=f"Sale in Order {order.order_number}",
            reference_id=order.order_number,
            created_at=datetime.utcnow()
        )
        db.add(movement)
        movements.append(movement)

    db.commit()
    return movements

def calculate_stock_cover(
    db: Session,
    product: Product,
    days_window: int = 30
) -> StockCoverResponse:
    cutoff = datetime.utcnow() - timedelta(days=days_window)

    # Sum sold units for successful orders in the last 30 days
    sold_units = db.query(func.coalesce(func.sum(OrderItem.quantity), 0)).join(Order).join(Transaction).filter(
        OrderItem.product_id == product.id,
        Transaction.status == "SUCCESS",
        Order.status == "PAID",
        Order.created_at >= cutoff
    ).scalar() or 0

    avg_daily_sales = float(sold_units) / float(days_window) if days_window > 0 else 0.0

    if avg_daily_sales <= 0.0001:
        days_left = None
        if product.current_stock <= product.reorder_threshold:
            status = "LOW"
            rec = f"No recent 30-day sales recorded, but stock ({product.current_stock}) is at or below reorder threshold ({product.reorder_threshold})."
        else:
            status = "HEALTHY"
            rec = f"No recent 30-day sales recorded. Inventory stable at {product.current_stock} units."
    else:
        days_left = round(product.current_stock / avg_daily_sales, 1)
        if days_left <= 3.0:
            status = "CRITICAL"
            rec = f"Critical: {product.name} may run out in ~{days_left} days based on recent sales ({avg_daily_sales:.1f} units/day)."
        elif days_left <= 7.0 or product.current_stock <= product.reorder_threshold:
            status = "LOW"
            rec = f"Low stock: {product.name} has ~{days_left} days of stock remaining. Reorder recommended."
        else:
            status = "HEALTHY"
            rec = f"Healthy: {days_left} days of stock cover available."

    return StockCoverResponse(
        product_id=product.id,
        product_name=product.name,
        current_stock=product.current_stock,
        avg_daily_sales=round(avg_daily_sales, 2),
        days_left=days_left,
        status=status,
        recommendation=rec
    )
