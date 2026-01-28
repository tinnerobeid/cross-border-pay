from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.kyc import KYCProfile
from app.schemas.kyc import KYCOut
from app.services.storage_service import save_upload

router = APIRouter(prefix="/kyc", tags=["KYC"])

@router.get("/me", response_model=KYCOut | None)
def get_my_kyc(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(KYCProfile).filter(KYCProfile.user_id == user.id).first()

@router.post("/submit", response_model=KYCOut)
async def submit_kyc(
    country: str = Form(...),
    id_type: str = Form(...),
    id_number: str = Form(...),
    selfie: UploadFile = File(...),
    id_front: UploadFile = File(...),
    id_back: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    kyc = db.query(KYCProfile).filter(KYCProfile.user_id == user.id).first()
    if kyc and kyc.status == "approved":
        raise HTTPException(status_code=400, detail="KYC already approved; cannot resubmit")

    selfie_path = await save_upload(user.id, selfie, "selfie")
    front_path = await save_upload(user.id, id_front, "id_front")
    back_path = await save_upload(user.id, id_back, "id_back") if id_back else None

    if not kyc:
        kyc = KYCProfile(
            user_id=user.id,
            country=country,
            id_type=id_type,
            id_number=id_number,
            selfie_path=selfie_path,
            id_front_path=front_path,
            id_back_path=back_path,
            status="pending",
        )
        db.add(kyc)
    else:
        # allow update if pending/rejected
        if kyc.status not in {"pending", "rejected"}:
            raise HTTPException(status_code=400, detail="Cannot update KYC in current status")
        kyc.country = country
        kyc.id_type = id_type
        kyc.id_number = id_number
        kyc.selfie_path = selfie_path
        kyc.id_front_path = front_path
        kyc.id_back_path = back_path
        kyc.status = "pending"
        kyc.review_note = None
        kyc.reviewed_at = None

    db.commit()
    db.refresh(kyc)
    return kyc
