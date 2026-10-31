from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.inventory import InventoryMovement
from app.models.product import Product
from app.schemas.inventory import InventoryMovementResponse

router = APIRouter(prefix="/api/inventory", tags=["inventory"])

@router.get("/movements", response_model=List[InventoryMovementResponse])
def list_movements(
    product_id: Optional[int] = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(InventoryMovement).join(Product)
    if product_id:
        query = query.filter(InventoryMovement.product_id == product_id)

    movements = query.order_by(InventoryMovement.created_at.desc()).limit(limit).all()

    results = []
    for m in movements:
        res = InventoryMovementResponse.model_validate(m)
        res.product_name = m.product.name if m.product else "Unknown Product"
        results.append(res)
    return results
