from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.quote import Quote
from app.schemas.quote import QuoteRequest, QuoteResponse
from app.services.pricing_engine import PricingEngine

router = APIRouter(prefix="/quote", tags=["Quote"])

engine = PricingEngine(quote_ttl_seconds=60)


@router.post("", response_model=QuoteResponse)
def create_quote(
    payload: QuoteRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    send_amount = Decimal(str(payload.send_amount))
    result = engine.price(
        send_amount=send_amount,
        send_currency=payload.send_currency,
        receive_currency=payload.receive_currency,
        send_country=payload.send_country,
        receive_country=payload.receive_country,
    )

    q = Quote(
        user_id=user.id,
        send_country=payload.send_country,
        receive_country=payload.receive_country,
        send_currency=payload.send_currency,
        receive_currency=payload.receive_currency,
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

    return q