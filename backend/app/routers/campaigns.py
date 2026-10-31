from typing import List, Optional
from decimal import Decimal, ROUND_HALF_UP
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.campaign import Campaign, CampaignAssignment, CampaignResult
from app.schemas.campaign import (
    CampaignDraftRequest,
    CampaignResponse,
    CampaignApprovalRequest,
    FastForwardRequest,
    CampaignUpliftResponse,
    MarginValidationWarning
)
from app.services.campaign_service import (
    draft_campaign,
    approve_or_reject_campaign,
    simulate_campaign_execution,
    fast_forward_campaign_scorecard,
    validate_campaign_margin
)

router = APIRouter(prefix="/api/campaigns", tags=["campaigns"])

@router.get("", response_model=List[CampaignResponse])
def list_campaigns(db: Session = Depends(get_db)):
    campaigns = db.query(Campaign).filter(
        Campaign.merchant_id == settings.DEMO_MERCHANT_ID
    ).order_by(Campaign.created_at.desc()).all()

    results: List[CampaignResponse] = []
    for c in campaigns:
        treat_cnt = len([a for a in c.assignments if a.group_type == "TREATMENT"])
        hold_cnt = len([a for a in c.assignments if a.group_type == "HOLDOUT"])
        total_cnt = treat_cnt + hold_cnt

        # Estimated cost = treat_cnt * 25% * discount_val
        est_cost = Decimal(str(treat_cnt)) * Decimal("0.25") * (c.discount_value if c.discount_type == "FIXED" else Decimal("12.00"))

        res = CampaignResponse(
            id=c.id,
            merchant_id=c.merchant_id,
            name=c.name,
            objective=c.objective,
            message=c.message,
            discount_type=c.discount_type,
            discount_value=c.discount_value,
            budget=c.budget,
            status=c.status,
            language=c.language,
            created_at=c.created_at,
            approved_at=c.approved_at,
            eligible_count=total_cnt,
            treatment_count=treat_cnt,
            holdout_count=hold_cnt,
            estimated_maximum_discount_cost=min(est_cost, c.budget).quantize(Decimal("0.01")),
            margin_warning=None
        )
        results.append(res)
    return results

@router.post("/draft", response_model=CampaignResponse, status_code=201)
def create_draft(payload: CampaignDraftRequest, db: Session = Depends(get_db)):
    # Validate margin
    margin_warn = validate_campaign_margin(
        db=db,
        product_id=payload.product_id,
        discount_type=payload.discount_type,
        discount_value=payload.discount_value
    )

    campaign = draft_campaign(
        db=db,
        merchant_id=settings.DEMO_MERCHANT_ID,
        req=payload
    )

    treat_cnt = len([a for a in campaign.assignments if a.group_type == "TREATMENT"])
    hold_cnt = len([a for a in campaign.assignments if a.group_type == "HOLDOUT"])
    total_cnt = treat_cnt + hold_cnt

    est_cost = Decimal(str(treat_cnt)) * Decimal("0.25") * (campaign.discount_value if campaign.discount_type == "FIXED" else Decimal("12.00"))

    return CampaignResponse(
        id=campaign.id,
        merchant_id=campaign.merchant_id,
        name=campaign.name,
        objective=campaign.objective,
        message=campaign.message,
        discount_type=campaign.discount_type,
        discount_value=campaign.discount_value,
        budget=campaign.budget,
        status=campaign.status,
        language=campaign.language,
        created_at=campaign.created_at,
        approved_at=campaign.approved_at,
        eligible_count=total_cnt,
        treatment_count=treat_cnt,
        holdout_count=hold_cnt,
        estimated_maximum_discount_cost=min(est_cost, campaign.budget).quantize(Decimal("0.01")),
        margin_warning=margin_warn
    )

