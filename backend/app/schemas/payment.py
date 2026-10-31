from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field

class DemoQRPaymentRequest(BaseModel):
    order_id: int

class DemoQRPaymentResponse(BaseModel):
    order_id: int
    order_number: str
    amount: Decimal
    merchant_name: str
    vpa: str
    transaction_reference: str
    upi_uri: str
    qr_code_base64: str
    is_demo: bool = True
    disclaimer: str = "DEMO PAYMENT — NO REAL MONEY WILL BE TRANSFERRED"

class PaymentSimulationRequest(BaseModel):
    order_id: int
    transaction_reference: str
    action: str = Field(..., description="SUCCESS, FAILED, CANCELLED")

class SoundboxAnnouncementResponse(BaseModel):
    announcement_text: str
    amount: Decimal
    customer_name: Optional[str] = None
    order_number: str
    transaction_reference: str
    timestamp: datetime

class PaymentSimulationResponse(BaseModel):
    success: bool
    status: str # SUCCESS, FAILED, CANCELLED
    message: str
    order_id: int
    order_number: str
    transaction_reference: str
    amount: Decimal
    is_duplicate: bool = False
    soundbox: Optional[SoundboxAnnouncementResponse] = None
