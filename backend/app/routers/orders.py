from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.order import Order, OrderItem
from app.models.customer import Customer
from app.schemas.order import (
    CartValidationRequest,
    CartValidationResponse,
    OrderCreateRequest,
    OrderResponse,
    OrderItemResponse,
    CartItemSchema,
    CartDiscountSchema
)
from app.services.pricing_service import calculate_cart_totals
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/api/orders", tags=["orders"])

@router.post("/validate-cart", response_model=CartValidationResponse)
def validate_cart(
    payload: CartValidationRequest,
    db: Session = Depends(get_db)
):
    return calculate_cart_totals(
        db=db,
        merchant_id=settings.DEMO_MERCHANT_ID,
        items=payload.items,
        discount=payload.discount
    )

@router.post("", response_model=OrderResponse, status_code=201)
def create_order(payload: OrderCreateRequest, db: Session = Depends(get_db)):
    # 1. Validate pricing and stock
    calc = calculate_cart_totals(
        db=db,
        merchant_id=settings.DEMO_MERCHANT_ID,
        items=payload.items,
        discount=payload.discount
    )
    if not calc.is_valid:
        raise HTTPException(status_code=400, detail=calc.error_message)

    # 2. Generate unique order number e.g. MM-1001
    timestamp_seq = int(datetime.utcnow().timestamp()) % 100000
    order_number = f"MM{timestamp_seq}"

    order = Order(
        merchant_id=settings.DEMO_MERCHANT_ID,
        customer_id=payload.customer_id,
        order_number=order_number,
        subtotal=calc.subtotal,
        discount_amount=calc.discount_amount,
        tax_amount=calc.tax_amount,
        final_amount=calc.final_amount,
        status="PENDING",
        created_at=datetime.utcnow()
    )
    db.add(order)
    db.flush()

    for item_calc in calc.items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item_calc.product_id,
            quantity=item_calc.quantity,
            unit_price=item_calc.unit_price,
            unit_cost_snapshot=item_calc.unit_cost,
            discount_amount=item_calc.allocated_discount,
            line_total=item_calc.line_total
        )
        db.add(order_item)

    db.commit()
    db.refresh(order)

    log_audit_event(
        db=db,
        merchant_id=settings.DEMO_MERCHANT_ID,
        action="ORDER_CREATED",
        entity_type="ORDER",
        entity_id=str(order.id),
        description=f"Created pending order {order.order_number} for ₹{order.final_amount}.",
        new_state={"order_number": order.order_number, "final_amount": str(order.final_amount)}
    )

    items_res = [
        OrderItemResponse(
            id=oi.id,
            product_id=oi.product_id,
            product_name=oi.product.name if oi.product else None,
            quantity=oi.quantity,
            unit_price=oi.unit_price,
            unit_cost_snapshot=oi.unit_cost_snapshot,
            discount_amount=oi.discount_amount,
            line_total=oi.line_total
        )
        for oi in order.items
    ]

    cust_name = order.customer.display_name if order.customer else None

    return OrderResponse(
        id=order.id,
        merchant_id=order.merchant_id,
        customer_id=order.customer_id,
        customer_name=cust_name,
        order_number=order.order_number,
        subtotal=order.subtotal,
        discount_amount=order.discount_amount,
        tax_amount=order.tax_amount,
        final_amount=order.final_amount,
        status=order.status,
        created_at=order.created_at,
        paid_at=order.paid_at,
        items=items_res
    )

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.merchant_id == settings.DEMO_MERCHANT_ID
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    items_res = [
        OrderItemResponse(
            id=oi.id,
            product_id=oi.product_id,
            product_name=oi.product.name if oi.product else None,
            quantity=oi.quantity,
            unit_price=oi.unit_price,
            unit_cost_snapshot=oi.unit_cost_snapshot,
            discount_amount=oi.discount_amount,
            line_total=oi.line_total
        )
        for oi in order.items
    ]

    return OrderResponse(
        id=order.id,
        merchant_id=order.merchant_id,
        customer_id=order.customer_id,
        customer_name=order.customer.display_name if order.customer else None,
        order_number=order.order_number,
        subtotal=order.subtotal,
        discount_amount=order.discount_amount,
        tax_amount=order.tax_amount,
        final_amount=order.final_amount,
        status=order.status,
        created_at=order.created_at,
        paid_at=order.paid_at,
        items=items_res
    )
