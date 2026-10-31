import random
from datetime import datetime, timedelta, time
from decimal import Decimal
from sqlalchemy.orm import Session
from app.config import settings
from app.database import Base, engine
from app.models.merchant import Merchant
from app.models.product import Product
from app.models.inventory import InventoryMovement
from app.models.customer import Customer
from app.models.order import Order, OrderItem
from app.models.transaction import Transaction
from app.models.campaign import Campaign, CampaignAssignment, CampaignResult
from app.models.coupon import Coupon
from app.models.audit import AuditLog
from app.models.notification import Notification

def seed_database(db: Session, force_reset: bool = False):
    if force_reset:
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
    else:
        Base.metadata.create_all(bind=engine)
        # Check if already seeded
        existing_merchant = db.query(Merchant).filter(Merchant.id == settings.DEMO_MERCHANT_ID).first()
        if existing_merchant:
            return

    # Set deterministic random seed
    random.seed(42)

    # 1. Merchant
    merchant = Merchant(
        id=settings.DEMO_MERCHANT_ID,
        name=settings.DEMO_MERCHANT_NAME,
        business_name=settings.DEMO_BUSINESS_NAME,
        location=settings.DEMO_LOCATION,
        currency=settings.DEMO_CURRENCY,
        timezone=settings.DEMO_TIMEZONE,
        created_at=datetime.utcnow() - timedelta(days=60)
    )
    db.add(merchant)
    db.commit()

    # 2. Products (27 Indian retail items)
    products_data = [
        # Crucial for Step 2 of Section 31: Parle-G starts at exactly 50 packets
        ("SKU-PG-001", "Parle-G Glucose Biscuits", "Biscuits", "Classic gold glucose biscuits 250g", Decimal("8.00"), Decimal("10.00"), 50, 15, "Parle Products"),
        ("SKU-AM-002", "Amul Taaza Milk 500ml", "Dairy", "Pasteurised toned milk pouch", Decimal("26.00"), Decimal("29.00"), 30, 10, "Gujarat Co-op Milk Fed"),
        ("SKU-GD-003", "Britannia Good Day Butter", "Biscuits", "Rich butter cookies 100g", Decimal("15.00"), Decimal("20.00"), 40, 10, "Britannia Industries"),
        ("SKU-TS-004", "Tata Salt Iodized 1kg", "Staples", "Vacuum evaporated iodized salt", Decimal("22.00"), Decimal("28.00"), 45, 10, "Tata Consumer Products"),
        ("SKU-AA-005", "Aashirvaad Superior Sharbati Atta 5kg", "Staples", "100% whole wheat atta", Decimal("230.00"), Decimal("275.00"), 25, 5, "ITC Limited"),
        ("SKU-FO-006", "Fortune Sunlite Refined Sunflower Oil 1L", "Oils", "Light refined cooking oil", Decimal("120.00"), Decimal("145.00"), 35, 8, "Adani Wilmar"),
        ("SKU-MG-007", "Maggi 2-Minute Masala Noodles 4-Pack", "Snacks", "Instant masala noodles 280g", Decimal("45.00"), Decimal("56.00"), 60, 15, "Nestlé India"),
        ("SKU-RL-008", "Brooke Bond Red Label Tea 250g", "Beverages", "Strong CTC black leaf tea", Decimal("110.00"), Decimal("135.00"), 30, 8, "Hindustan Unilever"),
        ("SKU-BR-009", "BRU Instant Coffee 50g", "Beverages", "Coffee chicory blended mix", Decimal("85.00"), Decimal("105.00"), 25, 5, "Hindustan Unilever"),
        ("SKU-DT-010", "Dettol Original Soap 75g", "Personal Care", "Antibacterial bath soap", Decimal("32.00"), Decimal("40.00"), 40, 10, "Reckitt Benckiser"),
        ("SKU-LB-011", "Lifebuoy Total Handwash 200ml", "Personal Care", "Liquid germ protection handwash", Decimal("75.00"), Decimal("95.00"), 20, 5, "Hindustan Unilever"),
        ("SKU-SE-012", "Surf Excel Easy Wash Detergent 1kg", "Household", "Stain removal washing powder", Decimal("115.00"), Decimal("140.00"), 25, 6, "Hindustan Unilever"),
        ("SKU-VM-013", "Vim Dishwash Gel Lemon 250ml", "Household", "Concentrated dishwash liquid", Decimal("48.00"), Decimal("60.00"), 35, 10, "Hindustan Unilever"),
        ("SKU-HB-014", "Haldiram's Nagpur Aloo Bhujia 200g", "Snacks", "Spicy crisp potato sev snack", Decimal("45.00"), Decimal("55.00"), 50, 12, "Haldiram Foods"),
        ("SKU-LY-015", "Lay's India's Magic Masala 50g", "Snacks", "Spicy potato chips", Decimal("16.00"), Decimal("20.00"), 45, 10, "PepsiCo India"),
        ("SKU-KK-016", "Kurkure Masala Munch 80g", "Snacks", "Crispy corn and rice puffs", Decimal("16.00"), Decimal("20.00"), 55, 10, "PepsiCo India"),
        ("SKU-TU-017", "Thums Up Soft Drink 750ml", "Beverages", "Charged cola beverage", Decimal("32.00"), Decimal("40.00"), 30, 10, "Coca-Cola India"),
        ("SKU-CC-018", "Coca-Cola 750ml", "Beverages", "Classic sparkling soft drink", Decimal("32.00"), Decimal("40.00"), 28, 10, "Coca-Cola India"),
        ("SKU-CG-019", "Colgate Strong Teeth Toothpaste 100g", "Personal Care", "Calcium boosted dental paste", Decimal("52.00"), Decimal("65.00"), 40, 10, "Colgate-Palmolive"),
        ("SKU-WS-020", "Whisper Ultra Clean Wings 8 Pads", "Personal Care", "Sanitary pads extra large", Decimal("78.00"), Decimal("95.00"), 25, 6, "Procter & Gamble"),
        ("SKU-MB-021", "Modern Special Sandwich Bread 400g", "Bakery", "Fresh sliced white bread", Decimal("35.00"), Decimal("45.00"), 4, 8, "Modern Foods"), # Low stock
        ("SKU-EG-022", "Farm Fresh White Eggs 6-Pack", "Dairy", "Grade A fresh poultry eggs", Decimal("42.00"), Decimal("54.00"), 5, 10, "Karnataka Poultry Fed"), # Low stock
        ("SKU-BR-023", "Daawat Rozana Super Basmati Rice 1kg", "Staples", "Aromatic long grain basmati", Decimal("95.00"), Decimal("125.00"), 30, 8, "LT Foods"),
        ("SKU-SU-024", "Madhur Pure & Hygienic Sugar 1kg", "Staples", "Refined sparkling sulfur-free sugar", Decimal("38.00"), Decimal("46.00"), 50, 12, "Shree Renuka Sugars"),
        ("SKU-TD-025", "Tata Sampann Unpolished Toor Dal 1kg", "Staples", "Protein rich arhar dal", Decimal("140.00"), Decimal("175.00"), 35, 8, "Tata Consumer Products"),
        ("SKU-GM-026", "Everest Garam Masala 100g", "Spices", "Authentic aromatic spice blend", Decimal("68.00"), Decimal("85.00"), 40, 10, "Everest Food Products"),
        ("SKU-BP-027", "Catch Black Pepper Powder 100g", "Spices", "Pure ground Malabar black pepper", Decimal("85.00"), Decimal("110.00"), 8, 5, "DS Group"), # Slow mover
    ]

    db_products = []
    for sku, name, cat, desc, cp, sp, stock, reorder, supp in products_data:
        p = Product(
            merchant_id=merchant.id,
            sku=sku,
            name=name,
            category=cat,
            description=desc,
            cost_price=cp,
            selling_price=sp,
            current_stock=stock,
            reorder_threshold=reorder,
            supplier=supp,
            created_at=datetime.utcnow() - timedelta(days=45)
        )
        db.add(p)
        db_products.append(p)
    db.commit()

    # Initial inventory movements
    for p in db_products:
        mv = InventoryMovement(
            product_id=p.id,
            movement_type="RESTOCK",
            quantity_change=p.current_stock + 20,
            previous_stock=0,
            new_stock=p.current_stock + 20,
            reason="Initial store inventory intake",
            reference_id="INIT-RESTOCK-01",
            created_at=datetime.utcnow() - timedelta(days=45)
        )
        db.add(mv)
    db.commit()

    # 3. Synthetic Customers (42 customers)
    customer_names = [
        ("Ananya Sharma", "9845012341", True), # Designed to be lapsed (8 visits, 35 days inactive)
        ("Rajesh Kumar", "9845012342", True),
        ("Priya Nair", "9845012343", True),
        ("Suresh Gowda", "9845012344", True),
        ("Deepa Patil", "9845012345", True),
        ("Vikram Rao", "9845012346", True),
        ("Kavita Iyer", "9845012347", True),
        ("Arun Hegde", "9845012348", False), # Consented = False
        ("Sneha Kulkarni", "9845012349", True),
        ("Rahul Deshmukh", "9845012350", True),
        ("Meera Sen", "9845012351", True),
        ("Girish Murthy", "9845012352", True),
        ("Lakshmi Narayanan", "9845012353", True),
        ("Sunil Bhat", "9845012354", True),
        ("Pooja Joshi", "9845012355", True),
        ("Manjunath Shetty", "9845012356", True),
        ("Divya Menon", "9845012357", True),
        ("Santosh Tiwari", "9845012358", True),
        ("Asha Kamath", "9845012359", True),
        ("Naveen Reddy", "9845012360", True),
        ("Swathi Bhat", "9845012361", True),
        ("Pradeep Kumar", "9845012362", True),
        ("Geetha Prabhu", "9845012363", True),
        ("Kishore Varma", "9845012364", True),
        ("Bhavana Jain", "9845012365", True),
        ("Rohan Kulkarni", "9845012366", True),
        ("Shweta Acharya", "9845012367", True),
        ("Raghavendra Joshi", "9845012368", True),
        ("Sangeetha Rao", "9845012369", True),
        ("Harish Salian", "9845012370", True),
        ("Vinay Prasad", "9845012371", True),
        ("Mamata Hegde", "9845012372", True),
        ("Kiran Poojary", "9845012373", True),
        ("Roopa Shenoy", "9845012374", True),
        ("Nitin Pai", "9845012375", True),
        ("Pallavi Nayak", "9845012376", True),
        ("Chetan Bhat", "9845012377", True),
        ("Anuradha K", "9845012378", True),
        ("Madhusudhan R", "9845012379", True),
        ("Shilpa Naik", "9845012380", True),
        ("Ganesh Shenoy", "9845012381", True),
        ("Vandana Shastri", "9845012382", True),
    ]

    db_customers = []
    for name, phone, consent in customer_names:
        c = Customer(
            merchant_id=merchant.id,
            display_name=name,
            phone=phone,
            marketing_consent=consent,
            created_at=datetime.utcnow() - timedelta(days=50)
        )
        db.add(c)
        db_customers.append(c)
    db.commit()

    # 4. Create Historical Orders (115 orders over past 30 days)
    ananya = db_customers[0] # Ananya Sharma: lapsed
    now = datetime.utcnow()

    # Ananya's 8 purchases all occurred between 35 and 48 days ago
    for idx in range(8):
        order_date = now - timedelta(days=35 + (idx * 2), hours=random.randint(9, 20))
        o_num = f"MM{1000 + idx}"
        ord_obj = Order(
            merchant_id=merchant.id,
            customer_id=ananya.id,
            order_number=o_num,
            subtotal=Decimal("180.00"),
            discount_amount=Decimal("0.00"),
            tax_amount=Decimal("0.00"),
            final_amount=Decimal("180.00"),
            status="PAID",
            created_at=order_date,
            paid_at=order_date
        )
        db.add(ord_obj)
        db.flush()

        # Ananya buys Parle-G and Amul Taaza Milk
        oi1 = OrderItem(
            order_id=ord_obj.id,
            product_id=db_products[0].id, # Parle-G
            quantity=3,
            unit_price=Decimal("10.00"),
            unit_cost_snapshot=Decimal("8.00"),
            discount_amount=Decimal("0.00"),
            line_total=Decimal("30.00")
        )
        oi2 = OrderItem(
            order_id=ord_obj.id,
            product_id=db_products[1].id, # Amul Milk
            quantity=5,
            unit_price=Decimal("29.00"),
            unit_cost_snapshot=Decimal("26.00"),
            discount_amount=Decimal("0.00"),
            line_total=Decimal("145.00")
        )
        oi3 = OrderItem(
            order_id=ord_obj.id,
            product_id=db_products[2].id, # Good Day
            quantity=1,
            unit_price=Decimal("20.00"),
            unit_cost_snapshot=Decimal("15.00"),
            discount_amount=Decimal("15.00"),
            line_total=Decimal("5.00")
        )
        db.add_all([oi1, oi2, oi3])

        tx = Transaction(
            order_id=ord_obj.id,
            transaction_reference=f"TXN-{o_num}-{idx}",
            payment_method="UPI_QR",
            amount=Decimal("180.00"),
            status="SUCCESS",
            simulated=True,
            created_at=order_date,
            confirmed_at=order_date
        )
        db.add(tx)

    ananya.first_purchase_at = now - timedelta(days=49)
    ananya.last_purchase_at = now - timedelta(days=35)
    db.commit()

    # Now create 107 more orders over the last 30 days for other customers
    order_counter = 1010
    other_customers = db_customers[1:]

    for day_offset in range(29, -1, -1):
        target_day = (now - timedelta(days=day_offset)).date()
        # Number of orders on this day: 3 to 6
        orders_today = random.randint(3, 6)
        if day_offset == 0:
            # For today: create 4 confirmed orders so dashboard has realistic data
            orders_today = 4

        for _ in range(orders_today):
            order_counter += 1
            o_num = f"MM{order_counter}"

            # Hour distribution: peak around 18 (6 PM) - 19 (7 PM) across 24 hours (0..23)
            weights = [1]*8 + [3]*4 + [5]*4 + [8, 9, 7, 5] + [4]*4 # 8 + 4 + 4 + 4 + 4 = 24 hours
            order_hour = random.choices(range(24), weights=weights)[0]
            order_minute = random.randint(0, 59)
            order_dt = datetime.combine(target_day, time(order_hour, order_minute))

            # Pick customer (or occasionally anonymous)
            cust = random.choice(other_customers) if random.random() > 0.15 else None

            # Pick 1 to 4 products
            chosen_prods = random.sample(db_products, k=random.randint(1, 3))
            subtotal = Decimal("0.00")
            item_objs = []

            for cp in chosen_prods:
                qty = random.randint(1, 3)
                u_price = Decimal(str(cp.selling_price))
                u_cost = Decimal(str(cp.cost_price))
                line_sub = (u_price * Decimal(str(qty))).quantize(Decimal("0.01"))
                subtotal += line_sub

                item_objs.append((cp, qty, u_price, u_cost, line_sub))

            disc_amt = Decimal("0.00")
            if random.random() < 0.2:
                disc_amt = min(Decimal("10.00"), subtotal * Decimal("0.1")).quantize(Decimal("0.01"))

            final_amt = subtotal - disc_amt

            ord_record = Order(
                merchant_id=merchant.id,
                customer_id=cust.id if cust else None,
                order_number=o_num,
                subtotal=subtotal,
                discount_amount=disc_amt,
                tax_amount=Decimal("0.00"),
                final_amount=final_amt,
                status="PAID",
                created_at=order_dt,
                paid_at=order_dt
            )
            db.add(ord_record)
            db.flush()

            for cp, qty, u_price, u_cost, line_sub in item_objs:
                ratio = line_sub / subtotal if subtotal > 0 else Decimal("0.00")
                item_disc = (disc_amt * ratio).quantize(Decimal("0.01"))
                line_total = line_sub - item_disc

                db_item = OrderItem(
                    order_id=ord_record.id,
                    product_id=cp.id,
                    quantity=qty,
                    unit_price=u_price,
                    unit_cost_snapshot=u_cost,
                    discount_amount=item_disc,
                    line_total=line_total
                )
                db.add(db_item)

            tx_record = Transaction(
                order_id=ord_record.id,
                transaction_reference=f"TXN-{o_num}-{random.randint(100,999)}",
                payment_method="UPI_QR",
                amount=final_amt,
                status="SUCCESS",
                simulated=True,
                created_at=order_dt,
                confirmed_at=order_dt
            )
            db.add(tx_record)

            if cust:
                if not cust.first_purchase_at or cust.first_purchase_at > order_dt:
                    cust.first_purchase_at = order_dt
                if not cust.last_purchase_at or cust.last_purchase_at < order_dt:
                    cust.last_purchase_at = order_dt

    db.commit()

    # 5. Seed one completed campaign for demo insights
    camp = Campaign(
        merchant_id=merchant.id,
        name="Diwali Festive Offer",
        objective="REPEAT_PURCHASES",
        message="Celebrate the festive season with Ramesh General Stores! Enjoy 15% off on your next purchase.",
        discount_type="PERCENT",
        discount_value=Decimal("15.00"),
        budget=Decimal("500.00"),
        status="COMPLETED",
        language="en",
        created_at=now - timedelta(days=14),
        approved_at=now - timedelta(days=14)
    )
    db.add(camp)
    db.commit()

    # Assign 25 customers (22 treatment, 3 holdout)
    for idx, c in enumerate(db_customers[:25]):
        is_holdout = (idx % 8 == 0)
        asn = CampaignAssignment(
            campaign_id=camp.id,
            customer_id=c.id,
            group_type="HOLDOUT" if is_holdout else "TREATMENT",
            simulated_delivery_status="EXCLUDED_HOLDOUT" if is_holdout else "DELIVERED",
            assigned_at=now - timedelta(days=14),
            delivered_at=now - timedelta(days=14) if not is_holdout else None
        )
        db.add(asn)

    # Result for Diwali campaign
    res = CampaignResult(
        campaign_id=camp.id,
        observation_period_days=7,
        treatment_revenue=Decimal("4620.00"),
        holdout_revenue=Decimal("510.00"),
        treatment_customers=22,
        holdout_customers=3,
        campaign_cost=Decimal("180.00"),
        incremental_revenue=Decimal("880.00"),
        incremental_gross_profit=Decimal("193.60"),
        roi=Decimal("4.89"),
        generated_at=now - timedelta(days=7),
        simulated=True
    )
    db.add(res)
    db.commit()

    # 6. Audit log initial entries
    log_entry = AuditLog(
        merchant_id=merchant.id,
        actor="System Seed Engine",
        action="DATABASE_SEEDED",
        entity_type="SYSTEM",
        entity_id="SEED-01",
        description="Initialized database with Ramesh General Stores demo merchant, 27 products, 42 customers, and 115 historical orders."
    )
    db.add(log_entry)

    # 7. Initial realistic merchant notifications
    initial_notifs = [
        Notification(
            merchant_id=merchant.id,
            notification_type="PURCHASE",
            title="New sale received!",
            message="Ananya Sharma purchased 5x Parle-G Glucose Biscuits for ₹50.00. (Ref: TXN-MM-20261025-0142)",
            severity="SUCCESS",
            related_entity_type="ORDER",
            related_entity_id="142",
            link="/transactions",
            is_read=False,
            created_at=now - timedelta(hours=2),
            deduplication_key="init_purchase_142"
        ),
        Notification(
            merchant_id=merchant.id,
            notification_type="LOW_STOCK",
            title="Low stock alert: Modern Special Sandwich Bread 400g",
            message="Only 4 units remain (reorder threshold is 8). Based on recent sales, stock may last approximately 1 day.",
            severity="WARNING",
            related_entity_type="PRODUCT",
            related_entity_id="21",
            link="/products",
            is_read=False,
            created_at=now - timedelta(hours=4),
            deduplication_key="init_low_stock_21"
        ),
        Notification(
            merchant_id=merchant.id,
            notification_type="CRITICAL_STOCK",
            title="Critical stock warning!",
            message="Farm Fresh White Eggs 6-Pack may run out within the next 24 hours (5 units left).",
            severity="CRITICAL",
            related_entity_type="PRODUCT",
            related_entity_id="22",
            link="/products",
            is_read=False,
            created_at=now - timedelta(hours=5),
            deduplication_key="init_crit_stock_22"
        )
    ]
    db.add_all(initial_notifs)
    db.commit()
