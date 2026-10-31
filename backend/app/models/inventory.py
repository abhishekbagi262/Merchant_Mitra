from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class InventoryMovement(Base):
    __tablename__ = "inventory_movements"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    movement_type = Column(String(50), nullable=False) # SALE, RESTOCK, ADJUSTMENT, RETURN
    quantity_change = Column(Integer, nullable=False) # negative for sales, positive for restock
    previous_stock = Column(Integer, nullable=False)
    new_stock = Column(Integer, nullable=False)
    reason = Column(String(255), nullable=True)
    reference_id = Column(String(100), nullable=True, index=True) # e.g. order_number or manual adjustment id
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    product = relationship("Product", back_populates="inventory_movements")
