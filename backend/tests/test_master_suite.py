from datetime import datetime, timedelta
from decimal import Decimal
import pytest
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order, OrderItem
from app.models.transaction import Transaction
from app.models.campaign import Campaign, CampaignAssignment
from app.models.audit import AuditLog
from app.schemas.order import CartItemSchema, CartDiscountSchema
from app.schemas.campaign import CampaignDraftRequest
from app.services.pricing_service import calculate_cart_totals
from app.services.inventory_service import adjust_stock, deduct_stock_for_order, calculate_stock_cover
from app.services.payment_service import process_payment_simulation, generate_demo_upi_qr
from app.services.analytics_service import get_dashboard_kpis
from app.services.customer_service import get_lapsed_customers, get_loyalty_eligible_customers, issue_loyalty_coupon
from app.services.campaign_service import (
    draft_campaign,
    approve_or_reject_campaign,
    simulate_campaign_execution,
    fast_forward_campaign_scorecard,
    validate_campaign_margin
)
from app.services.audit_service import log_audit_event
from app.services.ai_service import answer_ask_mitra_query

# 1. Product creation
def test_product_creation(db_session):
    p = Product(
        merchant_id=1,
        sku="SKU-NEW-01",
        name="Tata Tea",
        category="Beverages",
        cost_price=Decimal("90.00"),
        selling_price=Decimal("110.00"),
        current_stock=20,
        reorder_threshold=5
    )
    db_session.add(p)
    db_session.commit()
    assert p.id is not None
    assert p.name == "Tata Tea"

# 2. Product update
def test_product_update(db_session):
    p = db_session.query(Product).filter(Product.sku == "SKU-TEST-001").first()
    p.selling_price = Decimal("12.00")
    db_session.commit()
    updated = db_session.query(Product).filter(Product.sku == "SKU-TEST-001").first()
    assert updated.selling_price == Decimal("12.00")

# 3. Stock adjustment
def test_stock_adjustment(db_session):
    p = db_session.query(Product).filter(Product.sku == "SKU-TEST-001").first()
    init_stock = p.current_stock
    adjust_stock(db_session, p.id, quantity_change=10, reason="Supplier replenishment")
    db_session.refresh(p)
    assert p.current_stock == init_stock + 10

# 4. Order creation & 5. Order total calculation
def test_order_totals_and_calculation(db_session):
    p1 = db_session.query(Product).filter(Product.sku == "SKU-TEST-001").first()
    items = [CartItemSchema(product_id=p1.id, quantity=5)]
    calc = calculate_cart_totals(db_session, merchant_id=1, items=items)
    assert calc.is_valid is True
    # 5 * 10 = 50.00
    assert calc.subtotal == Decimal("50.00")
    assert calc.final_amount == Decimal("50.00")
    # Gross profit: 5 * (10 - 8) = 10.00
    assert calc.estimated_gross_profit == Decimal("10.00")

# 6. Fixed discount calculation
def test_fixed_discount_calculation(db_session):
    p1 = db_session.query(Product).filter(Product.sku == "SKU-TEST-001").first()
    items = [CartItemSchema(product_id=p1.id, quantity=5)]
    disc = CartDiscountSchema(discount_type="FIXED", discount_value=Decimal("15.00"))
    calc = calculate_cart_totals(db_session, merchant_id=1, items=items, discount=disc)
    assert calc.is_valid is True
    assert calc.subtotal == Decimal("50.00")
    assert calc.discount_amount == Decimal("15.00")
    assert calc.final_amount == Decimal("35.00")
    # Profit: 10.00 - 15.00 = -5.00
    assert calc.estimated_gross_profit == Decimal("-5.00")

