from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.recipient import Recipient
from app.schemas.recipient import RecipientCreate, RecipientOut

router = APIRouter(prefix="/recipients", tags=["Recipients"])


@router.get("", response_model=list[RecipientOut])
def list_recipients(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return (
        db.query(Recipient)
        .filter(Recipient.user_id == user.id)
        .order_by(Recipient.id.desc())
        .all()
    )


@router.post("", response_model=RecipientOut)
def create_recipient(
    payload: RecipientCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    r = Recipient(user_id=user.id, **payload.model_dump())
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


@router.delete("/{recipient_id}")
def delete_recipient(
    recipient_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    r = db.get(Recipient, recipient_id)
    if not r or r.user_id != user.id:
        raise HTTPException(status_code=404, detail="Recipient not found")
    db.delete(r)
    db.commit()
    return {"ok": True}
