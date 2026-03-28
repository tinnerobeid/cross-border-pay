from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from datetime import datetime
from decimal import Decimal

from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.transfer import Transfer
from app.models.wallet import Wallet
from app.schemas.transfer import TransferCreate, TransferOut
from app.services.pricing_engine import PricingEngine
from app.services.routing_service import choose_provider
from app.core.logger import logger


def _is_linked_phone(db: Session, phone: str) -> bool:
    """Return True if the given phone belongs to a registered ZuriPay user."""
    if not phone:
        return False
    return db.query(User).filter(User.phone == phone.strip()).first() is not None


router = APIRouter(prefix="/transfers", tags=["Transfers"])

_engine = PricingEngine(quote_ttl_seconds=300)


@router.get("/lookup", response_model=dict)
def lookup_recipient(
    phone: str = Query(..., description="Recipient phone number to check"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Check if a phone number belongs to a registered ZuriPay user.
    Used by the mobile app to show 'ZuriPay user — Free transfer' badge.
    """
    user = db.query(User).filter(User.phone == phone.strip()).first()
    if user:
        return {"is_linked": True, "name": user.full_name}
    return {"is_linked": False, "name": None}


@router.post("", response_model=TransferOut)
def create_transfer(
    payload: TransferCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
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
        zuripay_fee=float(result.fee_amount),
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
    try:
        from app.tasks.transfer_tasks import process_transfer
        process_transfer.apply_async(args=[t.id])
    except Exception as _e:
        logger.warning(f"Could not enqueue transfer processing task: {_e}")
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
