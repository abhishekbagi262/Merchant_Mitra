from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.customer import Customer
from app.schemas.customer import (
    CustomerResponse,
    CustomerDetailResponse,
    CustomerCreate,
    LapsedCustomerResponse,
    LoyaltyEligibleCustomerResponse,
    IssueRewardRequest
)
from app.schemas.coupon import CouponResponse
from app.services.customer_service import (
    get_customer_summary,
    get_customer_detail,
    get_lapsed_customers,
    get_loyalty_eligible_customers,
    issue_loyalty_coupon
)
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/api/customers", tags=["customers"])

@router.get("", response_model=List[CustomerResponse])
def list_customers(
    segment: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Customer).filter(Customer.merchant_id == settings.DEMO_MERCHANT_ID)
    if search:
        s = f"%{search}%"
        query = query.filter((Customer.display_name.ilike(s)) | (Customer.phone.ilike(s)))

    customers = query.order_by(Customer.display_name.asc()).all()

    results: List[CustomerResponse] = []
    for c in customers:
        summary = get_customer_summary(db, c)
        if segment and segment != "ALL" and summary["segment"] != segment:
            continue

        res = CustomerResponse.model_validate(c)
        res.total_orders = summary["total_orders"]
        res.total_spend = summary["total_spend"]
        res.average_bill_value = summary["average_bill_value"]
        res.segment = summary["segment"]
        results.append(res)
    return results

@router.get("/lapsed", response_model=List[LapsedCustomerResponse])
def list_lapsed_customers(
    min_purchases: int = Query(3, ge=1),
    inactivity_days: int = Query(30, ge=1),
    db: Session = Depends(get_db)
):
    return get_lapsed_customers(
        db=db,
        merchant_id=settings.DEMO_MERCHANT_ID,
        min_purchases=min_purchases,
        inactivity_days=inactivity_days
    )

@router.get("/loyalty-eligible", response_model=List[LoyaltyEligibleCustomerResponse])
def list_loyalty_eligible(db: Session = Depends(get_db)):
    return get_loyalty_eligible_customers(db, merchant_id=settings.DEMO_MERCHANT_ID)

@router.post("/issue-reward", response_model=CouponResponse)
def approve_and_issue_reward(payload: IssueRewardRequest, db: Session = Depends(get_db)):
    try:
        coupon = issue_loyalty_coupon(
            db=db,
            merchant_id=settings.DEMO_MERCHANT_ID,
            customer_id=payload.customer_id,
            discount_type=payload.discount_type,
            discount_value=payload.discount_value,
            validity_days=payload.validity_days
        )
        return CouponResponse(
            id=coupon.id,
            customer_id=coupon.customer_id,
            customer_name=coupon.customer.display_name,
            coupon_code=coupon.coupon_code,
            discount_type=coupon.discount_type,
            discount_value=coupon.discount_value,
            expiry_date=coupon.expiry_date,
            status=coupon.status,
            approved_at=coupon.approved_at
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{customer_id}", response_model=CustomerDetailResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    try:
        return get_customer_detail(db, customer_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("", response_model=CustomerResponse, status_code=201)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    cust = Customer(
        merchant_id=settings.DEMO_MERCHANT_ID,
        display_name=payload.display_name,
        phone=payload.phone,
        marketing_consent=payload.marketing_consent
    )
    db.add(cust)
    db.commit()
    db.refresh(cust)

    log_audit_event(
        db=db,
        merchant_id=settings.DEMO_MERCHANT_ID,
        action="CUSTOMER_CREATED",
        entity_type="CUSTOMER",
        entity_id=str(cust.id),
        description=f"Added customer '{cust.display_name}' (phone: {cust.phone or 'N/A'}, consent: {cust.marketing_consent})."
    )

    res = CustomerResponse.model_validate(cust)
    res.total_orders = 0
    res.total_spend = Decimal("0.00")
    res.average_bill_value = Decimal("0.00")
    res.segment = "NEW"
    return res
