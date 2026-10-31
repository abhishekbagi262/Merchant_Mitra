from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.product import Product
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    StockAdjustmentRequest,
    StockCoverResponse
)
from app.services.inventory_service import adjust_stock, calculate_stock_cover
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/api/products", tags=["products"])

@router.get("", response_model=List[ProductResponse])
def list_products(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(Product.merchant_id == settings.DEMO_MERCHANT_ID)
    if category and category != "ALL":
        query = query.filter(Product.category == category)
    if search:
        s = f"%{search}%"
        query = query.filter((Product.name.ilike(s)) | (Product.sku.ilike(s)))

    products = query.order_by(Product.name.asc()).all()
    results = []
    for p in products:
        cover = calculate_stock_cover(db, p)
        res = ProductResponse.model_validate(p)
        res.days_of_stock = cover.days_left
        res.stock_status = cover.status
        results.append(res)
    return results

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.merchant_id == settings.DEMO_MERCHANT_ID
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    cover = calculate_stock_cover(db, product)
    res = ProductResponse.model_validate(product)
    res.days_of_stock = cover.days_left
    res.stock_status = cover.status
    return res

@router.post("", response_model=ProductResponse, status_code=201)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    existing = db.query(Product).filter(Product.sku == payload.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail="Product with this SKU already exists")

    product = Product(
        merchant_id=settings.DEMO_MERCHANT_ID,
        sku=payload.sku,
        name=payload.name,
        category=payload.category,
        description=payload.description,
        cost_price=payload.cost_price,
        selling_price=payload.selling_price,
        current_stock=payload.current_stock,
        reorder_threshold=payload.reorder_threshold,
        supplier=payload.supplier
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    log_audit_event(
        db=db,
        merchant_id=settings.DEMO_MERCHANT_ID,
        action="PRODUCT_CREATED",
        entity_type="PRODUCT",
        entity_id=str(product.id),
        description=f"Created new product '{product.name}' (SKU: {product.sku}) with stock {product.current_stock}.",
        new_state={"sku": product.sku, "name": product.name, "stock": product.current_stock}
    )

    cover = calculate_stock_cover(db, product)
    res = ProductResponse.model_validate(product)
    res.days_of_stock = cover.days_left
    res.stock_status = cover.status
    return res

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.merchant_id == settings.DEMO_MERCHANT_ID
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    prev_state = {"name": product.name, "price": str(product.selling_price), "cost": str(product.cost_price)}

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)

    log_audit_event(
        db=db,
        merchant_id=settings.DEMO_MERCHANT_ID,
        action="PRODUCT_EDITED",
        entity_type="PRODUCT",
        entity_id=str(product.id),
        description=f"Updated details for product '{product.name}'.",
        previous_state=prev_state,
        new_state={"name": product.name, "price": str(product.selling_price), "cost": str(product.cost_price)}
    )

    cover = calculate_stock_cover(db, product)
    res = ProductResponse.model_validate(product)
    res.days_of_stock = cover.days_left
    res.stock_status = cover.status
    return res

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.merchant_id == settings.DEMO_MERCHANT_ID
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    p_name = product.name
    db.delete(product)
    db.commit()

    log_audit_event(
        db=db,
        merchant_id=settings.DEMO_MERCHANT_ID,
        action="PRODUCT_DELETED",
        entity_type="PRODUCT",
        entity_id=str(product_id),
        description=f"Deleted product '{p_name}'.",
        previous_state={"name": p_name}
    )
    return {"message": f"Product '{p_name}' successfully deleted"}

@router.post("/{product_id}/adjust-stock", response_model=ProductResponse)
def adjust_product_stock(
    product_id: int,
    payload: StockAdjustmentRequest,
    db: Session = Depends(get_db)
):
    try:
        product = adjust_stock(
            db=db,
            product_id=product_id,
            quantity_change=payload.quantity_change,
            reason=payload.reason
        )
        cover = calculate_stock_cover(db, product)
        res = ProductResponse.model_validate(product)
        res.days_of_stock = cover.days_left
        res.stock_status = cover.status
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{product_id}/cover", response_model=StockCoverResponse)
def get_product_stock_cover(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.merchant_id == settings.DEMO_MERCHANT_ID
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return calculate_stock_cover(db, product)