# 7. Percentage discount calculation
def test_percent_discount_calculation(db_session):
    p1 = db_session.query(Product).filter(Product.sku == "SKU-TEST-001").first()
    items = [CartItemSchema(product_id=p1.id, quantity=5)]
    disc = CartDiscountSchema(discount_type="PERCENT", discount_value=Decimal("20.00"))
    calc = calculate_cart_totals(db_session, merchant_id=1, items=items, discount=disc)
    assert calc.is_valid is True
    assert calc.discount_amount == Decimal("10.00") # 20% of 50
    assert calc.final_amount == Decimal("40.00")

# 8. Successful simulated payment & 10. Inventory deduction
def test_successful_simulated_payment_and_stock_deduction(db_session):
    p1 = db_session.query(Product).filter(Product.sku == "SKU-TEST-001").first()
    assert p1.current_stock == 50

    # Create Order for 5 packets
    order = Order(
        merchant_id=1,
        order_number="MM9999",
        subtotal=Decimal("50.00"),
        discount_amount=Decimal("0.00"),
        tax_amount=Decimal("0.00"),
        final_amount=Decimal("50.00"),
        status="PENDING"
    )
    db_session.add(order)
    db_session.flush()

    oi = OrderItem(
        order_id=order.id,
        product_id=p1.id,
        quantity=5,
        unit_price=Decimal("10.00"),
        unit_cost_snapshot=Decimal("8.00"),
        discount_amount=Decimal("0.00"),
        line_total=Decimal("50.00")
    )
    db_session.add(oi)

    txn = Transaction(
        order_id=order.id,
        transaction_reference="TXN-TEST-SUCCESS-01",
        payment_method="UPI_QR",
        amount=Decimal("50.00"),
        status="PENDING",
        simulated=True
    )
    db_session.add(txn)
    db_session.commit()

    resp = process_payment_simulation(
        db=db_session,
        order_id=order.id,
        transaction_reference="TXN-TEST-SUCCESS-01",
        action="SUCCESS"
    )

    assert resp.success is True
    assert resp.status == "SUCCESS"
    db_session.refresh(order)
    db_session.refresh(p1)
    assert order.status == "PAID"
    # Stock should be 50 - 5 = 45!
    assert p1.current_stock == 45
    assert resp.soundbox is not None

# 9. Failed simulated payment does NOT deduct stock
def test_failed_simulated_payment_no_stock_deduction(db_session):
    p1 = db_session.query(Product).filter(Product.sku == "SKU-TEST-001").first()
    initial_stock = p1.current_stock

    order = Order(
        merchant_id=1,
        order_number="MM9998",
        subtotal=Decimal("20.00"),
        discount_amount=Decimal("0.00"),
        tax_amount=Decimal("0.00"),
        final_amount=Decimal("20.00"),
        status="PENDING"
    )
    db_session.add(order)
    db_session.flush()

    oi = OrderItem(
        order_id=order.id,
        product_id=p1.id,
        quantity=2,
        unit_price=Decimal("10.00"),
        unit_cost_snapshot=Decimal("8.00"),
        discount_amount=Decimal("0.00"),
        line_total=Decimal("20.00")
    )
    db_session.add(oi)

    txn = Transaction(
        order_id=order.id,
        transaction_reference="TXN-TEST-FAIL-01",
        payment_method="UPI_QR",
        amount=Decimal("20.00"),
        status="PENDING",
        simulated=True
    )
    db_session.add(txn)
    db_session.commit()

    resp = process_payment_simulation(
        db=db_session,
        order_id=order.id,
        transaction_reference="TXN-TEST-FAIL-01",
        action="FAILED"
    )

    assert resp.success is False
    assert resp.status == "FAILED"
    db_session.refresh(order)
    db_session.refresh(p1)
    assert order.status == "PENDING"
    # Stock must NOT change
    assert p1.current_stock == initial_stock

