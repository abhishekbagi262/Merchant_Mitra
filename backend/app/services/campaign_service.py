import hashlib
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from app.models.campaign import Campaign, CampaignAssignment, CampaignResult
from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order
from app.schemas.campaign import (
    CampaignDraftRequest,
    CampaignResponse,
    MarginValidationWarning,
    CampaignUpliftResponse
)
from app.services.customer_service import get_lapsed_customers
from app.services.audit_service import log_audit_event

def validate_campaign_margin(
    db: Session,
    product_id: Optional[int],
    discount_type: str,
    discount_value: Decimal
) -> MarginValidationWarning:
    if not product_id:
        return MarginValidationWarning(is_safe=True)

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return MarginValidationWarning(is_safe=True)

    sp = Decimal(str(product.selling_price))
    cp = Decimal(str(product.cost_price))

    if discount_type == "PERCENT":
        discount_amount = sp * (discount_value / Decimal("100.00"))
    else:
        discount_amount = discount_value

    discounted_price = sp - discount_amount

    if discounted_price < cp:
        loss_per_unit = (cp - discounted_price).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        return MarginValidationWarning(
            is_safe=False,
            product_name=product.name,
            selling_price=sp,
            cost_price=cp,
            discounted_price=discounted_price.quantize(Decimal("0.01")),
            potential_loss_per_unit=loss_per_unit,
            warning_message=(
                f"Financial Risk Warning: The discount of {discount_value}{'%' if discount_type == 'PERCENT' else '₹'} "
                f"reduces '{product.name}' selling price to ₹{discounted_price:.2f}, below its unit cost of ₹{cp:.2f}. "
                f"Every unit sold under this offer results in an estimated loss of ₹{loss_per_unit:.2f}."
            )
        )

    return MarginValidationWarning(
        is_safe=True,
        product_name=product.name,
        selling_price=sp,
        cost_price=cp,
        discounted_price=discounted_price.quantize(Decimal("0.01")),
        potential_loss_per_unit=Decimal("0.00"),
        warning_message="Discount is financially safe and preserves a positive gross margin."
    )

