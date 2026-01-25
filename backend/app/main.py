from fastapi import FastAPI
from app.core.config import APP_NAME
from app.db.database import Base, engine
from app.api.v1.router import api_router

from app.models.user import User  # noqa
from app.models.kyc import KYCProfile  # noqa
from app.models.transfer import Transfer  # noqa

Base.metadata.create_all(bind=engine)

app = FastAPI(title=APP_NAME)
app.include_router(api_router)

@app.get("/health")
def health():
    return {"status": "ok", "app": APP_NAME}
