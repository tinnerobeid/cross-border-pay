from fastapi import APIRouter
from app.api.v1.transfers import router as transfers_router
from app.api.v1.auth import router as auth_router
from app.api.v1.kyc import router as kyc_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router)
api_router.include_router(kyc_router)
api_router.include_router(transfers_router)
