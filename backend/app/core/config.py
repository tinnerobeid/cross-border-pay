from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Zuripay API"
    DATABASE_URL: str = "postgresql+psycopg2://postgres:tina@localhost:5432/zuripay"

    JWT_SECRET_KEY: str = "change-me-in-prod"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24h

    STORAGE_ROOT: str = "./storage"

settings = Settings()
