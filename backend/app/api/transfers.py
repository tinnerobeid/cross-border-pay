from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from decimal import Decimal

from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.transfer import Transfer
from app.schemas.transfer import TransferCreate, TransferOut
from app.services.pricing_engine import PricingEngine
from app.services.routing_service import choose_provider
from app.core.logger import logger


router = APIRouter(prefix="/transfers", tags=["Transfers"])

_engine = PricingEngine(quote_ttl_seconds=300)


@router.post("", response_model=TransferOut)
def create_transfer(
    payload: TransferCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = _engine.price(
        send_amount=Decimal(str(payload.send_amount)),
        send_currency=payload.send_currency,
        receive_currency=payload.receive_currency,
        send_country=payload.send_country,
        receive_country=payload.receive_country,
    )
    provider = choose_provider(payload.send_country, payload.receive_country)

    t = Transfer(
        user_id=user.id,
        send_country=payload.send_country,
        receive_country=payload.receive_country,
        send_currency=payload.send_currency,
        receive_currency=payload.receive_currency,
        send_amount=payload.send_amount,
        rate_used=float(result.fx_rate),
        fee_used=float(result.fee_amount),
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
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return (
        db.query(Transfer)
        .filter(Transfer.user_id == user.id)
        .order_by(Transfer.id.desc())
        .all()
    )


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
    db.commit()
    db.refresh(t)
    return t
