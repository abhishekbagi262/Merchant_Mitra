import os
import pytest
from decimal import Decimal
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models.merchant import Merchant
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order
from app.models.transaction import Transaction
from app.config import settings

TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="function")
def db_session():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = Session()

    # Create demo merchant
    merchant = Merchant(
        id=settings.DEMO_MERCHANT_ID,
        name=settings.DEMO_MERCHANT_NAME,
        business_name=settings.DEMO_BUSINESS_NAME,
        location=settings.DEMO_LOCATION,
        currency="INR",
        timezone="Asia/Kolkata"
    )
    session.add(merchant)

    # Add demo products
    p1 = Product(
        merchant_id=settings.DEMO_MERCHANT_ID,
        sku="SKU-TEST-001",
        name="Parle-G",
        category="Biscuits",
        cost_price=Decimal("8.00"),
        selling_price=Decimal("10.00"),
        current_stock=50,
        reorder_threshold=15
    )
    p2 = Product(
        merchant_id=settings.DEMO_MERCHANT_ID,
        sku="SKU-TEST-002",
        name="Amul Milk",
        category="Dairy",
        cost_price=Decimal("26.00"),
        selling_price=Decimal("29.00"),
        current_stock=30,
        reorder_threshold=10
    )
    session.add_all([p1, p2])

    # Add demo customer
    c1 = Customer(
        merchant_id=settings.DEMO_MERCHANT_ID,
        display_name="Ananya Sharma",
        phone="9845012341",
        marketing_consent=True
    )
    session.add(c1)
    session.commit()

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
