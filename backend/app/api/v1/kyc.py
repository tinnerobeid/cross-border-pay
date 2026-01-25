from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.kyc import KYCProfile
from app.schemas.kyc import KYCUpsert, KYCOut

router = APIRouter(prefix="/kyc", tags=["KYC"])

# MVP: user_id is passed directly (no JWT yet enforced for speed)
@router.get("/{user_id}", response_model=KYCOut)
def get_kyc(user_id: int, db: Session = Depends(get_db)):
    kyc = db.query(KYCProfile).filter(KYCProfile.user_id == user_id).first()
    if not kyc:
        raise HTTPException(status_code=404, detail="KYC not found")
    return kyc

@router.put("/{user_id}", response_model=KYCOut)
def upsert_kyc(user_id: int, payload: KYCUpsert, db: Session = Depends(get_db)):
    kyc = db.query(KYCProfile).filter(KYCProfile.user_id == user_id).first()
    if not kyc:
        kyc = KYCProfile(user_id=user_id, status="draft")
        db.add(kyc)

    for k, v in payload.dict().items():
        setattr(kyc, k, v)

    db.commit()
    db.refresh(kyc)
    return kyc

@router.post("/{user_id}/submit", response_model=KYCOut)
def submit_kyc(user_id: int, db: Session = Depends(get_db)):
    kyc = db.query(KYCProfile).filter(KYCProfile.user_id == user_id).first()
    if not kyc:
        raise HTTPException(status_code=404, detail="KYC not found")
    kyc.status = "submitted"
    db.commit()
    db.refresh(kyc)
    return kyc
