from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )

    APP_NAME: str = "Zuripay API"
    # Default to SQLite for MVP; can switch to PostgreSQL
    DATABASE_URL: str = "sqlite:///./zuripay.db"

    JWT_SECRET_KEY: str = "change-me-in-prod-use-strong-random-key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24h

    STORAGE_ROOT: str = "./storage"

    # FX API KEY (optional for MVP)
    EXCHANGERATE_HOST_API_KEY: str = "free"
    
    # Environment
    ENVIRONMENT: str = "development"


settings = Settings()
