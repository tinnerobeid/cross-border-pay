from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.quote import Quote
from app.models.wallet import Wallet
from app.schemas.quote import QuoteRequest, QuoteResponse
from app.services.pricing_engine import (
    PricingEngine, INTERNATIONAL_MIN_SEND, INTERNATIONAL_MIN_BALANCE,
)

router = APIRouter(prefix="/quote", tags=["Quote"])

engine = PricingEngine(quote_ttl_seconds=60)


@router.get("/rates/live")
def get_live_rates():
    """Returns exchange rates for all supported primary currencies."""
    from app.services.pricing_engine import get_rate
    pairs = [
        ("TZS", "KRW"), ("TZS", "USD"), ("TZS", "KES"),
        ("TZS", "RWF"), ("TZS", "BIF"), ("TZS", "UGX"),
        ("KRW", "TZS"), ("KRW", "USD"),
        ("KES", "TZS"), ("KES", "USD"),
        ("RWF", "TZS"), ("UGX", "TZS"), ("BIF", "TZS"),
        ("USD", "TZS"), ("USD", "KRW"),
    ]
    return [
        {"from_currency": f, "to_currency": t, "rate": float(get_rate(f, t))}
        for f, t in pairs
    ]


@router.post("", response_model=QuoteResponse)
def create_quote(
    payload: QuoteRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    send_amount = Decimal(str(payload.send_amount))
    send_currency = payload.send_currency.upper()
    receive_currency = payload.receive_currency.upper()
    is_domestic = send_currency == receive_currency

    # ── Validations ──────────────────────────────────────────────────────────
    if not is_domestic:
        # Minimum send amount for international transfers
        min_send = INTERNATIONAL_MIN_SEND.get(send_currency, Decimal("5000"))
        if send_amount < min_send:
            raise HTTPException(
                status_code=400,
                detail=f"Minimum international transfer is {min_send:,.0f} {send_currency}. "
                       f"You entered {send_amount:,.0f} {send_currency}."
            )

        # Minimum wallet balance check
        wallet = db.query(Wallet).filter(
            Wallet.user_id == user.id, Wallet.currency == send_currency
        ).first()
        if wallet:
            min_balance = INTERNATIONAL_MIN_BALANCE.get(send_currency, Decimal("10000"))
            wallet_balance = Decimal(str(wallet.balance))
            if wallet_balance < min_balance:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient balance. You need at least {min_balance:,.0f} {send_currency} "
                           f"to send internationally. Current balance: {wallet_balance:,.0f} {send_currency}."
                )

    # ── Pricing ───────────────────────────────────────────────────────────────
    result = engine.price(
        send_amount=send_amount,
        send_currency=send_currency,
        receive_currency=receive_currency,
        send_country=payload.send_country,
        receive_country=payload.receive_country,
        is_linked_recipient=payload.is_linked_recipient,
    )

    if is_domestic and payload.is_linked_recipient:
        transfer_type = "domestic_free"
    elif is_domestic:
        transfer_type = "domestic"
    else:
        transfer_type = "international"

    q = Quote(
        user_id=user.id,
        send_country=payload.send_country,
        receive_country=payload.receive_country,
        send_currency=send_currency,
        receive_currency=receive_currency,
        send_amount=float(send_amount),
        fx_rate=float(result.fx_rate),
        fee_amount=float(result.fee_amount),
        receive_amount=float(result.receive_amount),
        total_cost=float(result.total_cost),
        status="PENDING",
        expires_at=result.expires_at,
    )

    db.add(q)
    db.commit()
    db.refresh(q)

    # Build response with extra fields not stored in DB
    return {
        "id": q.id,
        "send_amount": q.send_amount,
        "fx_rate": q.fx_rate,
        "fee_amount": q.fee_amount,
        "receive_amount": q.receive_amount,
        "total_cost": q.total_cost,
        "zuripay_fee": q.fee_amount,   # ZuriPay earns the full fee
        "transfer_type": transfer_type,
        "expires_at": q.expires_at,
        "status": q.status,
    }
