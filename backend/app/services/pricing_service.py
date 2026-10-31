from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.product import Product
from app.schemas.order import CartItemSchema, CartDiscountSchema, CalculatedItemSchema, CartValidationResponse

def round_curr(val: Decimal) -> Decimal:
    return val.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

def calculate_cart_totals(
    db: Session,
    merchant_id: int,
    items: List[CartItemSchema],
    discount: Optional[CartDiscountSchema] = None
) -> CartValidationResponse:
    if not items:
        return CartValidationResponse(
            subtotal=Decimal("0.00"),
            discount_amount=Decimal("0.00"),
            tax_amount=Decimal("0.00"),
            final_amount=Decimal("0.00"),
            estimated_gross_profit=Decimal("0.00"),
            items=[],
            is_valid=False,
            error_message="Cart is empty."
        )

    # 1. Fetch products and check inventory
    product_ids = [item.product_id for item in items]
    db_products = db.query(Product).filter(
        Product.id.in_(product_ids),
        Product.merchant_id == merchant_id
    ).all()
    product_map = {p.id: p for p in db_products}

    calculated_items: List[CalculatedItemSchema] = []
    subtotal = Decimal("0.00")

    for item in items:
        product = product_map.get(item.product_id)
        if not product:
            return CartValidationResponse(
                subtotal=Decimal("0.00"),
                discount_amount=Decimal("0.00"),
                tax_amount=Decimal("0.00"),
                final_amount=Decimal("0.00"),
                estimated_gross_profit=Decimal("0.00"),
                items=[],
                is_valid=False,
                error_message=f"Product ID {item.product_id} not found."
            )

        if item.quantity <= 0:
            return CartValidationResponse(
                subtotal=Decimal("0.00"),
                discount_amount=Decimal("0.00"),
                tax_amount=Decimal("0.00"),
                final_amount=Decimal("0.00"),
                estimated_gross_profit=Decimal("0.00"),
                items=[],
                is_valid=False,
                error_message=f"Quantity for '{product.name}' must be greater than zero."
            )

        if item.quantity > product.current_stock:
            return CartValidationResponse(
                subtotal=Decimal("0.00"),
                discount_amount=Decimal("0.00"),
                tax_amount=Decimal("0.00"),
                final_amount=Decimal("0.00"),
                estimated_gross_profit=Decimal("0.00"),
                items=[],
                is_valid=False,
                error_message=f"Insufficient stock for '{product.name}'. Available: {product.current_stock}, Requested: {item.quantity}"
            )

        qty = Decimal(str(item.quantity))
        unit_price = Decimal(str(product.selling_price))
        unit_cost = Decimal(str(product.cost_price))
        line_sub = round_curr(unit_price * qty)
        subtotal += line_sub

        calculated_items.append(CalculatedItemSchema(
            product_id=product.id,
            name=product.name,
            sku=product.sku,
            quantity=item.quantity,
            unit_price=unit_price,
            unit_cost=unit_cost,
            line_subtotal=line_sub,
            allocated_discount=Decimal("0.00"),
            line_total=line_sub,
            estimated_gross_profit=Decimal("0.00")
        ))

    # 2. Calculate discounts
    discount_amount = Decimal("0.00")
    if discount and discount.discount_type != "NONE" and discount.discount_value > 0:
        val = Decimal(str(discount.discount_value))
        if val < 0:
            return CartValidationResponse(
                subtotal=subtotal,
                discount_amount=Decimal("0.00"),
                tax_amount=Decimal("0.00"),
                final_amount=subtotal,
                estimated_gross_profit=Decimal("0.00"),
                items=[],
                is_valid=False,
                error_message="Discount cannot be negative."
            )

        if discount.discount_type == "PERCENT":
            if val > 100:
                return CartValidationResponse(
                    subtotal=subtotal,
                    discount_amount=Decimal("0.00"),
                    tax_amount=Decimal("0.00"),
                    final_amount=subtotal,
                    estimated_gross_profit=Decimal("0.00"),
                    items=[],
                    is_valid=False,
                    error_message="Percentage discount cannot exceed 100%."
                )
            discount_amount = round_curr(subtotal * (val / Decimal("100.00")))
        elif discount.discount_type == "FIXED":
            discount_amount = round_curr(val)
            if discount_amount > subtotal:
                return CartValidationResponse(
                    subtotal=subtotal,
                    discount_amount=Decimal("0.00"),
                    tax_amount=Decimal("0.00"),
                    final_amount=subtotal,
                    estimated_gross_profit=Decimal("0.00"),
                    items=[],
                    is_valid=False,
                    error_message=f"Fixed discount (₹{discount_amount}) cannot exceed the subtotal (₹{subtotal})."
                )

    if discount_amount > subtotal:
        discount_amount = subtotal

    final_amount = round_curr(subtotal - discount_amount)
    if final_amount < 0:
        return CartValidationResponse(
            subtotal=subtotal,
            discount_amount=discount_amount,
            tax_amount=Decimal("0.00"),
            final_amount=Decimal("0.00"),
            estimated_gross_profit=Decimal("0.00"),
            items=[],
            is_valid=False,
            error_message="Final payable amount cannot be negative."
        )

    # 3. Allocate discount proportionally to line items and calculate item gross profit
    total_gross_profit = Decimal("0.00")
    allocated_sum = Decimal("0.00")

    for i, ci in enumerate(calculated_items):
        if subtotal > 0:
            if i == len(calculated_items) - 1:
                # Remaining discount to avoid rounding discrepancy
                item_discount = discount_amount - allocated_sum
            else:
                ratio = ci.line_subtotal / subtotal
                item_discount = round_curr(discount_amount * ratio)
                allocated_sum += item_discount
        else:
            item_discount = Decimal("0.00")

        ci.allocated_discount = item_discount
        ci.line_total = round_curr(ci.line_subtotal - item_discount)
        
        # Gross profit per item: (unit_price - unit_cost) * qty - allocated_discount
        qty_dec = Decimal(str(ci.quantity))
        item_profit = round_curr(((ci.unit_price - ci.unit_cost) * qty_dec) - item_discount)
        ci.estimated_gross_profit = item_profit
        total_gross_profit += item_profit

    return CartValidationResponse(
        subtotal=round_curr(subtotal),
        discount_amount=round_curr(discount_amount),
        tax_amount=Decimal("0.00"),
        final_amount=round_curr(final_amount),
        estimated_gross_profit=round_curr(total_gross_profit),
        items=calculated_items,
        is_valid=True,
        error_message=None
    )
