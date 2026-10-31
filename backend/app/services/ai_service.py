import re
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, Any, List, Optional, Tuple
import httpx
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.config import settings
from app.models.merchant import Merchant
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order, OrderItem
from app.models.transaction import Transaction
from app.schemas.brief import DailyBriefResponse, RecommendationItem
from app.schemas.assistant import AssistantQueryResponse, SuggestedQuestion
from app.services.analytics_service import get_dashboard_kpis
from app.services.inventory_service import calculate_stock_cover
from app.services.customer_service import get_lapsed_customers, get_loyalty_eligible_customers

def query_ollama(prompt: str, system_prompt: str) -> Optional[str]:
    """
    Attempts to call local Ollama model if configured and running.
    Fails gracefully to None so deterministic templates take over.
    """
    if not settings.USE_OLLAMA_IF_AVAILABLE:
        return None

    try:
        url = f"{settings.OLLAMA_BASE_URL}/api/generate"
        payload = {
            "model": settings.OLLAMA_MODEL,
            "prompt": prompt,
            "system": system_prompt,
            "stream": False,
            "options": {"temperature": 0.2}
        }
        with httpx.Client(timeout=3.0) as client:
            resp = client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                return data.get("response", "").strip()
    except Exception:
        # Graceful fallback: Ollama not running or timed out
        pass
    return None

