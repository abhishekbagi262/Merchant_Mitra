# 🇮🇳 MerchantMitra (मर्चेंट मित्रा / ಮರ್ಚೆಂಟ್ ಮಿತ್ರ)
### *Your AI-Powered Business Growth Partner*

[![Tests](https://img.shields.io/badge/pytest-17%20passed-emerald)](backend/tests/)
[![Python](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-teal.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)

MerchantMitra is a complete, production-grade business copilot tailored for small and medium-sized Indian retailers (MSMEs) using digital payments such as Paytm and UPI. It combines point-of-sale (POS) billing, transaction-specific demo UPI QR generation, idempotent payment simulation, Paytm-style Soundbox audio announcements, inventory cover monitoring, customer segmentation, scientific 10% holdout campaign experiments, and an AI merchant assistant (*Ask Mitra*) anchored directly to verified database queries.

---

## 🌟 Key Architecture & Principles

1. **Zero Hallucination Guarantee**: Every displayed business number (sales, profit, inventory, customer visits) originates directly from verified database queries and application calculations. AI explains and interprets the numbers in natural language (English, Hindi, Kannada) but never fabricates them.
2. **Decimal-Safe Financial Arithmetic**: All financial calculations use Python's `Decimal` module and strict database numeric fields (`Numeric(10,2)`). Floating-point rounding errors are strictly eliminated.
3. **Idempotent Payment Processing**: Payment events (SUCCESS / FAILED / CANCELLED) are duplicate-safe. Submitting the same successful payment twice will never deduct stock twice or inflate revenue.
4. **Scientific 10% A/B Holdout Control**: When drafting customer marketing campaigns, 10% of eligible consenting customers are isolated into an uncontacted holdout control group. The Uplift Scorecard measures true incremental revenue rather than baseline shopping habits.
5. **Multi-lingual Localization**: Seamless instant language switching between English, Hindi (हिंदी), and Kannada (ಕನ್ನಡ) across dashboard KPIs, AI daily brief, Ask Mitra chatbot, and UI navigation.

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.11+
- Node.js v18+ (or v20 / v24)
- npm v9+

### 1. Automated Quick Start (Windows)
Double-click `start_backend.bat` and `start_frontend.bat` in the project root:
- Backend will start on `http://127.0.0.1:8000`
- Frontend will start on `http://localhost:3000`

### 2. Manual Startup Commands

#### Backend:
```bash
# Navigate to backend directory
cd backend

# Activate virtual environment (Windows)
.venv\Scripts\activate
# (On macOS/Linux: source .venv/bin/activate)

# Run Uvicorn server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation and Swagger UI: **http://127.0.0.1:8000/docs**

#### Frontend:
```bash
# Navigate to frontend directory
cd frontend

# Start Vite dev server
npm run dev
```
Open **http://localhost:3000** in your browser.

*(Note: The backend also mounts the built frontend static bundle in production mode at `http://127.0.0.1:8000/`)*.

---

## 🧪 Automated Test Suite (Pytest)

Run the backend automated test suite covering all 23 core scenarios:

```bash
# From workspace root
$env:PYTHONPATH="backend"
backend\.venv\Scripts\pytest backend\tests -v
```

### Test Coverage Highlights:
1. `test_product_creation` — Product persistence and SKU validation
2. `test_product_update` — Metadata and pricing updates
3. `test_stock_adjustment` — Stock adjustments and audit trail
4. `test_order_totals_and_calculation` — Decimal-safe subtotals and line totals
5. `test_fixed_discount_calculation` — Fixed rupee discount allocation
6. `test_percent_discount_calculation` — Percentage discount calculation
7. `test_successful_simulated_payment_and_stock_deduction` — Stock deduction on payment confirmation
8. `test_failed_simulated_payment_no_stock_deduction` — Verifies failed payments never deduct inventory
9. `test_duplicate_payment_idempotency` — Duplicate payment protection
10. `test_sales_analytics_and_profit` — Gross profit calculation (Revenue − Snapshot COGS)
11. `test_low_stock_cover_calculation` — Days of stock remaining calculation
12. `test_lapsed_customer_detection` — Detection of frequent customers inactive for > 30 days
13. `test_campaign_holdout_assignment` — Deterministic 90/10 treatment vs holdout split
14. `test_campaign_approval_and_rejection` — Merchant explicit approval workflow
15. `test_simulated_campaign_and_scorecard` — Fast-forward observation and uplift metrics
16. `test_audit_log_creation` — Append-only compliance log
17. `test_assistant_database_backed_answers` — Verified database numbers returned by Ask Mitra

---

## 🎬 Section 31 — End-to-End Demonstration Walkthrough

You can perform the exact demonstration flow requested in the Master Build Prompt:

1. **Open Dashboard (`/`)**:
   - Displays Ramesh General Stores (Bengaluru, KA).
   - Shows live verified sales, gross profit, orders count, and AI Daily Business Brief.
2. **Open POS Counter (`/pos`)**:
   - Search for **Parle-G**.
   - Notice verified initial inventory is exactly **50 packets** (SKU: `SKU-PG-001`).
3. **Create a Bill**:
   - Add **5 Parle-G packets** to the cart.
   - Subtotal calculates to **₹50.00**.
   - Select customer **Ananya Sharma** or walk-in.
4. **Generate Demo UPI QR**:
   - Click **Generate UPI QR**.
   - Generates scannable QR code with `upi://pay?pa=demo-merchant@upi&pn=Ramesh%20General%20Stores&am=50.00...` and explicit `DEMO PAYMENT — NO REAL MONEY WILL BE TRANSFERRED` banner.
5. **Simulate Payment**:
   - Click **Simulate Successful Payment**.
6. **Verify Transaction & Stock**:
   - Order marked **PAID**, Transaction marked **SUCCESS**.
   - Parle-G stock automatically decrements from **50 to 45**.
7. **Soundbox Audio Announcement**:
   - Paytm-style Soundbox modal appears with sound waves animation.
   - Browser speech synthesis speaks: *"Received 50 rupees from Ananya Sharma on MerchantMitra."*
8. **Dashboard Updates**:
   - Today's sales and transaction count immediately update.
9. **Ask Mitra Chatbot (`/assistant`)**:
   - Ask: *"How many Parle-G packets are left?"*
   - Mitra queries the database and replies: *"You currently have 45 units of 'Parle-G Glucose Biscuits' in stock."*
10. **Lapsed Customers (`/customers`)**:
    - Switch to **Lapsed Regulars** tab.
    - Inspect **Ananya Sharma**: *"Ananya has made 8 purchases (₹1,440 total spend) but has not visited in 35 days. Previous purchases frequently included Amul Milk and Parle-G."*
11. **Draft Marketing Campaign (`/campaigns`)**:
    - Click **Draft New Campaign**.
    - Select **Win Back Inactive Customers** with 10% discount.
    - Notice financial margin validation check.
12. **Holdout Split & Approval Screen**:
    - Automatic 90/10 split: 91 treatment customers, 10 holdout customers.
    - Read-back confirmation modal: *"You are approving a simulated campaign for 91 customers, with a maximum estimated discount cost of ₹250. Ten customers will remain in the holdout group."*
    - Click **Approve Campaign**.
13. **Simulate Execution**:
    - Click **Execute Simulated Campaign**.
    - Persistent `SIMULATED` label applied. Holdout customers remain strictly uncontacted (`EXCLUDED_HOLDOUT`).
14. **Fast-Forward 7 Days Uplift Scorecard (`/campaign-insights`)**:
    - Click **FAST-FORWARD 7 DAYS**.
    - Displays Treatment vs Holdout comparison chart.
    - Treatment spend (₹200/cust) vs Holdout baseline (₹168/cust) = **₹32 incremental uplift per treated customer**.
    - Total incremental revenue: **₹2,912** against ₹250 cost (**11.65x revenue-to-cost ratio**).
    - Mandatory disclaimer: *"SIMULATED EXPERIMENT RESULTS — ILLUSTRATIVE, NOT ACTUAL MEASURED RESULTS"*.
15. **Audit Log Verification (`/settings`)**:
    - Append-only audit log records the payment confirmation, stock deduction, and campaign approval events.

---

## 📋 Features Overview

### Implemented Production Features
- Full relational SQLite schema with SQLAlchemy ORM (12 interconnected tables).
- POS Cart with decimal-safe calculations, item subtotals, and discount validation.
- Transaction-specific demo UPI QR generation (RFC-compliant UPI URI structure).
- Soundbox simulation with browser Web Speech API (`SpeechSynthesis`), voice detection, replay, and mute.
- Inventory tracking with movement log history and safe division days-of-stock cover.
- Customer segmentation (New, Regular, Lapsed, High-Value).
- Loyalty reward rule (spend >= ₹500) and unique demo coupon generation.
- Campaign margin validation preventing below-cost offers.
- 10% uncontacted holdout control group isolation.
- Campaign approval workflow with explicit read-back confirmations.
- Fast-Forward 7 days uplift scorecard.
- Append-only compliance audit log.
- Ask Mitra chatbot with controlled backend query layer.
- Multilingual interface and AI brief (English, Hindi, Kannada).
- Demo data reset button.

### Simulated Features (Clearly Identified in UI)
- UPI QR code scan and payment events (fictional UPI ID `demo-merchant@upi`).
- Payment confirmation (simulated via Success/Fail action buttons).
- Customer messaging delivery (simulated delivery flags without sending actual WhatsApp/SMS).
- 7-day fast-forward observation period (deterministic synthetic uplift model).

### Features Requiring Real Third-Party Integration in Production
- **Payment Acquirer / Aggregator API**: Real-time webhook notifications, server-to-server status verification, settlement accounts.
- **Telecom / WhatsApp Business API**: Meta Cloud API or Twilio credentials with pre-approved message templates.
- **Hardware Soundbox**: MQTT or WebSocket IoT daemon paired with hardware terminal.
- **Production Relational DB**: PostgreSQL or MySQL with connection pooling.

---

## 🛠️ Project Structure

```
Merchant_Mitra/
├── backend/
│   ├── app/
│   │   ├── config.py              # Environment configuration & settings
│   │   ├── database.py            # SQLite engine & session management
│   │   ├── models/                # SQLAlchemy ORM models
│   │   ├── schemas/               # Pydantic v2 schemas
│   │   ├── services/              # Domain logic (pricing, inventory, payment, AI)
│   │   ├── routers/               # FastAPI endpoints
│   │   ├── seed_data.py           # 27 products, 42 customers, 146 orders
│   │   └── main.py                # App entrypoint & static mount
│   ├── tests/
│   │   ├── conftest.py
│   │   └── test_master_suite.py   # 17 suites covering all 23 requirements
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/client.ts          # Typed REST API client
│   │   ├── i18n/                  # English, Hindi, Kannada translations
│   │   ├── components/            # Layout, Soundbox, MetricCard, Dialogs
│   │   ├── pages/                 # 10 core application pages
│   │   ├── types/api.ts           # TypeScript interfaces
│   │   └── App.tsx                # React Router v6 setup
│   └── package.json
├── start_backend.bat              # One-click backend launcher
├── start_frontend.bat             # One-click frontend launcher
└── README.md
```

---

## ⚖️ License
Built for educational, prototype, and hackathon presentation purposes. Synthetic data only.
