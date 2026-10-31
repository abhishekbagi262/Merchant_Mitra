from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class Merchant(Base):
    __tablename__ = "merchants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    business_name = Column(String(150), nullable=False)
    location = Column(String(150), nullable=False, default="Bengaluru, Karnataka")
    currency = Column(String(10), nullable=False, default="INR")
    timezone = Column(String(50), nullable=False, default="Asia/Kolkata")
    preferred_language = Column(String(10), default="en")

    # Assistant & Voice settings
    voice_enabled = Column(Boolean, default=True)
    auto_login_greeting = Column(Boolean, default=True)
    voice_responses = Column(Boolean, default=True)
    preferred_speech_lang = Column(String(10), default="en")

    # Notification preferences
    notify_purchases = Column(Boolean, default=True)
    notify_low_stock = Column(Boolean, default=True)
    notify_profit_decline = Column(Boolean, default=True)
    profit_decline_threshold_pct = Column(Integer, default=20)

    created_at = Column(DateTime, default=datetime.utcnow)

    products = relationship("Product", back_populates="merchant")
    customers = relationship("Customer", back_populates="merchant")
    orders = relationship("Order", back_populates="merchant")
    campaigns = relationship("Campaign", back_populates="merchant")
    audit_logs = relationship("AuditLog", back_populates="merchant")
    notifications = relationship("Notification", back_populates="merchant", cascade="all, delete-orphan")
