import base64
import io
import urllib.parse
from datetime import datetime
from decimal import Decimal
from typing import Optional
import qrcode
from sqlalchemy.orm import Session
from app.config import settings
from app.models.order import Order
from app.models.transaction import Transaction
from app.models.customer import Customer
from app.models.merchant import Merchant
from app.schemas.payment import (
    DemoQRPaymentResponse,
    PaymentSimulationResponse,
    SoundboxAnnouncementResponse
)
from app.services.inventory_service import deduct_stock_for_order
from app.services.audit_service import log_audit_event

def generate_demo_upi_qr(
    db: Session,
    order: Optional[Order] = None,
    order_id: Optional[int] = None,
    merchant_name: Optional[str] = None,
    vpa: str = "demo-merchant@upi"
) -> DemoQRPaymentResponse:
    """
    Generates a realistic transaction-specific DEMO UPI QR code and payment URI.
    Uses standard UPI deep-link URI structure:
    upi://pay?pa=<vpa>&pn=<merchant>&am=<amount>&cu=INR&tn=Order%20<order_no>&tr=<txn_ref>
    """
    if order is None:
        if order_id is None:
            raise ValueError("Either order or order_id must be provided to generate QR.")
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise ValueError(f"Order #{order_id} not found.")

    # Dynamic merchant store name
    if not merchant_name:
        m = db.query(Merchant).filter(Merchant.id == order.merchant_id).first()
        merchant_name = m.business_name if m and m.business_name else settings.DEMO_BUSINESS_NAME

    # 1. Create unique transaction reference e.g. TXN-MM-20261031-1001
    now_str = datetime.utcnow().strftime("%Y%m%d")
    short_seq = f"{order.id:04d}"
    txn_ref = f"TXN-MM-{now_str}-{short_seq}"

    # Check if a pending transaction already exists for this order
    txn = db.query(Transaction).filter(
        Transaction.order_id == order.id,
        Transaction.status == "PENDING"
    ).first()

    if not txn:
        new_txn = Transaction(
            order_id=order.id,
            transaction_reference=txn_ref,
            payment_method="UPI_QR",
            amount=order.final_amount,
            status="PENDING",
            simulated=True,
            created_at=datetime.utcnow()
        )
        db.add(new_txn)
        db.commit()
    else:
        txn_ref = txn.transaction_reference

    # Standard UPI URI format
    amt_val = Decimal(str(order.final_amount))
    params = {
        "pa": vpa,
        "pn": merchant_name,
        "am": f"{amt_val:.2f}",
        "cu": "INR",
        "tn": f"Order {order.order_number}",
        "tr": txn_ref
    }
    upi_uri = f"upi://pay?{urllib.parse.urlencode(params)}"

    # Generate QR Code PNG and encode to base64
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(upi_uri)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    qr_b64 = "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode()

    return DemoQRPaymentResponse(
        order_id=order.id,
        order_number=order.order_number,
        amount=order.final_amount,
        merchant_name=merchant_name,
        vpa=vpa,
        transaction_reference=txn_ref,
        upi_uri=upi_uri,
        qr_code_base64=qr_b64,
        is_demo=True,
        disclaimer="DEMO PAYMENT — NO REAL MONEY WILL BE TRANSFERRED"
    )

