from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )

    APP_NAME: str = "Zuripay API"
    # PostgreSQL connection string
    DATABASE_URL: str = "postgresql+psycopg2://zuripay:zuripay@localhost:5432/zuripay"

    JWT_SECRET_KEY: str = "change-me-in-prod-use-strong-random-key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24h

    STORAGE_ROOT: str = "./storage"

    # FX API KEY
    EXCHANGERATE_HOST_API_KEY: str = "free"

    # ── Email (Gmail SMTP) ────────────────────────────────────────────────────
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""          # your Gmail address
    SMTP_PASSWORD: str = ""      # Gmail App Password (not your login password)
    EMAIL_FROM_NAME: str = "ZuriPay"

    # ── SMS (Africa's Talking) ────────────────────────────────────────────────
    AT_USERNAME: str = ""          # your Africa's Talking username
    AT_API_KEY: str = ""           # your API key from the dashboard
    AT_SENDER_ID: str = "ZuriPay" # optional shortcode/sender name
    AT_PRODUCT_NAME: str = "ZuriPay"  # AT Payments product name

    # ── Webhooks ──────────────────────────────────────────────────────────────
    WEBHOOK_SECRET: str = ""  # shared secret for HMAC webhook verification

    # ── Transaction limits (per-currency JSON, 0 = unlimited) ────────────────
    # Override in .env: DAILY_SEND_LIMIT_JSON='{"TZS": 10000000, "USD": 5000}'
    DAILY_SEND_LIMIT_JSON: str = (
        '{"TZS": 5000000, "KES": 200000, "USD": 2000, '
        '"KRW": 2500000, "UGX": 7000000, "RWF": 2000000, "BIF": 4000000}'
    )
    MONTHLY_SEND_LIMIT_JSON: str = (
        '{"TZS": 20000000, "KES": 800000, "USD": 8000, '
        '"KRW": 10000000, "UGX": 28000000, "RWF": 8000000, "BIF": 16000000}'
    )

    # Environment
    ENVIRONMENT: str = "development"


settings = Settings()