def generate_daily_brief(db: Session, merchant_id: int, language: str = "en") -> DailyBriefResponse:
    kpis = get_dashboard_kpis(db, merchant_id)
    lang = language.lower()

    # Dynamic Merchant & Business Name
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    merchant_name = merchant.name if merchant and merchant.name else settings.DEMO_MERCHANT_NAME
    store_name = merchant.business_name if merchant and merchant.business_name else settings.DEMO_BUSINESS_NAME

    # Low stock list
    low_stock_names = [item.name for item in kpis.low_stock_alerts]
    low_stock_summary = [
        f"{item.name} ({item.current_stock} left, ~{item.days_left or '<1'} days cover)"
        for item in kpis.low_stock_alerts[:3]
    ]

    # Growth text
    growth_str = f"+{kpis.sales_growth_pct}%" if kpis.sales_growth_pct and kpis.sales_growth_pct > 0 else (f"{kpis.sales_growth_pct}%" if kpis.sales_growth_pct is not None else "N/A")

    # Generate Actionable Recommendations based on REAL data
    recs: List[RecommendationItem] = []

    # 1. Low stock recommendation
    if kpis.low_stock_alerts:
        crit = kpis.low_stock_alerts[0]
        if lang == "hi":
            recs.append(RecommendationItem(
                title=f"{crit.name} का स्टॉक कम है",
                action="सप्लायर से तुरंत रीऑर्डर करें",
                reason=f"वर्तमान स्टॉक केवल {crit.current_stock} यूनिट्स है, जो अनुमानित रूप से समाप्त हो सकता है।",
                supporting_data=f"स्टॉक: {crit.current_stock}, रीऑर्डर सीमा: {crit.reorder_threshold}",
                estimated_benefit="स्टॉकआउट से बिक्री के नुकसान को रोकें",
                priority="HIGH"
            ))
        elif lang == "kn":
            recs.append(RecommendationItem(
                title=f"{crit.name} ದಾಸ್ತಾನು ಕಡಿಮೆಯಾಗಿದೆ",
                action="ಪೂರೈಕೆದಾರರಿಂದ ಮರು-ಆರ್ಡರ್ ಮಾಡಿ",
                reason=f"ಪ್ರಸ್ತುತ ದಾಸ್ತಾನು ಕೇವಲ {crit.current_stock} ಯುನಿಟ್‌ಗಳು ಉಳಿದಿವೆ.",
                supporting_data=f"ದಾಸ್ತಾನು: {crit.current_stock}, ಮಿತಿ: {crit.reorder_threshold}",
                estimated_benefit="ಮಾರಾಟ ನಷ್ಟ ತಪ್ಪಿಸಿ",
                priority="HIGH"
            ))
        else:
            recs.append(RecommendationItem(
                title=f"Replenish {crit.name} Stock",
                action="Place reorder with distributor today",
                reason=f"Current stock is down to {crit.current_stock} units (~{crit.days_left or '<1'} days of inventory remaining).",
                supporting_data=f"Stock: {crit.current_stock}, Threshold: {crit.reorder_threshold}",
                estimated_benefit="Prevent stock-out and retain estimated daily revenue",
                priority="HIGH"
            ))

    # 2. Peak hour prep
    if kpis.peak_business_hour:
        if lang == "hi":
            recs.append(RecommendationItem(
                title=f"पीक समय ({kpis.peak_business_hour}) की तैयारी",
                action="काउंटर पर तेजी से बिलिंग के लिए तैयार रहें",
                reason=f"शाम के {kpis.peak_business_hour} में ग्राहकों की संख्या सबसे अधिक दर्ज की गई है।",
                supporting_data="ऐतिहासिक ऑर्डर टाइमिंग डेटा",
                estimated_benefit="ग्राहकों के प्रतीक्षा समय को कम करें",
                priority="MEDIUM"
            ))
        elif lang == "kn":
            recs.append(RecommendationItem(
                title=f"ಹೆಚ್ಚಿನ ವ್ಯಾಪಾರದ ಸಮಯ ({kpis.peak_business_hour}) ಸಿದ್ಧತೆ",
                action="ಕೌಂಟರ್‌ನಲ್ಲಿ ತ್ವರಿತ ಬಿಲ್ಲಿಂಗ್‌ಗೆ ಸಿದ್ಧರಾಗಿರಿ",
                reason=f"{kpis.peak_business_hour} ಸಮಯದಲ್ಲಿ ಅತಿ ಹೆಚ್ಚು ಗ್ರಾಹಕರು ಭೇಟಿ ನೀಡುತ್ತಾರೆ.",
                supporting_data="ಐತಿಹಾಸಿಕ ಆರ್ಡರ್ ಸಮಯ ಡೇಟಾ",
                estimated_benefit="ಗ್ರಾಹಕರ ಸರತಿ ಸಾಲು ಕಡಿಮೆ ಮಾಡಿ",
                priority="MEDIUM"
            ))
        else:
            recs.append(RecommendationItem(
                title=f"Prepare for Peak Window ({kpis.peak_business_hour})",
                action="Keep fast-moving items near billing counter",
                reason=f"Data confirms highest transaction velocity occurs during {kpis.peak_business_hour}.",
                supporting_data="Hourly transaction timestamps",
                estimated_benefit="Shorten queue time and boost throughput by 15%",
                priority="MEDIUM"
            ))

    # 3. Lapsed customer campaign
    lapsed_customers = get_lapsed_customers(db, merchant_id, min_purchases=3, inactivity_days=25)
    if lapsed_customers:
        count_lapsed = len(lapsed_customers)
        if lang == "hi":
            recs.append(RecommendationItem(
                title=f"{count_lapsed} निष्क्रिय ग्राहकों को पुनः आकर्षित करें",
                action="व्हाट्सएप / एसएमएस अभियान चलाएं",
                reason="नियमित ग्राहक जो पिछले 25+ दिनों से नहीं आए हैं, उन्हें 10% छूट संदेश भेजें।",
                supporting_data=f"{count_lapsed} नियमित ग्राहक 25+ दिनों से निष्क्रिय हैं",
                estimated_benefit=f"अनुमानित अतिरिक्त बिक्री: ₹{count_lapsed * 150}",
                priority="MEDIUM"
            ))
        elif lang == "kn":
            recs.append(RecommendationItem(
                title=f"{count_lapsed} ನಿಷ್ಕ್ರಿಯ ಗ್ರಾಹಕರನ್ನು ಮರಳಿ ತನ್ನಿ",
                action="ರಿಯಾಯಿತಿ ಅಭಿಯಾನ ಪ್ರಾರಂಭಿಸಿ",
                reason="ಹಿಂದೆ ನಿಯಮಿತವಾಗಿ ಭೇಟಿ ನೀಡುತ್ತಿದ್ದ ಗ್ರಾಹಕರು 25+ ದಿನಗಳಿಂದ ಬಂದಿಲ್ಲ.",
                supporting_data=f"{count_lapsed} ಗ್ರಾಹಕರು 25+ ದಿನಗಳಿಂದ ನಿಷ್ಕ್ರಿಯ",
                estimated_benefit=f"ಅಂದಾಜು ಹೆಚ್ಚುವರಿ ಮಾರಾಟ: ₹{count_lapsed * 150}",
                priority="MEDIUM"
            ))
        else:
            recs.append(RecommendationItem(
                title=f"Reactivate {count_lapsed} Lapsed Regulars",
                action="Launch targeted win-back campaign with holdout",
                reason="Frequent customers who haven't visited in 25+ days can be revitalized with a modest offer.",
                supporting_data=f"{count_lapsed} customers with >= 3 past purchases inactive > 25d",
                estimated_benefit=f"Potential incremental revenue of ~₹{count_lapsed * 180}",
                priority="MEDIUM"
            ))

    # Construct Narrative dynamically with merchant_name and store_name
    if lang == "hi":
        narrative = (
            f"नमस्ते {merchant_name} जी। आपकी दुकान ({store_name}) ने आज ₹{kpis.today_sales} की कुल बिक्री दर्ज की है "
            f"({kpis.today_transactions_count} सफल बिल)। कल की बिक्री ₹{kpis.yesterday_sales} थी "
            f"(बदलाव: {growth_str})। आपका अनुमानित सकल लाभ ₹{kpis.estimated_gross_profit} रहा। "
            f"आज का सबसे अधिक बिकने वाला उत्पाद '{kpis.best_selling_product}' रहा, और सबसे व्यस्त समय {kpis.peak_business_hour} था। "
        )
        if low_stock_names:
            narrative += f"कृपया ध्यान दें: {', '.join(low_stock_names[:2])} का स्टॉक कम है और जल्द समाप्त हो सकता है।"
        else:
            narrative += "सभी प्रमुख उत्पादों का स्टॉक वर्तमान में सुरक्षित स्थिति में है।"
    elif lang == "kn":
        narrative = (
            f"ನಮಸ್ಕಾರ {merchant_name} ಅವರೇ. ನಿಮ್ಮ ಅಂಗಡಿ ({store_name})ಯಲ್ಲಿ ಇಂದು ₹{kpis.today_sales} ಮೊತ್ತದ ಮಾರಾಟವಾಗಿದೆ "
            f"({kpis.today_transactions_count} ಯಶಸ್ವಿ ಬಿಲ್‌ಗಳು). ನಿನ್ನೆಯ ಮಾರಾಟ ₹{kpis.yesterday_sales} ಆಗಿತ್ತು "
            f"(ಬೆಳವಣಿಗೆ: {growth_str}). ಇಂದಿನ ಅಂದಾಜು ಒಟ್ಟು ಲಾಭ ₹{kpis.estimated_gross_profit}. "
            f"ಹೆಚ್ಚು ಮಾರಾಟವಾದ ಸರಕು '{kpis.best_selling_product}', ಮತ್ತು ಅತ್ಯಂತ ಜನನಿಬಿಡ ಸಮಯ {kpis.peak_business_hour} ಆಗಿತ್ತು. "
        )
        if low_stock_names:
            narrative += f"ಗಮನಿಸಿ: {', '.join(low_stock_names[:2])} ದಾಸ್ತಾನು ಕಡಿಮೆಯಾಗಿದೆ."
        else:
            narrative += "ಎಲ್ಲಾ ಪ್ರಮುಖ ವಸ್ತುಗಳ ದಾಸ್ತಾನು ಆರೋಗ್ಯಕರ ಮಟ್ಟದಲ್ಲಿದೆ."
    else:
        narrative = (
            f"Good day, {merchant_name}. Your store ({store_name}) generated ₹{kpis.today_sales} today across {kpis.today_transactions_count} orders "
            f"(yesterday: ₹{kpis.yesterday_sales}, change: {growth_str}). "
            f"Estimated gross profit is ₹{kpis.estimated_gross_profit} with an average bill value of ₹{kpis.average_bill_value}. "
            f"'{kpis.best_selling_product}' was your top-selling product. Peak sales velocity was observed during {kpis.peak_business_hour}. "
        )
        if low_stock_names:
            narrative += f"Inventory alert: {', '.join(low_stock_names[:2])} stock is running low and needs restocking soon."
        else:
            narrative += "All fast-moving inventory items are currently in healthy stock."

    return DailyBriefResponse(
        generated_at=datetime.utcnow(),
        language=lang,
        merchant_name=merchant_name,
        store_name=store_name,
        today_sales=kpis.today_sales,
        yesterday_sales=kpis.yesterday_sales,
        growth_pct=kpis.sales_growth_pct,
        transactions_count=kpis.today_transactions_count,
        average_bill_value=kpis.average_bill_value,
        estimated_gross_profit=kpis.estimated_gross_profit,
        peak_sales_hour=kpis.peak_business_hour,
        top_selling_product=kpis.best_selling_product,
        low_stock_summary=low_stock_summary,
        brief_narrative=narrative,
        actionable_recommendations=recs
    )


