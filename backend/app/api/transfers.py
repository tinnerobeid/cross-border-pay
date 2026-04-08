import json

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Response
from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import datetime
from decimal import Decimal

from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.transfer import Transfer
from app.models.wallet import Wallet
from app.models.kyc import KYCProfile
from app.schemas.transfer import TransferCreate, TransferOut
from app.services.pricing_engine import PricingEngine
from app.services.routing_service import choose_provider
from app.core.config import settings
from app.core.logger import logger


_EXCLUDED_STATUSES = {"CANCELLED", "FAILED"}


def _check_limits(db: Session, user_id: int, currency: str, new_amount: Decimal) -> None:
    """Raise 429 if adding new_amount would breach the user's daily or monthly limit."""
    currency = currency.upper()
    now = datetime.utcnow()

    daily_limits: dict = json.loads(settings.DAILY_SEND_LIMIT_JSON)
    monthly_limits: dict = json.loads(settings.MONTHLY_SEND_LIMIT_JSON)

    def _spent(since: datetime) -> Decimal:
        total = (
            db.query(func.sum(Transfer.send_amount))
            .filter(
                Transfer.user_id == user_id,
                Transfer.send_currency == currency,
                Transfer.status.notin_(_EXCLUDED_STATUSES),
                Transfer.created_at >= since,
            )
            .scalar()
        )
        return Decimal(str(total or 0))

    daily_limit = daily_limits.get(currency)
    if daily_limit:
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        if _spent(start_of_day) + new_amount > Decimal(str(daily_limit)):
            raise HTTPException(
                status_code=429,
                detail=f"Daily transfer limit of {int(daily_limit):,} {currency} reached. Try again tomorrow.",
            )

    monthly_limit = monthly_limits.get(currency)
    if monthly_limit:
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if _spent(start_of_month) + new_amount > Decimal(str(monthly_limit)):
            raise HTTPException(
                status_code=429,
                detail=f"Monthly transfer limit of {int(monthly_limit):,} {currency} reached.",
            )


def _is_linked_phone(db: Session, phone: str) -> bool:
    """Return True if the given phone belongs to a registered Halisi user."""
    if not phone:
        return False
    return db.query(User).filter(User.phone == phone.strip()).first() is not None


router = APIRouter(prefix="/transfers", tags=["Transfers"])

_engine = PricingEngine(quote_ttl_seconds=300)


