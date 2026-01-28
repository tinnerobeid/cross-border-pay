from fastapi import FastAPI
from app.core.config import settings
from app.db.database import Base, engine

from app.api.auth import router as auth_router
from app.api.kyc import router as kyc_router
from app.api.quote import router as quote_router
from app.api.transfers import router as transfers_router
from app.api.admin import router as admin_router

from app.models import user, kyc, transfer  # noqa: F401

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.APP_NAME)

app.include_router(auth_router)
app.include_router(kyc_router)
app.include_router(quote_router)
app.include_router(transfers_router)
app.include_router(admin_router)

@app.get("/")
def health():
    return {"status": "ok", "app": settings.APP_NAME}