# --- CATEGORY SYNONYMS MAPPING ---
CATEGORY_SYNONYMS: Dict[str, List[str]] = {
    "Biscuits": ["biscuit", "biscuits", "cookie", "cookies", "बिस्कुट", "बिस्किट", "ಬಿಸ್ಕತ್ತು", "ಬಿಸ್ಕೆಟ್"],
    "Dairy": ["dairy", "curd", "paneer", "दूध", "दही", "अंडे", "ಹಾಲು", "ಮೊಸರು", "ಮೊಟ್ಟೆ"],
    "Snacks": ["snack", "snacks", "chips", "namkeen", "noodles", "नमकीन", "स्नैक्स", "ಕುರುಕುಲು", "ತಿಂಡಿ"],
    "Staples": ["staple", "staples", "grain", "grains", "rice", "wheat", "flour", "dal", "toor dal", "sugar", "salt", "अनाज", "चावल", "आटा", "दाल", "चीनी", "नमक", "ಅಕ್ಕಿ", "ಹಿಟ್ಟು", "ಬೇಳೆ", "ಸಕ್ಕರೆ", "ಉಪ್ಪು"],
    "Oils": ["oil", "oils", "ghee", "sunflower oil", "cooking oil", "तेल", "घी", "ಎಣ್ಣೆ", "ತುಪ್ಪ"],
    "Beverages": ["beverage", "beverages", "tea", "coffee", "drink", "drinks", "soda", "cola", "चाय", "कॉफ़ी", "ಕೋಲ್ಡ್ ಡ್ರಿಂಕ್", "ಟೀ", "ಕಾಫಿ"],
    "Personal Care": ["personal care", "toothpaste", "handwash", "sanitary", "साबुन", "टूथपेस्ट", "ಸೋಪು"],
    "Household": ["household", "detergent", "dishwash", "सर्फ़", "ಡಿಟರ್ಜೆಂಟ್"],
    "Bakery": ["bakery", "bread", "bun", "ब्रेड", "ಬ್ರೆಡ್"],
    "Spices": ["spice", "spices", "masala", "pepper", "garam masala", "मसाला", "मसाले", "ಮಸಾಲೆ"],
}

# --- OUT OF SCOPE PHRASES ---
OUT_OF_SCOPE_PHRASES = [
    "chief minister", "prime minister", "president", "capital of", "weather", "forecast",
    "cricket", "score", "match", "world cup", "ipl", "football", "fifa", "movie", "song",
    "cinema", "actor", "actress", "celebrity", "joke", "tell me a joke", "recipe for",
    "history of", "who invented", "distance between", "population of", "politics", "election",
    "who is the cm", "who is the pm", "karnataka cm", "siddaramaiah", "modi", "rishi sunak",
    "trump", "biden", "meaning of life"
]


def find_matching_product(query: str, products: List[Product]) -> Optional[Product]:
    """
    Robust token and brand matcher:
    Matches 'Parle-G', 'parle g', 'parleg', 'good day', 'nandini', 'amul', etc.
    """
    q_lower = query.lower()
    q_clean = re.sub(r'[^a-z0-9]', '', q_lower)
    q_words = set(re.findall(r'[a-z0-9]+', q_lower))

    # 1. Exact or partial brand name priority
    brand_priority = [
        ("parle", ["parle", "parleg"]),
        ("good day", ["goodday", "britannia"]),
        ("amul", ["amul", "taaza"]),
        ("tata salt", ["tata", "salt"]),
        ("atta", ["aashirvaad", "atta", "sharbati"]),
        ("fortune", ["fortune", "sunflower"]),
        ("maggi", ["maggi", "noodles"]),
        ("red label", ["redlabel", "brooke"]),
        ("bru", ["bru", "coffee"]),
        ("dettol", ["dettol"]),
        ("lifebuoy", ["lifebuoy", "handwash"]),
        ("surf excel", ["surf", "detergent"]),
        ("vim", ["vim", "dishwash"]),
        ("aloo bhujia", ["haldiram", "bhujia"]),
        ("lays", ["lays", "magicmasala"]),
        ("kurkure", ["kurkure"]),
        ("thums up", ["thumsup", "thumbsup"]),
        ("coca-cola", ["cocacola", "coke"]),
        ("colgate", ["colgate", "toothpaste"]),
        ("bread", ["bread", "sandwich"]),
        ("eggs", ["egg", "eggs"]),
        ("basmati", ["daawat", "basmati", "rice"]),
        ("sugar", ["madhur", "sugar"]),
        ("toor dal", ["toor", "dal"]),
        ("garam masala", ["everest", "garam"]),
        ("black pepper", ["pepper", "catch"]),
    ]

    for brand_key, tokens in brand_priority:
        if any(token in q_clean or token in q_words for token in tokens):
            for p in products:
                p_lower = p.name.lower()
                if brand_key in p_lower or any(tok in p_lower for tok in tokens):
                    return p

    # 2. Substring & Token Overlap
    best_product = None
    best_score = 0
    for p in products:
        p_name_lower = p.name.lower()
        p_clean = re.sub(r'[^a-z0-9]', '', p_name_lower)
        if p_name_lower in q_lower or p_clean in q_clean:
            return p

        p_words = set(re.findall(r'[a-z0-9]+', p_name_lower))
        common = len(p_words.intersection(q_words))
        if common > best_score and common >= 2:
            best_score = common
            best_product = p

    return best_product