@router.get("/limits", response_model=dict)
def get_my_limits(
    currency: str = Query(..., description="Currency code, e.g. TZS"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Return how much the user has sent today/this month and what the limits are."""
    currency = currency.upper()
    now = datetime.utcnow()

    daily_limits: dict = json.loads(settings.DAILY_SEND_LIMIT_JSON)
    monthly_limits: dict = json.loads(settings.MONTHLY_SEND_LIMIT_JSON)

    def _spent(since: datetime) -> float:
        total = (
            db.query(func.sum(Transfer.send_amount))
            .filter(
                Transfer.user_id == user.id,
                Transfer.send_currency == currency,
                Transfer.status.notin_(_EXCLUDED_STATUSES),
                Transfer.created_at >= since,
            )
            .scalar()
        )
        return float(total or 0)

    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    daily_limit = daily_limits.get(currency)
    monthly_limit = monthly_limits.get(currency)
    daily_spent = _spent(start_of_day)
    monthly_spent = _spent(start_of_month)

    return {
        "currency": currency,
        "daily": {
            "limit": daily_limit,
            "spent": daily_spent,
            "remaining": max(0, (daily_limit or 0) - daily_spent) if daily_limit else None,
        },
        "monthly": {
            "limit": monthly_limit,
            "spent": monthly_spent,
            "remaining": max(0, (monthly_limit or 0) - monthly_spent) if monthly_limit else None,
        },
    }


@router.get("/lookup", response_model=dict)
def lookup_recipient(
    phone: str = Query(..., description="Recipient phone number to check"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Check if a phone number belongs to a registered Halisi user.
    Used by the mobile app to show 'Halisi user — Free transfer' badge.
    """
    user = db.query(User).filter(User.phone == phone.strip()).first()
    if user:
        return {"is_linked": True, "name": user.full_name}
    return {"is_linked": False, "name": None}


@router.post("", response_model=TransferOut)
def create_transfer(
    payload: TransferCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Enforce KYC: user must have an approved KYC profile to send money
    kyc = db.query(KYCProfile).filter(KYCProfile.user_id == user.id).first()
    if not kyc:
        raise HTTPException(status_code=403, detail="KYC verification required. Please complete identity verification before sending money.")
    if kyc.status != "approved":
        status_msg = {"pending": "Your KYC is under review. You can send money once it is approved.", "rejected": "Your KYC was rejected. Please resubmit your identity documents."}.get(kyc.status, "KYC not approved.")
        raise HTTPException(status_code=403, detail=status_msg)

    # Enforce wallet ownership: user must have a wallet in the send currency
    wallet = db.query(Wallet).filter(Wallet.user_id == user.id, Wallet.currency == payload.send_currency.upper()).first()
    if not wallet:
        user_currencies = [w.currency for w in db.query(Wallet).filter(Wallet.user_id == user.id).all()]
        raise HTTPException(
            status_code=400,
            detail=f"You don't have a {payload.send_currency.upper()} wallet. Your available currencies: {', '.join(user_currencies) or 'none'}.",
        )

    # Auto-detect: override is_linked_recipient based on recipient phone lookup
    is_linked = _is_linked_phone(db, payload.recipient_phone) or payload.is_linked_recipient

    result = _engine.price(
        send_amount=Decimal(str(payload.send_amount)),
        send_currency=payload.send_currency,
        receive_currency=payload.receive_currency,
        send_country=payload.send_country,
        receive_country=payload.receive_country,
        is_linked_recipient=is_linked,
    )
    provider = choose_provider(payload.send_country, payload.receive_country)

    # Enforce per-user daily/monthly send limits
    _check_limits(db, user.id, payload.send_currency, Decimal(str(payload.send_amount)))

    is_domestic = payload.send_currency.upper() == payload.receive_currency.upper()
    if is_domestic and is_linked:
        transfer_type = "domestic_free"
    elif is_domestic:
        transfer_type = "domestic"
    else:
        transfer_type = "international"

    # Deduct total_cost (send_amount + fee) from the sender's wallet
    wallet = db.query(Wallet).filter(
        Wallet.user_id == user.id,
        Wallet.currency == payload.send_currency.upper(),
    ).first()
    total_cost = Decimal(str(result.total_cost))
    if wallet:
        current_balance = Decimal(str(wallet.balance))
        if current_balance < total_cost:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient balance. You need {total_cost:,.2f} {payload.send_currency} but have {current_balance:,.2f}.",
            )
        wallet.balance = current_balance - total_cost

    t = Transfer(
        user_id=user.id,
        send_country=payload.send_country,
        receive_country=payload.receive_country,
        send_currency=payload.send_currency,
        receive_currency=payload.receive_currency,
        send_amount=payload.send_amount,
        rate_used=float(result.fx_rate),
        fee_used=float(result.fee_amount),
        halisi_fee=float(result.fee_amount),
        transfer_type=transfer_type,
        total_payable=float(result.total_cost),
        receive_amount=float(result.receive_amount),
        recipient_name=payload.recipient_name,
        recipient_phone=payload.recipient_phone,
        provider=provider,
        status="CREATED",
        priced_at=datetime.utcnow(),
    )
    db.add(t)
    db.commit()
    db.refresh(t)

    # Try Celery first; fall back to FastAPI background thread if Celery is not running
    celery_ok = False
    try:
        from app.tasks.transfer_tasks import process_transfer
        process_transfer.apply_async(args=[t.id])
        celery_ok = True
    except Exception as _e:
        logger.warning(f"Celery unavailable ({_e}) — using in-process background task")

    if not celery_ok:
        from app.tasks.transfer_tasks import process_transfer as _process
        background_tasks.add_task(_process, t.id)

    return t


@router.get("", response_model=list[TransferOut])
def list_my_transfers(
    response: Response,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(Transfer).filter(Transfer.user_id == user.id)
    total = q.count()
    items = q.order_by(Transfer.id.desc()).offset(skip).limit(limit).all()
    response.headers["X-Total-Count"] = str(total)
    response.headers["Access-Control-Expose-Headers"] = "X-Total-Count"
    return items


@router.get("/{transfer_id}", response_model=TransferOut)
def get_transfer(
    transfer_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    t = db.get(Transfer, transfer_id)
    if not t or t.user_id != user.id:
        raise HTTPException(status_code=404, detail="Transfer not found")
    return t


@router.post("/{transfer_id}/cancel", response_model=TransferOut)
def cancel_transfer(
    transfer_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    t = db.get(Transfer, transfer_id)
    if not t or t.user_id != user.id:
        raise HTTPException(status_code=404, detail="Transfer not found")
    if t.status not in {"CREATED", "initiated"}:
        raise HTTPException(status_code=400, detail="Only pending transfers can be cancelled")
    t.status = "CANCELLED"

    # Refund the deducted amount back to the wallet
    wallet = db.query(Wallet).filter(
        Wallet.user_id == user.id,
        Wallet.currency == t.send_currency.upper(),
    ).first()
    if wallet:
        wallet.balance = Decimal(str(wallet.balance)) + Decimal(str(t.total_payable))

    db.commit()
    db.refresh(t)
    return t
