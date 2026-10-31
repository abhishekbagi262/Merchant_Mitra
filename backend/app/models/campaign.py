from datetime import datetime
from decimal import Decimal
from sqlalchemy import Column, Integer, String, Text, Boolean, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    objective = Column(String(100), nullable=False) # WIN_BACK_LAPSED, REPEAT_PURCHASES, CLEAR_SLOW_STOCK, BOOST_AOV
    message = Column(Text, nullable=False)
    discount_type = Column(String(50), nullable=False, default="PERCENT") # FIXED, PERCENT
    discount_value = Column(Numeric(10, 2), nullable=False)
    budget = Column(Numeric(10, 2), nullable=False, default=Decimal("500.00"))
    status = Column(String(50), nullable=False, default="DRAFT", index=True) # DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, SIMULATED, COMPLETED
    language = Column(String(10), nullable=False, default="en") # en, hi, kn
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    approved_at = Column(DateTime, nullable=True)

    merchant = relationship("Merchant", back_populates="campaigns")
    assignments = relationship("CampaignAssignment", back_populates="campaign", cascade="all, delete-orphan")
    results = relationship("CampaignResult", back_populates="campaign", cascade="all, delete-orphan")


class CampaignAssignment(Base):
    __tablename__ = "campaign_assignments"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    group_type = Column(String(20), nullable=False) # TREATMENT, HOLDOUT
    simulated_delivery_status = Column(String(50), nullable=False, default="PENDING") # PENDING, DELIVERED, EXCLUDED_HOLDOUT
    assigned_at = Column(DateTime, default=datetime.utcnow)
    delivered_at = Column(DateTime, nullable=True)

    campaign = relationship("Campaign", back_populates="assignments")
    customer = relationship("Customer", back_populates="campaign_assignments")


class CampaignResult(Base):
    __tablename__ = "campaign_results"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False, index=True)
    observation_period_days = Column(Integer, nullable=False, default=7)
    treatment_revenue = Column(Numeric(10, 2), nullable=False)
    holdout_revenue = Column(Numeric(10, 2), nullable=False)
    treatment_customers = Column(Integer, nullable=False)
    holdout_customers = Column(Integer, nullable=False)
    campaign_cost = Column(Numeric(10, 2), nullable=False)
    incremental_revenue = Column(Numeric(10, 2), nullable=False)
    incremental_gross_profit = Column(Numeric(10, 2), nullable=True)
    roi = Column(Numeric(10, 2), nullable=True) # Revenue multiple or profit ROI %
    generated_at = Column(DateTime, default=datetime.utcnow)
    simulated = Column(Boolean, nullable=False, default=True)

    campaign = relationship("Campaign", back_populates="results")
