from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.kyc import KYCProfile
from app.models.transfer import Transfer
from app.schemas.transfer import TransferCreate, TransferOut
from app.services.pricing_service import mock_fx_rate, mock_fee, quote
from app.services.routing_service import choose_provider

router = APIRouter(prefix="/transfers", tags=["Transfers"])

def require_kyc_approved(db: Session, user_id: int) -> None:
    kyc = db.query(KYCProfile).filter(KYCProfile.user_id == user_id).first()
    if not kyc or kyc.status != "approved":
        raise HTTPException(status_code=403, detail="KYC must be approved to create transfers")

@router.post("", response_model=TransferOut)
def create_transfer(payload: TransferCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_kyc_approved(db, user.id)

    fx = mock_fx_rate(payload.send_currency, payload.receive_currency)
    fee = mock_fee(payload.send_amount)
    receive_amount, _total = quote(payload.send_amount, fx, fee)
    provider = choose_provider(payload.send_country, payload.receive_country)

    t = Transfer(
        user_id=user.id,
        send_country=payload.send_country,
        receive_country=payload.receive_country,
        send_currency=payload.send_currency,
        receive_currency=payload.receive_currency,
        send_amount=payload.send_amount,
        fx_rate=fx,
        fee_amount=fee,
        receive_amount=receive_amount,
        provider=provider,
        status="initiated",
        updated_at=datetime.utcnow(),
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return t

@router.get("", response_model=list[TransferOut])
def list_my_transfers(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Transfer).filter(Transfer.user_id == user.id).order_by(Transfer.id.desc()).all()

@router.get("/{transfer_id}", response_model=TransferOut)
def get_transfer(transfer_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    t = db.get(Transfer, transfer_id)
    if not t or t.user_id != user.id:
        raise HTTPException(status_code=404, detail="Transfer not found")
    return t

@router.post("/{transfer_id}/cancel", response_model=TransferOut)
def cancel_transfer(transfer_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    t = db.get(Transfer, transfer_id)
    if not t or t.user_id != user.id:
        raise HTTPException(status_code=404, detail="Transfer not found")
    if t.status != "initiated":
        raise HTTPException(status_code=400, detail="Only initiated transfers can be cancelled")
    t.status = "cancelled"
    t.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(t)
    return t
