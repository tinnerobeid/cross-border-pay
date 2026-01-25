from fastapi import FastAPI
from app.core.config import APP_NAME
from app.db.database import Base, engine
from app.api.v1.router import api_router

# Create DB tables (MVP)
Base.metadata.create_all(bind=engine)

app = FastAPI(title=APP_NAME)
app.include_router(api_router)

@app.get("/health")
def health():
    return {"status": "ok", "app": APP_NAME}
