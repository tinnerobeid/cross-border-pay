from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )

    APP_NAME: str = "Zuripay API"
    DATABASE_URL: str = "postgresql+psycopg2://postgres:tina@localhost:5432/zuripay"

    JWT_SECRET_KEY: str = "change-me-in-prod"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24h

    STORAGE_ROOT: str = "./storage"

    # ✅ ADD THIS — FX API KEY
    EXCHANGERATE_HOST_API_KEY: str


settings = Settings()