# 11. Duplicate payment event protection (idempotency)
def test_duplicate_payment_idempotency(db_session):
    p1 = db_session.query(Product).filter(Product.sku == "SKU-TEST-001").first()
    stock_before = p1.current_stock

    order = Order(
        merchant_id=1,
        order_number="MM9997",
        subtotal=Decimal("30.00"),
        discount_amount=Decimal("0.00"),
        tax_amount=Decimal("0.00"),
        final_amount=Decimal("30.00"),
        status="PENDING"
    )
    db_session.add(order)
    db_session.flush()

    oi = OrderItem(
        order_id=order.id,
        product_id=p1.id,
        quantity=3,
        unit_price=Decimal("10.00"),
        unit_cost_snapshot=Decimal("8.00"),
        discount_amount=Decimal("0.00"),
        line_total=Decimal("30.00")
    )
    db_session.add(oi)

    txn = Transaction(
        order_id=order.id,
        transaction_reference="TXN-TEST-IDEMP-01",
        payment_method="UPI_QR",
        amount=Decimal("30.00"),
        status="PENDING",
        simulated=True
    )
    db_session.add(txn)
    db_session.commit()

    # First event: SUCCESS
    resp1 = process_payment_simulation(
        db=db_session,
        order_id=order.id,
        transaction_reference="TXN-TEST-IDEMP-01",
        action="SUCCESS"
    )
    assert resp1.success is True
    assert resp1.is_duplicate is False
    db_session.refresh(p1)
    assert p1.current_stock == stock_before - 3

    # Second event: DUPLICATE SUCCESS
    resp2 = process_payment_simulation(
        db=db_session,
        order_id=order.id,
        transaction_reference="TXN-TEST-IDEMP-01",
        action="SUCCESS"
    )
    assert resp2.is_duplicate is True
    db_session.refresh(p1)
    # Stock must still be deducted ONLY once
    assert p1.current_stock == stock_before - 3

# 12. Sales analytics & 13. Gross profit calculation
def test_sales_analytics_and_profit(db_session):
    kpis = get_dashboard_kpis(db_session, merchant_id=1)
    assert isinstance(kpis.today_sales, Decimal)
    assert isinstance(kpis.estimated_gross_profit, Decimal)

# 14. Low-stock calculation
def test_low_stock_cover_calculation(db_session):
    p = db_session.query(Product).filter(Product.sku == "SKU-TEST-001").first()
    cover = calculate_stock_cover(db_session, p, days_window=30)
    assert cover.product_id == p.id
    assert cover.status in ["CRITICAL", "LOW", "HEALTHY"]

# 15. Lapsed customer identification
def test_lapsed_customer_detection(db_session):
    c = db_session.query(Customer).filter(Customer.display_name == "Ananya Sharma").first()
    # Add 4 orders 35 days ago
    past_date = datetime.utcnow() - timedelta(days=35)
    for i in range(4):
        o = Order(
            merchant_id=1,
            customer_id=c.id,
            order_number=f"MM-LAP-{i}",
            subtotal=Decimal("100.00"),
            discount_amount=Decimal("0.00"),
            tax_amount=Decimal("0.00"),
            final_amount=Decimal("100.00"),
            status="PAID",
            created_at=past_date,
            paid_at=past_date
        )
        db_session.add(o)
        db_session.flush()
        t = Transaction(
            order_id=o.id,
            transaction_reference=f"TXN-LAP-{i}",
            payment_method="UPI_QR",
            amount=Decimal("100.00"),
            status="SUCCESS",
            simulated=True,
            created_at=past_date,
            confirmed_at=past_date
        )
        db_session.add(t)
    c.last_purchase_at = past_date
    db_session.commit()

    lapsed = get_lapsed_customers(db_session, merchant_id=1, min_purchases=3, inactivity_days=30)
    assert len(lapsed) >= 1
    assert any(item.customer_id == c.id for item in lapsed)