@router.post("/{campaign_id}/approve", response_model=CampaignResponse)
def approve_campaign(
    campaign_id: int,
    payload: CampaignApprovalRequest,
    db: Session = Depends(get_db)
):
    try:
        c = approve_or_reject_campaign(db, campaign_id, action=payload.action)
        treat_cnt = len([a for a in c.assignments if a.group_type == "TREATMENT"])
        hold_cnt = len([a for a in c.assignments if a.group_type == "HOLDOUT"])
        total_cnt = treat_cnt + hold_cnt
        est_cost = Decimal(str(treat_cnt)) * Decimal("0.25") * (c.discount_value if c.discount_type == "FIXED" else Decimal("12.00"))

        return CampaignResponse(
            id=c.id,
            merchant_id=c.merchant_id,
            name=c.name,
            objective=c.objective,
            message=c.message,
            discount_type=c.discount_type,
            discount_value=c.discount_value,
            budget=c.budget,
            status=c.status,
            language=c.language,
            created_at=c.created_at,
            approved_at=c.approved_at,
            eligible_count=total_cnt,
            treatment_count=treat_cnt,
            holdout_count=hold_cnt,
            estimated_maximum_discount_cost=min(est_cost, c.budget).quantize(Decimal("0.01")),
            margin_warning=None
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{campaign_id}/simulate", response_model=CampaignResponse)
def simulate_campaign(campaign_id: int, db: Session = Depends(get_db)):
    try:
        c = simulate_campaign_execution(db, campaign_id)
        treat_cnt = len([a for a in c.assignments if a.group_type == "TREATMENT"])
        hold_cnt = len([a for a in c.assignments if a.group_type == "HOLDOUT"])
        total_cnt = treat_cnt + hold_cnt
        est_cost = Decimal(str(treat_cnt)) * Decimal("0.25") * (c.discount_value if c.discount_type == "FIXED" else Decimal("12.00"))

        return CampaignResponse(
            id=c.id,
            merchant_id=c.merchant_id,
            name=c.name,
            objective=c.objective,
            message=c.message,
            discount_type=c.discount_type,
            discount_value=c.discount_value,
            budget=c.budget,
            status=c.status,
            language=c.language,
            created_at=c.created_at,
            approved_at=c.approved_at,
            eligible_count=total_cnt,
            treatment_count=treat_cnt,
            holdout_count=hold_cnt,
            estimated_maximum_discount_cost=min(est_cost, c.budget).quantize(Decimal("0.01")),
            margin_warning=None
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{campaign_id}/fast-forward", response_model=CampaignUpliftResponse)
def fast_forward(
    campaign_id: int,
    payload: Optional[FastForwardRequest] = None,
    db: Session = Depends(get_db)
):
    obs_days = payload.observation_days if payload else 7
    try:
        return fast_forward_campaign_scorecard(db, campaign_id, observation_days=obs_days)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{campaign_id}/scorecard", response_model=CampaignUpliftResponse)
def get_scorecard(campaign_id: int, db: Session = Depends(get_db)):
    c = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")

    res = db.query(CampaignResult).filter(CampaignResult.campaign_id == campaign_id).first()
    if not res:
        # If not yet generated, generate now
        return fast_forward_campaign_scorecard(db, campaign_id, observation_days=7)

    # Return stored scorecard
    t_rev_per_cust = (res.treatment_revenue / Decimal(str(res.treatment_customers))).quantize(Decimal("0.01")) if res.treatment_customers > 0 else Decimal("0.00")
    h_rev_per_cust = (res.holdout_revenue / Decimal(str(res.holdout_customers))).quantize(Decimal("0.01")) if res.holdout_customers > 0 else Decimal("0.00")
    inc_per_cust = (t_rev_per_cust - h_rev_per_cust).quantize(Decimal("0.01"))

    profit_roi = (
        (((res.incremental_gross_profit - res.campaign_cost) / res.campaign_cost) * Decimal("100.00")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        if res.campaign_cost and res.campaign_cost > 0 and res.incremental_gross_profit is not None
        else None
    )

    ai_exp = (
        f"Treatment group produced ₹{t_rev_per_cust:.2f}/customer compared to ₹{h_rev_per_cust:.2f}/customer for the holdout group. "
        f"Observed incremental uplift is ₹{inc_per_cust:.2f} per treated customer ({res.roi}x revenue multiple)."
    )

    return CampaignUpliftResponse(
        campaign_id=c.id,
        campaign_name=c.name,
        observation_period_days=res.observation_period_days,
        treatment_customers=res.treatment_customers,
        holdout_customers=res.holdout_customers,
        treatment_revenue=res.treatment_revenue,
        holdout_revenue=res.holdout_revenue,
        treatment_revenue_per_customer=t_rev_per_cust,
        holdout_revenue_per_customer=h_rev_per_cust,
        incremental_revenue_per_customer=inc_per_cust,
        incremental_revenue=res.incremental_revenue,
        campaign_cost=res.campaign_cost,
        revenue_to_cost_ratio=res.roi,
        incremental_gross_profit=res.incremental_gross_profit,
        profit_roi_percentage=profit_roi,
        is_profit_roi_available=profit_roi is not None,
        ai_explanation=ai_exp,
        methodology_notes="Holdout experiment methodology. Synthetic observation results.",
        disclaimer="SIMULATED EXPERIMENT RESULTS — ILLUSTRATIVE, NOT ACTUAL MEASURED RESULTS",
        generated_at=res.generated_at
    )
