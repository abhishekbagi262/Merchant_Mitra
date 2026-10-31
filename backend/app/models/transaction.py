from datetime import datetime
from decimal import Decimal
from sqlalchemy import Column, Integer, String, Boolean, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    transaction_reference = Column(String(100), unique=True, nullable=False, index=True)
    payment_method = Column(String(50), nullable=False, default="UPI_QR")
    amount = Column(Numeric(10, 2), nullable=False)
    status = Column(String(50), nullable=False, default="PENDING", index=True) # SUCCESS, FAILED, CANCELLED
    simulated = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    confirmed_at = Column(DateTime, nullable=True)

    order = relationship("Order", back_populates="transactions")
