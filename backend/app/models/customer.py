from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False, index=True)
    display_name = Column(String(150), nullable=False, index=True)
    phone = Column(String(20), nullable=True, index=True) # synthetic/voluntary demo phone
    marketing_consent = Column(Boolean, default=True)
    consent_timestamp = Column(DateTime, default=datetime.utcnow)
    first_purchase_at = Column(DateTime, nullable=True)
    last_purchase_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    merchant = relationship("Merchant", back_populates="customers")
    orders = relationship("Order", back_populates="customer")
    campaign_assignments = relationship("CampaignAssignment", back_populates="customer")
    coupons = relationship("Coupon", back_populates="customer")
