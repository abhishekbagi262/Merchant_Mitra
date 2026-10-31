from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False, index=True)
    notification_type = Column(String(50), nullable=False, index=True) # PURCHASE, LOW_STOCK, CRITICAL_STOCK, PROFIT_DECLINE, CAMPAIGN, LOYALTY
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(20), default="INFO") # INFO, SUCCESS, WARNING, CRITICAL
    related_entity_type = Column(String(50), nullable=True) # ORDER, PRODUCT, CAMPAIGN, CUSTOMER, ANALYTICS
    related_entity_id = Column(String(50), nullable=True)
    link = Column(String(200), nullable=True) # e.g. /transactions, /products, /campaign-insights
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    read_at = Column(DateTime, nullable=True)
    deduplication_key = Column(String(150), nullable=True, index=True)

    merchant = relationship("Merchant", back_populates="notifications")