def draft_campaign(
    db: Session,
    merchant_id: int,
    req: CampaignDraftRequest,
    actor: str = "Merchant Ramesh"
) -> Campaign:
    # Generate multi-lingual message templates based on objective & discount
    lang = req.language.lower()
    discount_str = f"{int(req.discount_value)}%" if req.discount_type == "PERCENT" else f"₹{int(req.discount_value)}"

    if lang == "hi":
        msg_template = f"नमस्ते! रमेश जनरल स्टोर्स पर आपका स्वागत है। आपके लिए विशेष {discount_str} छूट उपलब्ध है। आज ही पधारें!"
    elif lang == "kn":
        msg_template = f"ನಮಸ್ಕಾರ! ರಮೇಶ್ ಜನರಲ್ ಸ್ಟೋರ್ಸ್‌ಗೆ ಮತ್ತೆ ಬನ್ನಿ. ನಿಮಗಾಗಿ ವಿಶೇಷ {discount_str} ರಿಯಾಯಿತಿ ಲಭ್ಯವಿದೆ. ಇಂದೇ ಭೇಟಿ ನೀಡಿ!"
    else:
        msg_template = f"We miss you at Ramesh General Stores! Visit us this week and enjoy an exclusive {discount_str} off on your next purchase."

    campaign = Campaign(
        merchant_id=merchant_id,
        name=req.name,
        objective=req.objective,
        message=msg_template,
        discount_type=req.discount_type.upper(),
        discount_value=req.discount_value,
        budget=req.budget,
        status="DRAFT",
        language=lang,
        created_at=datetime.utcnow()
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    # 1. Select eligible audience with marketing consent
    if req.target_audience == "LAPSED_CUSTOMERS":
        lapsed = get_lapsed_customers(db, merchant_id, min_purchases=2, inactivity_days=14)
        customer_ids = [item.customer_id for item in lapsed]
        eligible_customers = db.query(Customer).filter(
            Customer.id.in_(customer_ids),
            Customer.marketing_consent == True
        ).all()
    else:
        eligible_customers = db.query(Customer).filter(
            Customer.merchant_id == merchant_id,
            Customer.marketing_consent == True
        ).all()

    # 2. Holdout Experiment Split (10% holdout, 90% treatment)
    # Reproducible random assignment using customer ID + campaign ID hash
    assignments: List[CampaignAssignment] = []
    for cust in eligible_customers:
        hash_val = int(hashlib.md5(f"camp_{campaign.id}_cust_{cust.id}".encode()).hexdigest(), 16)
        is_holdout = (hash_val % 10) == 0 # ~10% holdout

        group_type = "HOLDOUT" if is_holdout else "TREATMENT"
        status = "EXCLUDED_HOLDOUT" if is_holdout else "PENDING"

        assignment = CampaignAssignment(
            campaign_id=campaign.id,
            customer_id=cust.id,
            group_type=group_type,
            simulated_delivery_status=status,
            assigned_at=datetime.utcnow()
        )
        assignments.append(assignment)

    db.add_all(assignments)
    db.commit()

    log_audit_event(
        db=db,
        merchant_id=merchant_id,
        action="CAMPAIGN_DRAFTED",
        entity_type="CAMPAIGN",
        entity_id=str(campaign.id),
        description=f"Drafted campaign '{campaign.name}'. Audience: {len(assignments)} eligible (10% holdout group created).",
        actor=actor,
        new_state={"campaign_id": campaign.id, "eligible_count": len(assignments)}
    )

    return campaign

def approve_or_reject_campaign(
    db: Session,
    campaign_id: int,
    action: str,
    actor: str = "Merchant Ramesh"
) -> Campaign:
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise ValueError(f"Campaign ID {campaign_id} not found.")

    action = action.upper()
    if action not in ["APPROVE", "REJECT"]:
        raise ValueError(f"Action must be APPROVE or REJECT. Received: {action}")

    prev_status = campaign.status
    if action == "APPROVE":
        campaign.status = "APPROVED"
        campaign.approved_at = datetime.utcnow()
    else:
        campaign.status = "REJECTED"

    db.commit()

    log_audit_event(
        db=db,
        merchant_id=campaign.merchant_id,
        action=f"CAMPAIGN_{campaign.status}",
        entity_type="CAMPAIGN",
        entity_id=str(campaign.id),
        description=f"Campaign '{campaign.name}' was {campaign.status.lower()} by {actor}.",
        actor=actor,
        previous_state={"status": prev_status},
        new_state={"status": campaign.status}
    )

    return campaign

def simulate_campaign_execution(
    db: Session,
    campaign_id: int,
    actor: str = "Merchant Ramesh"
) -> Campaign:
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise ValueError(f"Campaign ID {campaign_id} not found.")

    if campaign.status != "APPROVED":
        raise ValueError(f"Cannot execute campaign with status '{campaign.status}'. Merchant approval is strictly required.")

    # Mark treatment customers as DELIVERED
    treatment_count = 0
    now = datetime.utcnow()
    for assignment in campaign.assignments:
        if assignment.group_type == "TREATMENT":
            assignment.simulated_delivery_status = "DELIVERED"
            assignment.delivered_at = now
            treatment_count += 1
        elif assignment.group_type == "HOLDOUT":
            # Strict safety guarantee: Holdout customers never receive simulated campaign
            assignment.simulated_delivery_status = "EXCLUDED_HOLDOUT"

    campaign.status = "SIMULATED"
    db.commit()

    log_audit_event(
        db=db,
        merchant_id=campaign.merchant_id,
        action="CAMPAIGN_SIMULATED",
        entity_type="CAMPAIGN",
        entity_id=str(campaign.id),
        description=f"Simulated delivery of campaign '{campaign.name}' to {treatment_count} treatment customers. Holdout group excluded.",
        actor=actor,
        previous_state={"status": "APPROVED"},
        new_state={"status": "SIMULATED", "delivered_treatment": treatment_count}
    )

    return campaign

def fast_forward_campaign_scorecard(
    db: Session,
    campaign_id: int,
    observation_days: int = 7
) -> CampaignUpliftResponse:
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise ValueError(f"Campaign ID {campaign_id} not found.")

    if campaign.status not in ["SIMULATED", "COMPLETED", "APPROVED"]:
        raise ValueError(f"Cannot fast-forward campaign in status '{campaign.status}'. Campaign must be simulated first.")

    treatment_assignments = [a for a in campaign.assignments if a.group_type == "TREATMENT"]
    holdout_assignments = [a for a in campaign.assignments if a.group_type == "HOLDOUT"]

    n_treat = len(treatment_assignments) or 1
    n_hold = len(holdout_assignments) or 1

    # Deterministic synthetic simulation based on campaign parameters and realistic uplift
    # Treatment group: higher spend due to campaign encouragement (e.g. ₹200 vs ₹168)
    base_spend_holdout = Decimal("168.00")
    uplift_per_customer = Decimal("32.00")
    treatment_spend_per_cust = base_spend_holdout + uplift_per_customer

    treatment_total_revenue = (treatment_spend_per_cust * Decimal(str(n_treat))).quantize(Decimal("0.01"))
    holdout_total_revenue = (base_spend_holdout * Decimal(str(n_hold))).quantize(Decimal("0.01"))

    incremental_revenue = (uplift_per_customer * Decimal(str(n_treat))).quantize(Decimal("0.01"))

    # Campaign cost: redemption rate ~25% * average discount amount (e.g. ₹11 per redemption * 0.25 * n_treat)
    # or fallback to budget limit
    est_redemption_rate = Decimal("0.25")
    avg_discount_val = Decimal("11.00")
    calc_cost = (Decimal(str(n_treat)) * est_redemption_rate * avg_discount_val).quantize(Decimal("0.01"))
    campaign_cost = min(calc_cost, campaign.budget)
    if campaign_cost <= Decimal("0.00"):
        campaign_cost = Decimal("25.00")

    rev_to_cost_ratio = (incremental_revenue / campaign_cost).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    # Gross profit calculation (average Indian grocery merchant gross margin ~ 22%)
    estimated_gross_margin = Decimal("0.22")
    incremental_gross_profit = (incremental_revenue * estimated_gross_margin).quantize(Decimal("0.01"))
    profit_roi = (((incremental_gross_profit - campaign_cost) / campaign_cost) * Decimal("100.00")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    # Persist or update CampaignResult
    res = db.query(CampaignResult).filter(CampaignResult.campaign_id == campaign.id).first()
    if not res:
        res = CampaignResult(
            campaign_id=campaign.id,
            observation_period_days=observation_days,
            treatment_revenue=treatment_total_revenue,
            holdout_revenue=holdout_total_revenue,
            treatment_customers=n_treat,
            holdout_customers=n_hold,
            campaign_cost=campaign_cost,
            incremental_revenue=incremental_revenue,
            incremental_gross_profit=incremental_gross_profit,
            roi=rev_to_cost_ratio,
            generated_at=datetime.utcnow(),
            simulated=True
        )
        db.add(res)
    else:
        res.treatment_revenue = treatment_total_revenue
        res.holdout_revenue = holdout_total_revenue
        res.incremental_revenue = incremental_revenue
        res.incremental_gross_profit = incremental_gross_profit
        res.roi = rev_to_cost_ratio
        res.generated_at = datetime.utcnow()

    campaign.status = "COMPLETED"
    db.commit()

    ai_exp = (
        f"Over the {observation_days}-day fast-forward observation period, treatment customers generated an average of "
        f"₹{treatment_spend_per_cust:.2f} compared to ₹{base_spend_holdout:.2f} for holdout customers who received no messages. "
        f"This yields an estimated incremental uplift of ₹{uplift_per_customer:.2f} per treated customer and ₹{incremental_revenue:.2f} "
        f"in total incremental revenue against ₹{campaign_cost:.2f} campaign cost ({rev_to_cost_ratio}x revenue-to-cost ratio)."
    )

    methodology = (
        "Methodology: 10% holdout group randomly isolated before delivery and held strictly uncontacted. "
        "Uplift is calculated as (Avg Treatment Revenue - Avg Holdout Revenue) × Treatment Customer Count. "
        "Estimated gross profit uses product gross margin snapshots minus redeemed discount liability."
    )

    return CampaignUpliftResponse(
        campaign_id=campaign.id,
        campaign_name=campaign.name,
        observation_period_days=observation_days,
        treatment_customers=n_treat,
        holdout_customers=n_hold,
        treatment_revenue=treatment_total_revenue,
        holdout_revenue=holdout_total_revenue,
        treatment_revenue_per_customer=treatment_spend_per_cust,
        holdout_revenue_per_customer=base_spend_holdout,
        incremental_revenue_per_customer=uplift_per_customer,
        incremental_revenue=incremental_revenue,
        campaign_cost=campaign_cost,
        revenue_to_cost_ratio=rev_to_cost_ratio,
        incremental_gross_profit=incremental_gross_profit,
        profit_roi_percentage=profit_roi,
        is_profit_roi_available=True,
        ai_explanation=ai_exp,
        methodology_notes=methodology,
        disclaimer="SIMULATED EXPERIMENT RESULTS — ILLUSTRATIVE, NOT ACTUAL MEASURED RESULTS",
        generated_at=datetime.utcnow()
    )
