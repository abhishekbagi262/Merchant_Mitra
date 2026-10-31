from typing import Optional
from pydantic import BaseModel, ConfigDict

class MerchantSettingsUpdate(BaseModel):
    name: str
    business_name: str
    location: str
    currency: str = "INR"
    timezone: str = "Asia/Kolkata"
    preferred_language: str = "en"
    voice_enabled: bool = True
    auto_login_greeting: bool = True
    voice_responses: bool = True
    preferred_speech_lang: str = "en"
    notify_purchases: bool = True
    notify_low_stock: bool = True
    notify_profit_decline: bool = True
    profit_decline_threshold_pct: int = 20

class MerchantSettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    business_name: str
    location: str
    currency: str
    timezone: str
    preferred_language: str = "en"
    voice_enabled: bool = True
    auto_login_greeting: bool = True
    voice_responses: bool = True
    preferred_speech_lang: str = "en"
    notify_purchases: bool = True
    notify_low_stock: bool = True
    notify_profit_decline: bool = True
    profit_decline_threshold_pct: int = 20
