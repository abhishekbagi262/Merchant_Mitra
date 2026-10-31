from decimal import Decimal
import pytest
from app.models.merchant import Merchant
from app.models.product import Product
from app.models.notification import Notification
from app.services.ai_service import answer_ask_mitra_query, generate_daily_brief
from app.services.notification_service import (
    create_notification,
    get_merchant_notifications,
    mark_notification_read,
    mark_all_notifications_read,
    check_and_create_stock_notifications,
)

def test_ask_mitra_highest_sold_product_inquiry(db_session):
    # Test abbreviation: "wt was the highest sold product of tdy"
    res1 = answer_ask_mitra_query(db_session, merchant_id=1, query="wt was the highest sold product of tdy")
    assert res1.intent == "BEST_SELLING_PRODUCT_INQUIRY"
    assert "highest-selling product" in res1.reply

    # Test direct phrasing: "today highest sold product"
    res2 = answer_ask_mitra_query(db_session, merchant_id=1, query="today highest sold product")
    assert res2.intent == "BEST_SELLING_PRODUCT_INQUIRY"
    assert res2.structured_data["best_selling_product"] is not None

def test_ask_mitra_out_of_scope_honesty(db_session):
    # Off-topic question should be detected honestly without hallucinations
    res = answer_ask_mitra_query(db_session, merchant_id=1, query="Who is the Chief Minister of Karnataka?")
    assert res.intent == "OUT_OF_SCOPE_HONESTY"
    assert res.structured_data["out_of_scope"] is True
    assert "retail business copilot" in res.reply.lower() or "व्यापार सहायक" in res.reply or "ವ್ಯಾಪಾರ ಸಹಾಯಕ" in res.reply

def test_ask_mitra_category_inventory_query(db_session):
    # Add a second biscuit product to test category aggregation
    p_extra = Product(
        merchant_id=1,
        sku="SKU-TEST-EXTRA-003",
        name="Britannia Good Day Butter",
        category="Biscuits",
        cost_price=Decimal("15.00"),
        selling_price=Decimal("20.00"),
        current_stock=40,
        reorder_threshold=10
    )
    db_session.add(p_extra)
    db_session.commit()

    # Category query: biscuits
    res = answer_ask_mitra_query(db_session, merchant_id=1, query="How much biscuit stock is available?")
    assert res.intent == "CATEGORY_INVENTORY_INQUIRY"
    assert res.structured_data["category"] == "Biscuits"
    assert res.structured_data["total_units"] == 90  # 50 Parle-G + 40 Good Day
    assert any("Parle-G" in p["name"] for p in res.structured_data["products"])
    assert any("Good Day" in p["name"] for p in res.structured_data["products"])

def test_ask_mitra_product_fuzzy_brand_query(db_session):
    # Specific product queries with brand matching
    res1 = answer_ask_mitra_query(db_session, merchant_id=1, query="What is the stock of Parle G?")
    assert res1.intent == "PRODUCT_STOCK_INQUIRY"
    assert "Parle-G" in res1.structured_data["product_name"]
    assert res1.structured_data["current_stock"] == 50

    res2 = answer_ask_mitra_query(db_session, merchant_id=1, query="How much Amul milk is available?")
    assert res2.intent == "PRODUCT_STOCK_INQUIRY"
    assert "Amul Milk" in res2.structured_data["product_name"]
    assert res2.structured_data["current_stock"] == 30

def test_dynamic_merchant_name_in_daily_brief(db_session):
    merchant = db_session.query(Merchant).filter(Merchant.id == 1).first()
    original_name = merchant.name
    original_business = merchant.business_name

    try:
        merchant.name = "Suresh"
        merchant.business_name = "Suresh Supermarket"
        db_session.commit()

        brief = generate_daily_brief(db_session, merchant_id=1, language="en")
        assert brief.merchant_name == "Suresh"
        assert brief.store_name == "Suresh Supermarket"
        assert "Suresh" in brief.brief_narrative
        assert "Suresh Supermarket" in brief.brief_narrative
    finally:
        # Restore original
        merchant.name = original_name
        merchant.business_name = original_business
        db_session.commit()

def test_notification_creation_and_lifecycle(db_session):
    # 1. Create a purchase notification
    notif = create_notification(
        db=db_session,
        merchant_id=1,
        notification_type="PURCHASE",
        title="New Sale Recorded",
        message="Test purchase of ₹150 completed.",
        severity="SUCCESS",
        related_entity_type="TRANSACTION",
        related_entity_id="TX-TEST-001",
        link="/transactions?ref=TX-TEST-001"
    )
    assert notif.id is not None
    assert notif.is_read is False

    # 2. Query notifications
    res = get_merchant_notifications(db_session, merchant_id=1, unread_only=True)
    assert res["unread_count"] >= 1
    assert any(n.id == notif.id for n in res["notifications"])

    # 3. Mark single notification as read
    success = mark_notification_read(db_session, notification_id=notif.id, merchant_id=1)
    assert success is True
    updated = db_session.query(Notification).filter(Notification.id == notif.id).first()
    assert updated.is_read is True
    assert updated.read_at is not None

    # 4. Mark all as read
    mark_all_notifications_read(db_session, merchant_id=1)
    res_after = get_merchant_notifications(db_session, merchant_id=1, unread_only=True)
    assert res_after["unread_count"] == 0
