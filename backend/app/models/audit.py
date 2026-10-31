from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False, index=True)
    actor = Column(String(100), nullable=False, default="Merchant Ramesh")
    action = Column(String(100), nullable=False, index=True) # e.g. PRODUCT_CREATED, PAYMENT_SIMULATED, CAMPAIGN_APPROVED, etc.
    entity_type = Column(String(50), nullable=False, index=True) # PRODUCT, ORDER, TRANSACTION, CAMPAIGN, COUPON, SETTINGS
    entity_id = Column(String(50), nullable=True)
    previous_state = Column(Text, nullable=True) # JSON string representation
    new_state = Column(Text, nullable=True) # JSON string representation
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    merchant = relationship("Merchant", back_populates="audit_logs")
