from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    # Server
    APP_NAME: str = "Silent Guardian API"
    DEBUG: bool = False
    PORT: int = 8000
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "http://localhost:8000"]
    
    # Database
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "silent_guardian"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # JWT
    SECRET_KEY: str = "your-super-secret-key-change-this"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # Admin
    ADMIN_EMAIL: str = "admin@silentguardian.com"
    ADMIN_PASSWORD: str = "admin123"
    
    # Frontend
    FRONTEND_URL: str = "http://localhost:5173"
    ADMIN_URL: str = "http://localhost:5173/admin"
    
    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "support@silentguardian.com"
    
    # Twilio SMS
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    
    # Crypto Wallets
    CRYPTO_WALLET_TRC20: str = "TXuZVqQ8UQrLkqkLkqkLkqkLkqkLkqkL"
    CRYPTO_WALLET_ERC20: str = "0x742d35Cc6634C0532925a3b844Bc9e7595f0b0a0"
    CRYPTO_WALLET_BEP20: str = "0x742d35Cc6634C0532925a3b844Bc9e7595f0b0a0"
    
    # MTN Mobile Money
    MTN_API_URL: str = "https://sandbox.mtn.co.ug/momo"
    MTN_SUBSCRIPTION_KEY: str = ""
    MTN_API_USER: str = ""
    MTN_API_KEY: str = ""
    
    # Airtel Mobile Money
    AIRTEL_API_URL: str = "https://openapi.airtel.ug/merchant"
    AIRTEL_CLIENT_ID: str = ""
    AIRTEL_CLIENT_SECRET: str = ""
    
    # Stripe
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    
    # QR Code
    QR_CODE_BASE_URL: str = "https://silentguardian.com/pay"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()