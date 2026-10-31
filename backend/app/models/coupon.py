from datetime import datetime
from decimal import Decimal
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    coupon_code = Column(String(50), unique=True, nullable=False, index=True)
    discount_type = Column(String(50), nullable=False, default="FIXED") # FIXED, PERCENT
    discount_value = Column(Numeric(10, 2), nullable=False)
    expiry_date = Column(DateTime, nullable=False)
    status = Column(String(50), nullable=False, default="ACTIVE", index=True) # ACTIVE, REDEEMED, EXPIRED
    approved_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="coupons")
