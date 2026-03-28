from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.wallet import Wallet
from app.models.linked_account import LinkedAccount

router = APIRouter(prefix="/wallets", tags=["Wallets"])

SUPPORTED_CURRENCIES = {'TZS', 'KRW', 'KES', 'RWF', 'BIF', 'UGX', 'USD'}


class WalletOut(BaseModel):
    id: int
    currency: str
    balance: float
    is_primary: bool

    model_config = {"from_attributes": True}


class AddWalletRequest(BaseModel):
    currency: str


class SwapRequest(BaseModel):
    from_wallet_id: int
    to_wallet_id: int
    amount: float


class SwapOut(BaseModel):
    from_currency: str
    to_currency: str
    from_amount: float
    to_amount: float
    rate: float
    from_new_balance: float
    to_new_balance: float


class DepositRequest(BaseModel):
    linked_account_id: int
    amount: float


class DepositOut(BaseModel):
    wallet_id: int
    currency: str
    amount: float
    new_balance: float
    source: str   # provider name


@router.get("", response_model=list[WalletOut])
def list_wallets(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Wallet).filter(Wallet.user_id == user.id).order_by(Wallet.is_primary.desc(), Wallet.id).all()


@router.post("", response_model=WalletOut, status_code=201)
def add_wallet(
    payload: AddWalletRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    currency = payload.currency.upper()
    if currency not in SUPPORTED_CURRENCIES:
        raise HTTPException(status_code=400, detail=f"Unsupported currency. Choose from: {', '.join(sorted(SUPPORTED_CURRENCIES))}")

    existing = db.query(Wallet).filter(Wallet.user_id == user.id, Wallet.currency == currency).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"You already have a {currency} wallet")

    wallet = Wallet(user_id=user.id, currency=currency, balance=0.0, is_primary=False)
    db.add(wallet)
    db.commit()
    db.refresh(wallet)
    return wallet


@router.post("/{wallet_id}/deposit", response_model=DepositOut)
def deposit_from_linked_account(
    wallet_id: int,
    payload: DepositRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wallet = db.query(Wallet).filter(Wallet.id == wallet_id, Wallet.user_id == user.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")

    linked = db.query(LinkedAccount).filter(
        LinkedAccount.id == payload.linked_account_id,
        LinkedAccount.user_id == user.id,
    ).first()
    if not linked:
        raise HTTPException(status_code=404, detail="Linked account not found")

    if linked.currency != wallet.currency:
        raise HTTPException(
            status_code=400,
            detail=f"Account currency ({linked.currency}) does not match wallet currency ({wallet.currency})",
        )

    amount = Decimal(str(payload.amount))
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")

    # For mobile money accounts: initiate real STK push via Africa's Talking.
    # Wallet is credited once the webhook callback confirms payment.
    # For bank accounts (or when AT not configured): credit immediately (synchronous).
    if linked.account_type == "mobile_money" and user.phone:
        from app.services.payment_providers import initiate_c2b_checkout, _at_configured
        if _at_configured():
            result = initiate_c2b_checkout(
                phone=user.phone,
                currency=linked.currency,
                amount=float(amount),
                wallet_id=wallet.id,
            )
            if result["status"] == "FAILED":
                raise HTTPException(status_code=502, detail="Mobile money checkout failed. Please try again.")
            # Return pending — wallet will be credited via webhook
            return DepositOut(
                wallet_id=wallet.id,
                currency=wallet.currency,
                amount=float(amount),
                new_balance=float(wallet.balance),  # unchanged until webhook fires
                source=f"{linked.provider} (pending)",
            )

    # Synchronous credit (bank account or AT not configured)
    wallet.balance = Decimal(str(wallet.balance)) + amount
    db.commit()
    db.refresh(wallet)

    return DepositOut(
        wallet_id=wallet.id,
        currency=wallet.currency,
        amount=float(amount),
        new_balance=float(wallet.balance),
        source=linked.provider,
    )


@router.patch("/{wallet_id}/primary", response_model=WalletOut)
def set_primary_wallet(
    wallet_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wallet = db.query(Wallet).filter(Wallet.id == wallet_id, Wallet.user_id == user.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    # Unset current primary
    db.query(Wallet).filter(Wallet.user_id == user.id, Wallet.is_primary == True).update({"is_primary": False})
    wallet.is_primary = True
    db.commit()
    db.refresh(wallet)
    return wallet


@router.post("/swap", response_model=SwapOut)
def swap_wallets(
    payload: SwapRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Exchange between two of the user's own wallets using the live FX rate."""
    from app.services.pricing_engine import get_rate

    from_wallet = db.query(Wallet).filter(Wallet.id == payload.from_wallet_id, Wallet.user_id == user.id).first()
    to_wallet = db.query(Wallet).filter(Wallet.id == payload.to_wallet_id, Wallet.user_id == user.id).first()

    if not from_wallet or not to_wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    if from_wallet.id == to_wallet.id:
        raise HTTPException(status_code=400, detail="Cannot swap a wallet with itself")

    amount = Decimal(str(payload.amount))
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")

    from_balance = Decimal(str(from_wallet.balance))
    if from_balance < amount:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient balance. You have {from_balance:,.2f} {from_wallet.currency}",
        )

    rate = get_rate(from_wallet.currency, to_wallet.currency)
    to_amount = (amount * rate).quantize(Decimal("0.01"))

    from_wallet.balance = from_balance - amount
    to_wallet.balance = Decimal(str(to_wallet.balance)) + to_amount
    db.commit()

    return SwapOut(
        from_currency=from_wallet.currency,
        to_currency=to_wallet.currency,
        from_amount=float(amount),
        to_amount=float(to_amount),
        rate=float(rate),
        from_new_balance=float(from_wallet.balance),
        to_new_balance=float(to_wallet.balance),
    )


@router.delete("/{wallet_id}", status_code=204)
def remove_wallet(
    wallet_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wallet = db.query(Wallet).filter(Wallet.id == wallet_id, Wallet.user_id == user.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    if wallet.is_primary:
        raise HTTPException(status_code=400, detail="Cannot remove your primary wallet")
    if float(wallet.balance) > 0:
        raise HTTPException(status_code=400, detail="Cannot remove a wallet with remaining balance")
    db.delete(wallet)
    db.commit()