def match_category(query: str) -> Optional[str]:
    """
    Identifies if the query is asking about a product category
    e.g., 'biscuit stock', 'how much dairy do I have', 'show snacks'
    """
    q_lower = query.lower()
    for category, syns in CATEGORY_SYNONYMS.items():
        for syn in syns:
            # Check standalone word match
            pattern = rf'\b{re.escape(syn)}\b'
            if re.search(pattern, q_lower) or syn in q_lower:
                return category
    return None


def answer_ask_mitra_query(
    db: Session,
    merchant_id: int,
    query: str,
    language: str = "en"
) -> AssistantQueryResponse:
    """
    CONTROLLED BACKEND QUERY LAYER:
    1. Check for Out-Of-Scope questions honestly.
    2. Check for Category-Level Inventory Queries (e.g. Biscuits, Dairy, Snacks).
    3. Check for Specific Product Stock & Price Inquiries (e.g. Parle-G, Good Day).
    4. Check for Business Analytics Inquiries (Sales, Profit, Peak Hour).
    5. Check for Customer Inquiries (Lapsed Regulars, Loyalty Rewards).
    6. Provide clear, non-hallucinated explanations strictly backed by SQLite ledger facts.
    """
    q = query.lower().strip()
    lang = language.lower()

    # Normalization for common texting abbreviations, speech variations, and typos
    abbrev_map = {
        r'\bwt\b': 'what',
        r'\bwat\b': 'what',
        r'\bwts\b': 'what is',
        r'\btdy\b': 'today',
        r'\b2day\b': 'today',
        r'\byday\b': 'yesterday',
        r'\bprod\b': 'product',
        r'\bprods\b': 'products',
        r'\bmax\b': 'highest',
        r'\btopmost\b': 'highest',
        r'\bpop\b': 'popular',
        r'\bqty\b': 'quantity',
        r'\bamt\b': 'amount',
    }
    for pattern, repl in abbrev_map.items():
        q = re.sub(pattern, repl, q)

    # Dynamic Merchant & Store info
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    merchant_name = merchant.name if merchant and merchant.name else settings.DEMO_MERCHANT_NAME
    store_name = merchant.business_name if merchant and merchant.business_name else settings.DEMO_BUSINESS_NAME

    suggested_q = [
        SuggestedQuestion(id="1", label="Today's Sales", query="How much did I sell today?"),
        SuggestedQuestion(id="2", label="Parle-G Stock", query="What is my current stock of Parle-G?"),
        SuggestedQuestion(id="3", label="Biscuit Category", query="How much biscuit stock is available?"),
        SuggestedQuestion(id="4", label="Gross Profit", query="How much gross profit did I make?"),
        SuggestedQuestion(id="5", label="Low Stock Items", query="Which products may run out soon?"),
        SuggestedQuestion(id="6", label="Lapsed Customers", query="Who are my inactive frequent customers?"),
    ]

    # --- STEP 1: OUT-OF-SCOPE DETECTION ---
    is_out_of_scope = any(phrase in q for phrase in OUT_OF_SCOPE_PHRASES)
    # Check if asking general questions like 'who is...' without store terms
    if ("who is" in q or "what is the capital" in q or "weather" in q) and not any(term in q for term in ["customer", "product", "stock", "sales", "store", "mitra", "ramesh", "suresh"]):
        is_out_of_scope = True

    if is_out_of_scope:
        if lang == "hi":
            reply = (
                f"नमस्ते {merchant_name} जी। मैं मित्रा हूँ, केवल आपकी दुकान ({store_name}) का समर्पित व्यापार सहायक। "
                f"मैं केवल आपकी दुकान की बिक्री, उत्पाद स्टॉक, सकल लाभ और ग्राहक विवरण से संबंधित प्रश्नों का उत्तर दे सकता हूँ। "
                f"कृपया अपनी दुकान से संबंधित प्रश्न पूछें, जैसे: 'Parle-G का कितना स्टॉक है?' या 'आज की कुल बिक्री कितनी हुई?'"
            )
        elif lang == "kn":
            reply = (
                f"ನಮಸ್ಕಾರ {merchant_name} ಅವರೇ. ನಾನು ಮಿತ್ರ, ನಿಮ್ಮ ಅಂಗಡಿ ({store_name})ಯ ವಿಶೇಷ ವ್ಯಾಪಾರ ಸಹಾಯಕ ಮಾತ್ರ. "
                f"ಅಂಗಡಿಯ ಮಾರಾಟ, ದಾಸ್ತಾನು, ಒಟ್ಟು ಲಾಭ ಮತ್ತು ನಿಯಮಿತ ಗ್ರಾಹಕರ ವಿವರಗಳನ್ನು ಮಾತ್ರ ನಾನು ವಿಶ್ಲೇಷಿಸಬಲ್ಲೆ. "
                f"ಉದಾಹರಣೆಗೆ: 'Parle-G ದಾಸ್ತಾನು ಎಷ್ಟಿದೆ?' ಅಥವಾ 'ಇಂದಿನ ಒಟ್ಟು ಮಾರಾಟ ಎಷ್ಟು?' ಎಂದು ಕೇಳಿ."
            )
        else:
            reply = (
                f"Hello {merchant_name}. I am Mitra, exclusively your in-store retail business copilot for {store_name}. "
                f"I am designed to answer factual questions regarding your store's sales ledger, inventory levels, gross profit, and customer loyalty. "
                f"I cannot answer general trivia or off-topic questions. Try asking: 'How much biscuit stock is available?' or 'How much did I sell today?'"
            )

        return AssistantQueryResponse(
            reply=reply,
            intent="OUT_OF_SCOPE_HONESTY",
            language=lang,
            structured_data={"out_of_scope": True, "store_name": store_name},
            suggested_questions=suggested_q
        )

    # Fetch all merchant products
    all_products = db.query(Product).filter(Product.merchant_id == merchant_id).all()

    # --- STEP 2: SPECIFIC PRODUCT STOCK / PRICE INQUIRY ---
    # Give priority to specific named products (e.g. Parle-G, Good Day, Tata Salt)
    matched_product = find_matching_product(q, all_products)
    if matched_product and any(k in q for k in ["stock", "left", "how many", "packets", "units", "price", "cost", "available", "ದಾಸ್ತಾನು", "ಬೆಲೆ", "स्टॉक", "कीमत"]):
        cover = calculate_stock_cover(db, matched_product)
        stock_val = matched_product.current_stock
        p_name = matched_product.name
        sp = matched_product.selling_price
        cp = matched_product.cost_price

        if lang == "hi":
            reply = (
                f"'{p_name}' का वर्तमान स्टॉक: {stock_val} पैकेट/यूनिट्स। "
                f"बिक्री मूल्य: ₹{sp}, लागत: ₹{cp}। "
                f"रीऑर्डर सीमा: {matched_product.reorder_threshold} यूनिट्स। {cover.recommendation}"
            )
        elif lang == "kn":
            reply = (
                f"'{p_name}' ಸರಕಿನ ಪ್ರಸ್ತುತ ದಾಸ್ತಾನು: {stock_val} ಯುನಿಟ್‌ಗಳು. "
                f"ಮಾರಾಟ ಬೆಲೆ: ₹{sp}, ವೆಚ್ಚ: ₹{cp}. "
                f"ಮರು-ಆರ್ಡರ್ ಮಿತಿ: {matched_product.reorder_threshold}. {cover.recommendation}"
            )
        else:
            reply = (
                f"You currently have {stock_val} units of '{p_name}' in stock (Selling Price: ₹{sp}, Cost: ₹{cp}). "
                f"Reorder threshold is {matched_product.reorder_threshold} units. {cover.recommendation}"
            )

        return AssistantQueryResponse(
            reply=reply,
            intent="PRODUCT_STOCK_INQUIRY",
            language=lang,
            structured_data={
                "product_id": matched_product.id,
                "product_name": matched_product.name,
                "current_stock": stock_val,
                "selling_price": str(sp),
                "cost_price": str(cp),
                "reorder_threshold": matched_product.reorder_threshold,
                "days_left": cover.days_left,
                "status": cover.status
            },
            suggested_questions=[
                SuggestedQuestion(id="p1", label="Biscuit Category", query="How much biscuit stock is available?"),
                SuggestedQuestion(id="p2", label="Low Stock Items", query="Which products may run out soon?"),
                SuggestedQuestion(id="p3", label="Today's Sales", query="How much did I sell today?"),
            ]
        )

    # --- STEP 3: CATEGORY-LEVEL INVENTORY INQUIRY ---
    # e.g., "How much biscuit stock is available?", "Show dairy inventory", "What snacks do I have?"
    matched_cat = match_category(q)
    cat_query_indicators = ["category", "stock", "left", "available", "units", "inventory", "how much", "how many", "show", "list", "ದಾಸ್ತಾನು", "ಸ್ಟಾಕ್", "स्टॉक"]
    
    if matched_cat and any(ind in q for ind in cat_query_indicators):
        cat_products = [p for p in all_products if p.category.lower() == matched_cat.lower()]
        total_units = sum(p.current_stock for p in cat_products)
        items_breakdown = [f"{p.name}: {p.current_stock} units (₹{p.selling_price})" for p in cat_products]
        low_in_cat = [p.name for p in cat_products if p.current_stock <= p.reorder_threshold]

        if lang == "hi":
            reply = (
                f"आपकी दुकान में '{matched_cat}' श्रेणी में कुल {len(cat_products)} उत्पाद और {total_units} यूनिट्स उपलब्ध हैं। "
                f"विवरण: {', '.join(items_breakdown[:4])}। "
            )
            if low_in_cat:
                reply += f"चेतावनी: {', '.join(low_in_cat)} का स्टॉक रीऑर्डर सीमा पर या उससे कम है।"
            else:
                reply += "इस श्रेणी के सभी उत्पादों का स्टॉक सुरक्षित स्थिति में है।"
        elif lang == "kn":
            reply = (
                f"ನಿಮ್ಮ ಅಂಗಡಿಯಲ್ಲಿ '{matched_cat}' ವಿಭಾಗದಲ್ಲಿ ಒಟ್ಟು {len(cat_products)} ವಸ್ತುಗಳು ಮತ್ತು {total_units} ಯುನಿಟ್‌ಗಳ ದಾಸ್ತಾನು ಲಭ್ಯವಿದೆ. "
                f"ವಿವರ: {', '.join(items_breakdown[:4])}. "
            )
            if low_in_cat:
                reply += f"ಎಚ್ಚರಿಕೆ: {', '.join(low_in_cat)} ದಾಸ್ತಾನು ಕಡಿಮೆಯಾಗಿದೆ."
            else:
                reply += "ಈ ವಿಭಾಗದ ಎಲ್ಲಾ ಸರಕುಗಳ ದಾಸ್ತಾನು ಆರೋಗ್ಯಕರ ಮಟ್ಟದಲ್ಲಿದೆ."
        else:
            reply = (
                f"You currently have {total_units} total units across {len(cat_products)} products in the '{matched_cat}' category. "
                f"Breakdown: {'; '.join(items_breakdown[:4])}. "
            )
            if low_in_cat:
                reply += f"Reorder alert: {', '.join(low_in_cat)} is running low."
            else:
                reply += "All items in this category are comfortably stocked."

        return AssistantQueryResponse(
            reply=reply,
            intent="CATEGORY_INVENTORY_INQUIRY",
            language=lang,
            structured_data={
                "category": matched_cat,
                "total_units": total_units,
                "product_count": len(cat_products),
                "products": [
                    {"name": p.name, "current_stock": p.current_stock, "selling_price": str(p.selling_price)}
                    for p in cat_products
                ]
            },
            suggested_questions=[
                SuggestedQuestion(id="c1", label=f"Reorder {matched_cat}", query=f"Which {matched_cat} items need reordering?"),
                SuggestedQuestion(id="c2", label="Today's Sales", query="How much did I sell today?"),
                SuggestedQuestion(id="c3", label="Gross Profit", query="How much gross profit did I make?"),
            ]
        )

    # --- STEP 4: HIGHEST / BEST SELLING PRODUCT INQUIRY ---
    # Handles: "today highest sold product", "wt was the highest sold product of tdy", "what was the best selling product", "most sold item", "top selling product"
    is_top_product_query = (
        ("highest" in q or "top" in q or "best" in q or "most" in q or "शीर्ष" in q or "सबसे ज्यादा" in q or "ಹೆಚ್ಚು" in q) and
        ("sold" in q or "sell" in q or "selling" in q or "seller" in q or "product" in q or "item" in q or "बिकने" in q or "ಮಾರಾಟ" in q)
    ) or "best seller" in q or "top seller" in q or "bestseller" in q or "highest sold" in q or "most sold" in q

    if is_top_product_query:
        kpis = get_dashboard_kpis(db, merchant_id)
        top_name = kpis.best_selling_product or "No sales recorded yet today"
        top_items = kpis.top_products

        if top_items and len(top_items) > 0:
            top_first = top_items[0]
            top_name = top_first.name
            units_sold = top_first.units_sold
            rev = top_first.total_revenue
            runner_up_text = ""
            if len(top_items) > 1:
                runner_ups = [f"'{p.name}' ({p.units_sold} units, ₹{p.total_revenue})" for p in top_items[1:3]]
                runner_up_text = f" Runner-ups include {', '.join(runner_ups)}."

            if lang == "hi":
                reply = (
                    f"आज आपकी दुकान का सबसे अधिक बिकने वाला उत्पाद '{top_name}' है, "
                    f"जिसकी कुल {units_sold} यूनिट्स बिकी हैं (कुल राजस्व: ₹{rev})।"
                )
            elif lang == "kn":
                reply = (
                    f"ಇಂದು ನಿಮ್ಮ ಅಂಗಡಿಯಲ್ಲಿ ಅತಿ ಹೆಚ್ಚು ಮಾರಾಟವಾದ ಸರಕು '{top_name}'. "
                    f"ಒಟ್ಟು {units_sold} ಯುನಿಟ್‌ಗಳು ಮಾರಾಟವಾಗಿದ್ದು ₹{rev} ಆದಾಯ ತಂದಿದೆ."
                )
            else:
                reply = (
                    f"Today's highest-selling product is '{top_name}' with {units_sold} units sold, "
                    f"generating ₹{rev} in revenue.{runner_up_text}"
                )
        else:
            if lang == "hi":
                reply = f"आज का शीर्ष उत्पाद '{top_name}' है।"
            elif lang == "kn":
                reply = f"ಇಂದಿನ ಪ್ರಮುಖ ಮಾರಾಟವಾದ ಸರಕು '{top_name}'."
            else:
                reply = f"Today's highest-selling product is '{top_name}'."

        return AssistantQueryResponse(
            reply=reply,
            intent="BEST_SELLING_PRODUCT_INQUIRY",
            language=lang,
            structured_data={
                "best_selling_product": top_name,
                "rankings": [
                    {"name": p.name, "units_sold": p.units_sold, "revenue": str(p.total_revenue)}
                    for p in top_items
                ] if top_items else []
            },
            suggested_questions=[
                SuggestedQuestion(id="tp1", label="Today's Sales", query="How much did I sell today?"),
                SuggestedQuestion(id="tp2", label="Gross Profit", query="How much gross profit did I make?"),
                SuggestedQuestion(id="tp3", label="Stock of " + top_name.split()[0], query=f"What is the stock of {top_name.split()[0]}?"),
            ]
        )

    # --- STEP 5: TOTAL ORDERS / BILL COUNT INQUIRY ---
    if ("how many order" in q or "how many bill" in q or "total bill" in q or "order count" in q or "orders today" in q or "bills today" in q or "कुल बिल" in q or "ಎಷ್ಟು ಬಿಲ್" in q):
        kpis = get_dashboard_kpis(db, merchant_id)
        if lang == "hi":
            reply = f"आज आपकी दुकान पर कुल {kpis.today_transactions_count} ऑर्डर/बिल पूरे हुए हैं, जिनका औसत मूल्य ₹{kpis.average_bill_value} है।"
        elif lang == "kn":
            reply = f"ಇಂದು ನಿಮ್ಮ ಅಂಗಡಿಯಲ್ಲಿ ಒಟ್ಟು {kpis.today_transactions_count} ಆರ್ಡರ್‌ಗಳು/ಬಿಲ್‌ಗಳು ಪೂರ್ಣಗೊಂಡಿವೆ (ಸರಾಸರಿ ಬಿಲ್ ಮೌಲ್ಯ: ₹{kpis.average_bill_value})."
        else:
            reply = f"Your store completed {kpis.today_transactions_count} orders today with an average bill value of ₹{kpis.average_bill_value}."

        return AssistantQueryResponse(
            reply=reply,
            intent="ORDER_COUNT_INQUIRY",
            language=lang,
            structured_data={"today_orders": kpis.today_transactions_count, "average_bill": str(kpis.average_bill_value)},
            suggested_questions=suggested_q
        )

    # --- STEP 6: TODAY'S SALES / REVENUE ---
    if "today" in q and ("sale" in q or "revenue" in q or "how much" in q or "कमाई" in q or "बिक्री" in q or "ಮಾರಾಟ" in q):
        kpis = get_dashboard_kpis(db, merchant_id)
        if lang == "hi":
            reply = f"आज आपकी दुकान पर कुल ₹{kpis.today_sales} की बिक्री हुई है ({kpis.today_transactions_count} सफल बिल, औसत बिल: ₹{kpis.average_bill_value})।"
        elif lang == "kn":
            reply = f"ಇಂದು ನಿಮ್ಮ ಅಂಗಡಿಯಲ್ಲಿ ಒಟ್ಟು ₹{kpis.today_sales} ಮಾರಾಟವಾಗಿದೆ ({kpis.today_transactions_count} ಯಶಸ್ವಿ ಬಿಲ್‌ಗಳು, ಸರಾಸರಿ ಬಿಲ್: ₹{kpis.average_bill_value})."
        else:
            reply = (
                f"Your store generated ₹{kpis.today_sales} in total sales today across {kpis.today_transactions_count} completed orders. "
                f"Average bill value is ₹{kpis.average_bill_value}."
            )
        return AssistantQueryResponse(
            reply=reply,
            intent="TODAY_SALES_INQUIRY",
            language=lang,
            structured_data={
                "today_sales": str(kpis.today_sales),
                "orders_count": kpis.today_transactions_count,
                "average_bill": str(kpis.average_bill_value)
            },
            suggested_questions=suggested_q
        )

    # --- STEP 5: YESTERDAY'S SALES ---
    if "yesterday" in q or "कल" in q or "ನಿನ್ನೆ" in q:
        kpis = get_dashboard_kpis(db, merchant_id)
        if lang == "hi":
            reply = f"कल आपकी दुकान की कुल बिक्री ₹{kpis.yesterday_sales} दर्ज की गई थी।"
        elif lang == "kn":
            reply = f"ನಿನ್ನೆ ನಿಮ್ಮ ಒಟ್ಟು ಮಾರಾಟ ₹{kpis.yesterday_sales} ಆಗಿತ್ತು."
        else:
            reply = f"Yesterday's total sales were ₹{kpis.yesterday_sales}."
        return AssistantQueryResponse(
            reply=reply,
            intent="YESTERDAY_SALES_INQUIRY",
            language=lang,
            structured_data={"yesterday_sales": str(kpis.yesterday_sales)},
            suggested_questions=suggested_q
        )

    # --- STEP 6: GROSS PROFIT / MARGIN INQUIRY ---
    if "profit" in q or "margin" in q or "लाभ" in q or "मुनाफा" in q or "ಲಾಭ" in q:
        kpis = get_dashboard_kpis(db, merchant_id)
        if lang == "hi":
            reply = (
                f"आज का अनुमानित सकल लाभ ₹{kpis.estimated_gross_profit} है। "
                f"यह उत्पाद की बिक्री मूल्य और खरीद लागत (Snapshot COGS) के अंतर तथा दी गई छूटों पर आधारित है।"
            )
        elif lang == "kn":
            reply = (
                f"ಇಂದಿನ ಅಂದಾಜು ಒಟ್ಟು ಲಾಭ ₹{kpis.estimated_gross_profit}. "
                f"ಇದು ಮಾರಾಟ ಬೆಲೆ, ಖರೀದಿ ವೆಚ್ಚ ಮತ್ತು ರಿಯಾಯಿತಿಗಳನ್ನು ಆಧರಿಸಿದೆ."
            )
        else:
            reply = (
                f"Your estimated gross profit today is ₹{kpis.estimated_gross_profit}. "
                f"This is derived as Sum of (Selling Price - Cost) × Qty minus discounts. Operating overheads (rent, electricity) are not deducted."
            )
        return AssistantQueryResponse(
            reply=reply,
            intent="GROSS_PROFIT_INQUIRY",
            language=lang,
            structured_data={"estimated_gross_profit": str(kpis.estimated_gross_profit)},
            suggested_questions=suggested_q
        )

    # --- STEP 7: LOW STOCK / CRITICAL / REORDER PRODUCTS ---
    if ("low stock" in q or "run out" in q or "reorder" in q or "running low" in q or "critical" in q or "खत्म" in q or "ದಾಸ್ತಾನು ಕೊರತೆ" in q):
        kpis = get_dashboard_kpis(db, merchant_id)
        alerts = kpis.low_stock_alerts
        if not alerts:
            reply = "Great news! All products currently have healthy stock above their reorder thresholds."
        else:
            items_str = ", ".join([f"{a.name} ({a.current_stock} left, threshold: {a.reorder_threshold})" for a in alerts[:4]])
            if lang == "hi":
                reply = f"ये उत्पाद जल्द समाप्त हो सकते हैं और इन्हें रीऑर्डर करने की सलाह दी जाती है: {items_str}।"
            elif lang == "kn":
                reply = f"ಈ ಸರಕುಗಳ ದಾಸ್ತಾನು ಕಡಿಮೆಯಾಗಿದೆ ಮತ್ತು ಮರು-ಆರ್ಡರ್ ಮಾಡಬೇಕಾಗಿದೆ: {items_str}."
            else:
                reply = f"The following products have low stock and should be reordered soon: {items_str}."
        return AssistantQueryResponse(
            reply=reply,
            intent="LOW_STOCK_INQUIRY",
            language=lang,
            structured_data={"low_stock_count": len(alerts), "products": [a.name for a in alerts]},
            suggested_questions=suggested_q
        )

    # --- STEP 8: INACTIVE / LAPSED CUSTOMERS ---
    if ("inactive" in q or "lapsed" in q or "not visited" in q or "lost" in q or "पुराने ग्राहक" in q or "ನಿಷ್ಕ್ರಿಯ ಗ್ರಾಹಕರು" in q):
        lapsed = get_lapsed_customers(db, merchant_id, min_purchases=3, inactivity_days=30)
        if not lapsed:
            reply = "No frequent customers are currently identified as lapsed (inactive for >30 days)."
        else:
            top_lapsed = lapsed[:3]
            names_summary = ", ".join([f"{c.display_name} ({c.days_inactive} days inactive, {c.previous_purchase_count} past visits)" for c in top_lapsed])
            if lang == "hi":
                reply = f"आपके {len(lapsed)} नियमित ग्राहक 30+ दिनों से नहीं आए हैं। प्रमुख ग्राहक: {names_summary}। आप इन्हें 'अभियान' पेज से री-एक्टिवेट कर सकते हैं।"
            elif lang == "kn":
                reply = f"ನಿಮ್ಮ {len(lapsed)} ನಿಯಮಿತ ಗ್ರಾಹಕರು 30+ ದಿನಗಳಿಂದ ಭೇಟಿ ನೀಡಿಲ್ಲ: {names_summary}."
            else:
                reply = (
                    f"You have {len(lapsed)} frequent customers who haven't visited in over 30 days. "
                    f"Top examples: {names_summary}. You can launch a targeted holdout campaign to win them back."
                )
        return AssistantQueryResponse(
            reply=reply,
            intent="LAPSED_CUSTOMERS_INQUIRY",
            language=lang,
            structured_data={"lapsed_count": len(lapsed), "customers": [c.display_name for c in lapsed[:5]]},
            suggested_questions=suggested_q
        )

    # --- STEP 9: LOYALTY REWARDS ELIGIBILITY ---
    if ("loyalty" in q or "reward" in q or "coupon" in q or "रिवार्ड" in q or "लॉयल्टी" in q or "ಲಾಯಲ್ಟಿ" in q):
        eligible = get_loyalty_eligible_customers(db, merchant_id, threshold=Decimal("500.00"))
        pending = [e for e in eligible if e.eligible]
        if not pending:
            reply = "All high-spending customers (cumulative purchases >= ₹500) have already received active coupons."
        else:
            first_three = ", ".join([f"{e.display_name} (₹{e.cumulative_spend} spent)" for e in pending[:3]])
            if lang == "hi":
                reply = f"कुल {len(pending)} ग्राहक ₹500+ की खरीदारी के साथ लॉयल्टी रिवार्ड के पात्र हैं: {first_three}।"
            elif lang == "kn":
                reply = f"ಒಟ್ಟು {len(pending)} ಗ್ರಾಹಕರು ₹500+ ಖರೀದಿಗಾಗಿ ಲಾಯಲ್ಟಿ ಬಹುಮಾನಕ್ಕೆ ಅರ್ಹರಾಗಿದ್ದಾರೆ: {first_three}."
            else:
                reply = f"{len(pending)} customer(s) qualify for a loyalty reward with cumulative purchases >= ₹500: {first_three}."
        return AssistantQueryResponse(
            reply=reply,
            intent="LOYALTY_ELIGIBILITY_INQUIRY",
            language=lang,
            structured_data={"eligible_count": len(pending)},
            suggested_questions=suggested_q
        )

    # --- STEP 10: PEAK BUSINESS HOUR ---
    if "busiest" in q or "peak" in q or "hour" in q or "व्यस्त" in q or "ಸಮಯ" in q:
        kpis = get_dashboard_kpis(db, merchant_id)
        if lang == "hi":
            reply = f"आपकी दुकान का सबसे व्यस्त समय {kpis.peak_business_hour} है।"
        elif lang == "kn":
            reply = f"ನಿಮ್ಮ ಅಂಗಡಿಯ ಅತ್ಯಂತ ಜನನಿಬಿಡ ಸಮಯ {kpis.peak_business_hour} ಆಗಿದೆ."
        else:
            reply = f"Your highest sales velocity occurs during {kpis.peak_business_hour}."
        return AssistantQueryResponse(
            reply=reply,
            intent="PEAK_HOUR_INQUIRY",
            language=lang,
            structured_data={"peak_hour": kpis.peak_business_hour},
            suggested_questions=suggested_q
        )

    # --- STEP 11: GENERAL ASSISTANT GUIDANCE ---
    kpis = get_dashboard_kpis(db, merchant_id)
    if lang == "hi":
        reply = (
            f"नमस्ते {merchant_name} जी! मैं मित्रा हूँ, {store_name} का व्यापार सहायक। "
            f"आज आपकी दुकान ने ₹{kpis.today_sales} की कुल बिक्री दर्ज की है ({kpis.today_transactions_count} बिल)। "
            f"शीर्ष उत्पाद '{kpis.best_selling_product}' है। "
            f"आप मुझसे किसी उत्पाद का स्टॉक (जैसे 'Parle-G का स्टॉक'), श्रेणी विवरण (जैसे 'बिस्कुट का स्टॉक'), सकल लाभ, या निष्क्रिय ग्राहकों के बारे में पूछ सकते हैं।"
        )
    elif lang == "kn":
        reply = (
            f"ನಮಸ್ಕಾರ {merchant_name} ಅವರೇ! ನಾನು ನಿಮ್ಮ ಮಿತ್ರ, {store_name} ವ್ಯಾಪಾರ ಸಹಾಯಕ. "
            f"ಇಂದು ನಿಮ್ಮ ಅಂಗಡಿಯಲ್ಲಿ ₹{kpis.today_sales} ಮೊತ್ತದ ಮಾರಾಟವಾಗಿದೆ ({kpis.today_transactions_count} ಬಿಲ್‌ಗಳು). "
            f"ಹೆಚ್ಚು ಮಾರಾಟವಾದ ಸರಕು '{kpis.best_selling_product}'. "
            f"ಯಾವುದೇ ಸರಕಿನ ದಾಸ್ತಾನು, ವಿಭಾಗ, ಒಟ್ಟು ಲಾಭ ಅಥವಾ ಗ್ರಾಹಕರ ಬಗ್ಗೆ ನೀವು ನನ್ನನ್ನು ಕೇಳಬಹುದು."
        )
    else:
        reply = (
            f"Hello {merchant_name}! I am Mitra, your in-store retail business assistant for {store_name}. "
            f"Today your store recorded ₹{kpis.today_sales} in confirmed sales across {kpis.today_transactions_count} orders. "
            f"Estimated gross profit is ₹{kpis.estimated_gross_profit}, and '{kpis.best_selling_product}' is your top seller. "
            f"Ask me about specific product inventory (e.g. 'Parle-G stock'), category inventory (e.g. 'biscuit stock'), profit margins, or inactive regular customers."
        )

    return AssistantQueryResponse(
        reply=reply,
        intent="GENERAL_STATUS_INQUIRY",
        language=lang,
        structured_data={
            "merchant_name": merchant_name,
            "store_name": store_name,
            "today_sales": str(kpis.today_sales),
            "orders": kpis.today_transactions_count,
            "top_product": kpis.best_selling_product
        },
        suggested_questions=suggested_q
    )
