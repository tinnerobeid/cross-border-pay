from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.linked_account import LinkedAccount

router = APIRouter(prefix="/linked-accounts", tags=["Linked Accounts"])

VALID_TYPES = {"bank", "mobile_money"}

BANK_PROVIDERS = {
    "Tanzania": ["CRDB Bank", "NMB Bank", "NBC Bank", "Stanbic Bank", "Equity Bank", "DTB Bank",
                 "Standard Chartered", "Azania Bank", "BOA Tanzania"],
    "Kenya": ["Equity Bank", "KCB Bank", "Co-operative Bank", "Absa Kenya",
              "Standard Chartered Kenya", "NCBA Bank", "DTB Kenya"],
    "Rwanda": ["Bank of Kigali", "Equity Bank Rwanda", "I&M Bank Rwanda", "Cogebanque"],
    "Uganda": ["Stanbic Uganda", "Absa Uganda", "Equity Bank Uganda", "DFCU Bank"],
    "Burundi": ["Bancobu", "BCB", "Interbank Burundi"],
}

MOBILE_PROVIDERS = {
    "Tanzania": ["M-Pesa", "Tigo Pesa", "Airtel Money", "HaloPesa"],
    "Kenya": ["M-Pesa Kenya", "Airtel Money Kenya"],
    "Uganda": ["MTN Mobile Money", "Airtel Money Uganda"],
    "Rwanda": ["MTN Mobile Money Rwanda", "Airtel Money Rwanda"],
    "Burundi": ["Lumicash", "EcoCash Burundi"],
}


class LinkedAccountOut(BaseModel):
    id: int
    account_type: str
    provider: str
    account_holder: str
    account_number: str
    currency: str
    country: str
    is_default: bool

    model_config = {"from_attributes": True}


class LinkAccountRequest(BaseModel):
    account_type: str       # "bank" | "mobile_money"
    provider: str
    account_holder: str
    account_number: str     # bank account number or phone for mobile money
    currency: str
    country: str


@router.get("", response_model=list[LinkedAccountOut])
def list_linked_accounts(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(LinkedAccount)
        .filter(LinkedAccount.user_id == user.id)
        .order_by(LinkedAccount.is_default.desc(), LinkedAccount.id)
        .all()
    )


@router.post("", response_model=LinkedAccountOut, status_code=201)
def link_account(
    payload: LinkAccountRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.account_type not in VALID_TYPES:
        raise HTTPException(status_code=400, detail="account_type must be 'bank' or 'mobile_money'")

    if not payload.provider.strip():
        raise HTTPException(status_code=400, detail="Provider is required")
    if not payload.account_number.strip():
        raise HTTPException(status_code=400, detail="Account number is required")
    if not payload.account_holder.strip():
        raise HTTPException(status_code=400, detail="Account holder name is required")

    # Check for duplicate
    duplicate = (
        db.query(LinkedAccount)
        .filter(
            LinkedAccount.user_id == user.id,
            LinkedAccount.account_number == payload.account_number.strip(),
            LinkedAccount.provider == payload.provider.strip(),
        )
        .first()
    )
    if duplicate:
        raise HTTPException(status_code=409, detail="This account is already linked")

    # First account of this user becomes default
    existing_count = db.query(LinkedAccount).filter(LinkedAccount.user_id == user.id).count()

    account = LinkedAccount(
        user_id=user.id,
        account_type=payload.account_type,
        provider=payload.provider.strip(),
        account_holder=payload.account_holder.strip(),
        account_number=payload.account_number.strip(),
        currency=payload.currency.upper(),
        country=payload.country.strip(),
        is_default=(existing_count == 0),
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.patch("/{account_id}/default", response_model=LinkedAccountOut)
def set_default(
    account_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = db.query(LinkedAccount).filter(
        LinkedAccount.id == account_id, LinkedAccount.user_id == user.id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    # Clear existing default
    db.query(LinkedAccount).filter(LinkedAccount.user_id == user.id).update({"is_default": False})
    account.is_default = True
    db.commit()
    db.refresh(account)
    return account


@router.delete("/{account_id}", status_code=204)
def unlink_account(
    account_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = db.query(LinkedAccount).filter(
        LinkedAccount.id == account_id, LinkedAccount.user_id == user.id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    db.delete(account)
    db.commit()
