from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from decimal import Decimal

from app.db.database import get_db
from app.models.transfer import Transfer
from app.schemas.transfer import TransferCreate, TransferOut, TransferStatusUpdate
from app.services.quote_service import calculate_quote
from app.services.status_service import validate_transition

router = APIRouter(prefix="/transfers", tags=["Transfers"])

def choose_provider_simulated(payload: TransferCreate) -> tuple[str, int]:
    # MVP: simple simulated provider selection
    # You can later replace this with real scoring logic.
    if payload.send_method == "mobile_money" and payload.receive_method in {"bank", "wallet"}:
        return ("ProviderA", 30)
    return ("ProviderB", 60)

@router.post("", response_model=TransferOut)
def create_transfer(payload: TransferCreate, db: Session = Depends(get_db)):
    provider, eta = choose_provider_simulated(payload)
    fx_rate, fee_amount = calculate_quote(payload.send_amount, payload.send_currency, payload.receive_currency)

    transfer = Transfer(
        status="initiated",
        send_country=payload.send_country.upper(),
        receive_country=payload.receive_country.upper(),
        send_method=payload.send_method,
        receive_method=payload.receive_method,
        send_amount=payload.send_amount,
        send_currency=payload.send_currency.upper(),
        receive_currency=payload.receive_currency.upper(),
        fx_rate=fx_rate,
        fee_amount=fee_amount,
        provider=provider,
        estimated_minutes=eta,
    )

    db.add(transfer)
    db.commit()
    db.refresh(transfer)
    return transfer

@router.get("", response_model=list[TransferOut])
def list_transfers(db: Session = Depends(get_db)):
    return db.query(Transfer).order_by(Transfer.id.desc()).limit(100).all()

@router.get("/{transfer_id}", response_model=TransferOut)
def get_transfer(transfer_id: int, db: Session = Depends(get_db)):
    t = db.query(Transfer).filter(Transfer.id == transfer_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transfer not found")
    return t

@router.patch("/{transfer_id}/status", response_model=TransferOut)
def update_status(transfer_id: int, payload: TransferStatusUpdate, db: Session = Depends(get_db)):
    t = db.query(Transfer).filter(Transfer.id == transfer_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transfer not found")

    ok, msg = validate_transition(t.status, payload.status)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)

    t.status = payload.status
    db.commit()
    db.refresh(t)
    return t
