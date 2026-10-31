import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="allow")

    PROJECT_NAME: str = "MerchantMitra"
    DATABASE_URL: str = "sqlite:///./merchant_mitra.db"
    DEMO_MERCHANT_ID: int = 1
    DEMO_MERCHANT_NAME: str = "Ramesh"
    DEMO_BUSINESS_NAME: str = "Ramesh General Stores"
    DEMO_LOCATION: str = "Bengaluru, Karnataka"
    DEMO_CURRENCY: str = "INR"
    DEMO_TIMEZONE: str = "Asia/Kolkata"
    DEMO_UPI_VPA: str = "demo-merchant@upi"
    
    # AI / LLM Configuration
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"
    USE_OLLAMA_IF_AVAILABLE: bool = True

settings = Settings()