# 16. Campaign audience selection & 17. Holdout assignment
def test_campaign_holdout_assignment(db_session):
    # Add 10 customers with marketing consent
    for i in range(10):
        cust = Customer(
            merchant_id=1,
            display_name=f"Test Cust {i}",
            phone=f"900000000{i}",
            marketing_consent=True
        )
        db_session.add(cust)
    db_session.commit()

    req = CampaignDraftRequest(
        name="Test Holdout Campaign",
        objective="REPEAT_PURCHASES",
        target_audience="ALL",
        discount_type="PERCENT",
        discount_value=Decimal("10.00"),
        budget=Decimal("500.00")
    )
    camp = draft_campaign(db_session, merchant_id=1, req=req)
    assert camp.id is not None
    assignments = db_session.query(CampaignAssignment).filter(CampaignAssignment.campaign_id == camp.id).all()
    assert len(assignments) >= 10

    groups = {a.group_type for a in assignments}
    assert "TREATMENT" in groups
    # Confirm holdout assignment exists
    assert any(a.group_type == "HOLDOUT" for a in assignments)

# 18. Campaign approval & 19. Campaign rejection
def test_campaign_approval_and_rejection(db_session):
    req = CampaignDraftRequest(
        name="Approval Test Campaign",
        objective="REPEAT_PURCHASES",
        target_audience="ALL",
        discount_type="PERCENT",
        discount_value=Decimal("10.00"),
        budget=Decimal("300.00")
    )
    camp = draft_campaign(db_session, merchant_id=1, req=req)

    # Approve
    camp = approve_or_reject_campaign(db_session, camp.id, action="APPROVE")
    assert camp.status == "APPROVED"

    # Reject another campaign
    camp2 = draft_campaign(db_session, merchant_id=1, req=req)
    camp2 = approve_or_reject_campaign(db_session, camp2.id, action="REJECT")
    assert camp2.status == "REJECTED"

    # Reject campaign cannot be simulated
    with pytest.raises(ValueError):
        simulate_campaign_execution(db_session, camp2.id)

# 20. Simulated campaign execution & 21. Campaign scorecard calculation
def test_simulated_campaign_and_scorecard(db_session):
    req = CampaignDraftRequest(
        name="Execution Test Campaign",
        objective="REPEAT_PURCHASES",
        target_audience="ALL",
        discount_type="PERCENT",
        discount_value=Decimal("10.00"),
        budget=Decimal("300.00")
    )
    camp = draft_campaign(db_session, merchant_id=1, req=req)
    camp = approve_or_reject_campaign(db_session, camp.id, action="APPROVE")
    camp = simulate_campaign_execution(db_session, camp.id)
    assert camp.status == "SIMULATED"

    # Verify holdout was never marked delivered
    holdouts = [a for a in camp.assignments if a.group_type == "HOLDOUT"]
    for h in holdouts:
        assert h.simulated_delivery_status == "EXCLUDED_HOLDOUT"

    # Fast forward 7 days scorecard
    scorecard = fast_forward_campaign_scorecard(db_session, camp.id, observation_days=7)
    assert scorecard.campaign_id == camp.id
    assert scorecard.treatment_customers > 0
    assert scorecard.holdout_customers > 0
    assert scorecard.incremental_revenue > Decimal("0.00")
    assert scorecard.revenue_to_cost_ratio > Decimal("0.00")
    assert "SIMULATED EXPERIMENT RESULTS" in scorecard.disclaimer

# 22. Audit log creation
def test_audit_log_creation(db_session):
    log = log_audit_event(
        db=db_session,
        merchant_id=1,
        action="TEST_ACTION",
        entity_type="TEST",
        entity_id="101",
        description="Testing audit log creation"
    )
    assert log.id is not None
    assert log.action == "TEST_ACTION"

# 23. Assistant database-backed answers
def test_assistant_database_backed_answers(db_session):
    # Ask about Parle-G stock
    res = answer_ask_mitra_query(db_session, merchant_id=1, query="How many Parle-G packets are left?")
    assert res.intent == "PRODUCT_STOCK_INQUIRY"
    # Must contain exact verified stock number from db
    p = db_session.query(Product).filter(Product.name == "Parle-G").first()
    assert str(p.current_stock) in res.reply

    # Ask about today's sales
    res_sales = answer_ask_mitra_query(db_session, merchant_id=1, query="How much did I sell today?")
    assert res_sales.intent == "TODAY_SALES_INQUIRY"

