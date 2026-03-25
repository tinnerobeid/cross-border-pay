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

    # Environment
    ENVIRONMENT: str = "development"


settings = Settings()
