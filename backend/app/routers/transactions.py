from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.transaction import Transaction
from app.models.order import Order
from app.models.inventory import InventoryMovement
from app.schemas.transaction import TransactionResponse, TransactionDetailResponse
from app.schemas.order import OrderItemResponse

router = APIRouter(prefix="/api/transactions", tags=["transactions"])

@router.get("", response_model=List[TransactionResponse])
def list_transactions(
    status: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(Transaction).join(Order).order_by(Transaction.created_at.desc())
    if status and status != "ALL":
        query = query.filter(Transaction.status == status)

    txns = query.limit(limit).all()

    results: List[TransactionResponse] = []
    for t in txns:
        cust_name = t.order.customer.display_name if (t.order and t.order.customer) else None
        item_count = len(t.order.items) if t.order else 0
        results.append(TransactionResponse(
            id=t.id,
            order_id=t.order_id,
            order_number=t.order.order_number if t.order else None,
            transaction_reference=t.transaction_reference,
            payment_method=t.payment_method,
            amount=t.amount,
            status=t.status,
            simulated=t.simulated,
            created_at=t.created_at,
            confirmed_at=t.confirmed_at,
            customer_name=cust_name,
            item_count=item_count
        ))
    return results

@router.get("/{transaction_id}", response_model=TransactionDetailResponse)
def get_transaction_detail(transaction_id: int, db: Session = Depends(get_db)):
    t = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transaction not found")

    order = t.order
    cust_name = order.customer.display_name if (order and order.customer) else None

    items_res = []
    movements_res = []

    if order:
        for oi in order.items:
            items_res.append(OrderItemResponse(
                id=oi.id,
                product_id=oi.product_id,
                product_name=oi.product.name if oi.product else None,
                quantity=oi.quantity,
                unit_price=oi.unit_price,
                unit_cost_snapshot=oi.unit_cost_snapshot,
                discount_amount=oi.discount_amount,
                line_total=oi.line_total
            ))

        # Find inventory movements associated with this order
        movements = db.query(InventoryMovement).filter(
            InventoryMovement.reference_id == order.order_number
        ).all()
        for m in movements:
            movements_res.append({
                "product_name": m.product.name if m.product else "Product",
                "quantity_change": m.quantity_change,
                "previous_stock": m.previous_stock,
                "new_stock": m.new_stock,
                "reason": m.reason,
                "created_at": m.created_at
            })

    return TransactionDetailResponse(
        id=t.id,
        order_id=t.order_id,
        order_number=order.order_number if order else None,
        transaction_reference=t.transaction_reference,
        payment_method=t.payment_method,
        amount=t.amount,
        status=t.status,
        simulated=t.simulated,
        created_at=t.created_at,
        confirmed_at=t.confirmed_at,
        customer_name=cust_name,
        item_count=len(items_res),
        customer_id=order.customer_id if order else None,
        subtotal=order.subtotal if order else None,
        discount_amount=order.discount_amount if order else None,
        tax_amount=order.tax_amount if order else None,
        items=items_res,
        inventory_movements=movements_res
    )
