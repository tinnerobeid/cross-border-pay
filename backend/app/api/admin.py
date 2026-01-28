from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.database import get_db
from app.api.deps import require_admin
from app.models.user import User
from app.models.kyc import KYCProfile
from app.models.transfer import Transfer
from app.schemas.kyc import KYCOut, AdminKYCDecision
from app.schemas.transfer import TransferOut, TransferStatusUpdate
from app.services.transfer_service import validate_transition

router = APIRouter(prefix="/admin", tags=["Admin"])

# --- KYC ---
@router.get("/kyc", response_model=list[KYCOut])
def list_kyc(status: str | None = None, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    q = db.query(KYCProfile)
    if status:
        q = q.filter(KYCProfile.status == status)
    return q.order_by(KYCProfile.id.desc()).all()

@router.post("/kyc/{kyc_id}/approve", response_model=KYCOut)
def approve_kyc(kyc_id: int, payload: AdminKYCDecision, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    kyc = db.get(KYCProfile, kyc_id)
    if not kyc:
        raise HTTPException(status_code=404, detail="KYC not found")
    kyc.status = "approved"
    kyc.review_note = payload.note
    kyc.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(kyc)
    return kyc

@router.post("/kyc/{kyc_id}/reject", response_model=KYCOut)
def reject_kyc(kyc_id: int, payload: AdminKYCDecision, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    kyc = db.get(KYCProfile, kyc_id)
    if not kyc:
        raise HTTPException(status_code=404, detail="KYC not found")
    kyc.status = "rejected"
    kyc.review_note = payload.note
    kyc.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(kyc)
    return kyc

# --- Transfers ---
@router.get("/transfers", response_model=list[TransferOut])
def list_transfers(status: str | None = None, user_id: int | None = None, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    q = db.query(Transfer)
    if status:
        q = q.filter(Transfer.status == status)
    if user_id:
        q = q.filter(Transfer.user_id == user_id)
    return q.order_by(Transfer.id.desc()).all()

@router.patch("/transfers/{transfer_id}/status", response_model=TransferOut)
def update_transfer_status(
    transfer_id: int,
    payload: TransferStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    t = db.get(Transfer, transfer_id)
    if not t:
        raise HTTPException(status_code=404, detail="Transfer not found")

    validate_transition(t.status, payload.status)

    t.status = payload.status
    t.updated_at = datetime.utcnow()

    if payload.status == "failed":
        t.failure_reason = payload.failure_reason or "Unknown failure"

    db.commit()
    db.refresh(t)
    return t