# 24. Cart validation request payload integration
def test_cart_validation_request_payload(db_session):
    from app.schemas.order import CartValidationRequest
    from app.routers.orders import validate_cart

    p = db_session.query(Product).filter(Product.sku == "SKU-TEST-001").first()
    req = CartValidationRequest(
        items=[CartItemSchema(product_id=p.id, quantity=4)],
        discount=CartDiscountSchema(discount_type="FIXED", discount_value=Decimal("10.00"))
    )
    res = validate_cart(payload=req, db=db_session)
    assert res.is_valid is True
    # 4 * 10 = 40, minus 10 = 30
    assert res.subtotal == Decimal("40.00")
    assert res.discount_amount == Decimal("10.00")
    assert res.final_amount == Decimal("30.00")

# 25. Customer total spend and visits update on payment
def test_customer_spend_and_visits_updated(db_session):
    from app.services.customer_service import get_customer_summary

    cust = Customer(
        merchant_id=1,
        display_name="Kavita Gowda",
        phone="9887766554",
        marketing_consent=True
    )
    db_session.add(cust)
    db_session.commit()

    p = db_session.query(Product).filter(Product.sku == "SKU-TEST-001").first()
    order = Order(
        merchant_id=1,
        customer_id=cust.id,
        order_number="MM-CUST-01",
        subtotal=Decimal("20.00"),
        discount_amount=Decimal("0.00"),
        tax_amount=Decimal("0.00"),
        final_amount=Decimal("20.00"),
        status="PENDING"
    )
    db_session.add(order)
    db_session.flush()

    oi = OrderItem(
        order_id=order.id,
        product_id=p.id,
        quantity=2,
        unit_price=Decimal("10.00"),
        unit_cost_snapshot=Decimal("8.00"),
        discount_amount=Decimal("0.00"),
        line_total=Decimal("20.00")
    )
    db_session.add(oi)

    txn = Transaction(
        order_id=order.id,
        transaction_reference="TXN-CUST-01",
        payment_method="UPI_QR",
        amount=Decimal("20.00"),
        status="PENDING",
        simulated=True
    )
    db_session.add(txn)
    db_session.commit()

    resp = process_payment_simulation(
        db=db_session,
        order_id=order.id,
        transaction_reference="TXN-CUST-01",
        action="SUCCESS"
    )
    assert resp.success is True

    db_session.refresh(cust)
    assert cust.last_purchase_at is not None
    summary = get_customer_summary(db_session, cust)
    assert summary["total_orders"] == 1
    assert summary["total_spend"] == Decimal("20.00")

# 26. Dynamic profit ROI calculation in campaign scorecard
def test_campaign_scorecard_dynamic_profit_roi(db_session):
    from app.routers.campaigns import get_scorecard

    req = CampaignDraftRequest(
        name="ROI Verification Campaign",
        objective="REPEAT_PURCHASES",
        target_audience="ALL",
        discount_type="FIXED",
        discount_value=Decimal("15.00"),
        budget=Decimal("400.00")
    )
    camp = draft_campaign(db_session, merchant_id=1, req=req)
    camp = approve_or_reject_campaign(db_session, camp.id, action="APPROVE")
    camp = simulate_campaign_execution(db_session, camp.id)

    # First call generates scorecard
    scorecard1 = get_scorecard(camp.id, db=db_session)
    assert scorecard1.profit_roi_percentage is not None

    # Second call returns stored scorecard with dynamically computed profit_roi_percentage
    scorecard2 = get_scorecard(camp.id, db=db_session)
    assert scorecard2.profit_roi_percentage == scorecard1.profit_roi_percentage
    assert scorecard2.is_profit_roi_available is True

