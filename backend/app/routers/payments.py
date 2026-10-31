from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.payment import (
    DemoQRPaymentRequest,
    DemoQRPaymentResponse,
    PaymentSimulationRequest,
    PaymentSimulationResponse
)
from app.services.payment_service import generate_demo_upi_qr, process_payment_simulation

router = APIRouter(prefix="/api/payments", tags=["payments"])

@router.post("/generate-qr", response_model=DemoQRPaymentResponse)
def create_demo_qr(payload: DemoQRPaymentRequest, db: Session = Depends(get_db)):
    try:
        return generate_demo_upi_qr(db, order_id=payload.order_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate UPI QR code: {str(e)}")

@router.post("/simulate", response_model=PaymentSimulationResponse)
def simulate_payment(payload: PaymentSimulationRequest, db: Session = Depends(get_db)):
    try:
        return process_payment_simulation(
            db=db,
            order_id=payload.order_id,
            transaction_reference=payload.transaction_reference,
            action=payload.action
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