def process_payment_simulation(
    db: Session,
    order_id: int,
    transaction_reference: str,
    action: str,
    actor: str = "Merchant Simulation Console"
) -> PaymentSimulationResponse:
    """
    Idempotent payment event processor.
    Handles SUCCESS, FAILED, and CANCELLED states.
    Prevents duplicate inventory deductions and duplicate revenue counting.
    """
    action = action.upper()
    if action not in ["SUCCESS", "FAILED", "CANCELLED"]:
        raise ValueError(f"Invalid payment action: {action}. Must be SUCCESS, FAILED, or CANCELLED.")

    order = db.query(Order).filter(Order.id == order_id).with_for_update().first()
    if not order:
        raise ValueError(f"Order ID {order_id} not found.")

    txn = db.query(Transaction).filter(
        Transaction.transaction_reference == transaction_reference
    ).with_for_update().first()

    if not txn:
        # If no matching txn found, look for any pending txn for this order or create one
        txn = db.query(Transaction).filter(
            Transaction.order_id == order.id
        ).order_by(Transaction.id.desc()).first()
        if not txn:
            txn = Transaction(
                order_id=order.id,
                transaction_reference=transaction_reference,
                payment_method="UPI_QR",
                amount=order.final_amount,
                status="PENDING",
                simulated=True,
                created_at=datetime.utcnow()
            )
            db.add(txn)
            db.commit()

    # 1. IDEMPOTENCY CHECK
    if txn.status == "SUCCESS":
        customer_name = order.customer.display_name if order.customer else None
        soundbox = SoundboxAnnouncementResponse(
            announcement_text=f"Received {int(order.final_amount)} rupees from {customer_name or 'your customer'} on MerchantMitra.",
            amount=order.final_amount,
            customer_name=customer_name,
            order_number=order.order_number,
            transaction_reference=txn.transaction_reference,
            timestamp=txn.confirmed_at or datetime.utcnow()
        )
        return PaymentSimulationResponse(
            success=True,
            status="SUCCESS",
            message="Transaction was already confirmed previously. Duplicate event ignored.",
            order_id=order.id,
            order_number=order.order_number,
            transaction_reference=txn.transaction_reference,
            amount=order.final_amount,
            is_duplicate=True,
            soundbox=soundbox
        )

    # 2. PROCESS SUCCESS EVENT
    if action == "SUCCESS":
        txn.status = "SUCCESS"
        txn.confirmed_at = datetime.utcnow()
        order.status = "PAID"
        order.paid_at = datetime.utcnow()

        # Deduct inventory atomically
        deduct_stock_for_order(db, order, actor=actor)

        # Update customer stats if customer exists
        customer_name = None
        if order.customer_id:
            customer = db.query(Customer).filter(Customer.id == order.customer_id).first()
            if customer:
                customer_name = customer.display_name
                if not customer.first_purchase_at:
                    customer.first_purchase_at = order.paid_at
                customer.last_purchase_at = order.paid_at

        db.commit()

        # Trigger event-driven notifications on confirmed purchase
        try:
            from app.services.notification_service import create_purchase_notification, check_and_create_stock_notifications
            create_purchase_notification(db, order, txn)
            check_and_create_stock_notifications(db, order.merchant_id)
        except Exception:
            pass

        # Audit Log
        log_audit_event(
            db=db,
            merchant_id=order.merchant_id,
            action="PAYMENT_SIMULATED_SUCCESS",
            entity_type="TRANSACTION",
            entity_id=str(txn.id),
            description=f"Simulated UPI payment of ₹{order.final_amount} for Order {order.order_number} confirmed. Stock deducted.",
            actor=actor,
            previous_state={"order_status": "PENDING", "txn_status": "PENDING"},
            new_state={"order_status": "PAID", "txn_status": "SUCCESS"}
        )

        announcement = (
            f"Received {int(order.final_amount)} rupees from {customer_name} on MerchantMitra."
            if customer_name
            else f"Received {int(order.final_amount)} rupees from your customer on MerchantMitra."
        )

        soundbox = SoundboxAnnouncementResponse(
            announcement_text=announcement,
            amount=order.final_amount,
            customer_name=customer_name,
            order_number=order.order_number,
            transaction_reference=txn.transaction_reference,
            timestamp=txn.confirmed_at
        )

        return PaymentSimulationResponse(
            success=True,
            status="SUCCESS",
            message="Payment simulated successfully. Stock deducted and transaction recorded.",
            order_id=order.id,
            order_number=order.order_number,
            transaction_reference=txn.transaction_reference,
            amount=order.final_amount,
            is_duplicate=False,
            soundbox=soundbox
        )

    # 3. PROCESS FAILED EVENT
    elif action == "FAILED":
        txn.status = "FAILED"
        # Order remains PENDING so merchant can retry or cancel
        db.commit()

        log_audit_event(
            db=db,
            merchant_id=order.merchant_id,
            action="PAYMENT_SIMULATED_FAILED",
            entity_type="TRANSACTION",
            entity_id=str(txn.id),
            description=f"Simulated UPI payment for Order {order.order_number} failed. No stock deducted.",
            actor=actor,
            previous_state={"txn_status": "PENDING"},
            new_state={"txn_status": "FAILED"}
        )

        return PaymentSimulationResponse(
            success=False,
            status="FAILED",
            message="Simulated payment failed. Inventory was NOT deducted.",
            order_id=order.id,
            order_number=order.order_number,
            transaction_reference=txn.transaction_reference,
            amount=order.final_amount,
            is_duplicate=False,
            soundbox=None
        )

    # 4. PROCESS CANCELLED EVENT
    else: # CANCELLED
        txn.status = "CANCELLED"
        order.status = "CANCELLED"
        db.commit()

        log_audit_event(
            db=db,
            merchant_id=order.merchant_id,
            action="PAYMENT_SIMULATED_CANCELLED",
            entity_type="TRANSACTION",
            entity_id=str(txn.id),
            description=f"Order {order.order_number} cancelled by merchant. No stock deducted.",
            actor=actor,
            previous_state={"order_status": "PENDING", "txn_status": "PENDING"},
            new_state={"order_status": "CANCELLED", "txn_status": "CANCELLED"}
        )

        return PaymentSimulationResponse(
            success=False,
            status="CANCELLED",
            message="Order and transaction cancelled. No stock deducted.",
            order_id=order.id,
            order_number=order.order_number,
            transaction_reference=txn.transaction_reference,
            amount=order.final_amount,
            is_duplicate=False,
            soundbox=None
        )
