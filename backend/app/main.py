from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import Base, engine
import logging

from app.api.auth import router as auth_router
from app.api.kyc import router as kyc_router
from app.api.quote import router as quote_router
from app.api.transfers import router as transfers_router
from app.api.admin import router as admin_router
from app.api.recipients import router as recipients_router
from app.api.wallets import router as wallets_router
from app.api.linked_accounts import router as linked_accounts_router
from app.api.webhooks import router as webhooks_router

from app.models import user, kyc, transfer, quote  # noqa: F401
from app.models import recipient, wallet, linked_account  # noqa: F401

try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    _SLOWAPI = True
except ImportError:
    _SLOWAPI = False

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.APP_NAME)

# Add CORS middleware FIRST — before exception handlers so headers are present on all responses
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

if _SLOWAPI:
    limiter = Limiter(key_func=get_remote_address, default_limits=["300/minute"])
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    logger.info("slowapi rate limiting enabled")

# Global exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Validation error on {request.url.path}: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Validation error",
            "errors": exc.errors()
        },
    )

# Global exception handler for general exceptions
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url.path}: {type(exc).__name__}: {str(exc)}", exc_info=True)
    response = JSONResponse(
        status_code=500,
        content={"detail": f"{type(exc).__name__}: {str(exc)}"},
    )
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response

# Create DB tables
Base.metadata.create_all(bind=engine, checkfirst=True)

# Include routers
app.include_router(auth_router)
app.include_router(kyc_router)
app.include_router(quote_router)
app.include_router(transfers_router)
app.include_router(admin_router)
app.include_router(recipients_router)
app.include_router(wallets_router)
app.include_router(linked_accounts_router)
app.include_router(webhooks_router)

@app.get("/")
def health():
    return {"status": "ok", "app": settings.APP_NAME}

@app.get("/health")
def health_check():
    return {"status": "ok"}
