import httpx
import sys

sys.stdout.reconfigure(encoding='utf-8')

base_url = "http://127.0.0.1:8000"

print("1. Testing Notifications:")
r_notif = httpx.get(f"{base_url}/api/notifications")
print("Notifications status:", r_notif.status_code, "Unread count:", r_notif.json().get("unread_count"))

print("\n2. Testing Ask Mitra Out of Scope:")
r_oos = httpx.post(f"{base_url}/api/assistant/ask", json={
    "message": "Who is the Chief Minister of Karnataka?",
    "language": "en"
})
print("OOS Intent:", r_oos.json().get("intent"))
print("OOS Reply:", r_oos.json().get("reply"))

print("\n3. Testing Ask Mitra Category Query (Biscuits):")
r_cat = httpx.post(f"{base_url}/api/assistant/ask", json={
    "message": "How much biscuit stock is available?",
    "language": "en"
})
print("Category Intent:", r_cat.json().get("intent"))
print("Category Reply:", r_cat.json().get("reply"))

print("\n4. Testing Ask Mitra Product Query (Parle-G):")
r_prod = httpx.post(f"{base_url}/api/assistant/ask", json={
    "message": "How many Parle-G packets are left?",
    "language": "en"
})
print("Product Intent:", r_prod.json().get("intent"))
print("Product Reply:", r_prod.json().get("reply"))

print("\n4b. Testing Ask Mitra Highest Sold Product (User Query):")
r_top1 = httpx.post(f"{base_url}/api/assistant/ask", json={
    "message": "today highest sold product",
    "language": "en"
})
print("Top Product Intent (today highest sold product):", r_top1.json().get("intent"))
print("Top Product Reply:", r_top1.json().get("reply"))

r_top2 = httpx.post(f"{base_url}/api/assistant/ask", json={
    "message": "wt was the highest sold product of tdy",
    "language": "en"
})
print("Top Product Intent (wt was the highest sold product of tdy):", r_top2.json().get("intent"))
print("Top Product Reply:", r_top2.json().get("reply"))

print("\n6. Testing Order Creation & QR Code Generation:")
r_order = httpx.post(f"{base_url}/api/orders", json={
    "items": [{"product_id": 1, "quantity": 2}],
    "discount": {"discount_type": "NONE", "discount_value": 0}
})
print("Create Order Status:", r_order.status_code)
order_data = r_order.json()
order_id = order_data.get("id")
print("Created Order ID:", order_id, "Order Number:", order_data.get("order_number"), "Amount:", order_data.get("final_amount"))

r_qr = httpx.post(f"{base_url}/api/payments/generate-qr", json={"order_id": order_id})
print("Generate QR Status:", r_qr.status_code)
qr_json = r_qr.json()
print("QR Txn Reference:", qr_json.get("transaction_reference"))
print("QR Base64 Present:", bool(qr_json.get("qr_code_base64")))
print("QR UPI URI:", qr_json.get("upi_uri"))
