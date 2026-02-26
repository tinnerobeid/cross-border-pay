from __future__ import annotations

from decimal import Decimal
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.core.config import settings
from app.services.fx_provider_exchangerate_host import ExchangeRateHostProvider
from app.services.pricing import PricingService

router = APIRouter(prefix="", tags=["Quote"])  # keep your style/prefix if you already have one

# Create singletons (simple MVP)
fx_provider = ExchangeRateHostProvider(
    api_key=settings.EXCHANGERATE_HOST_API_KEY,
    cache_ttl_seconds=30,
)

pricing = PricingService(
    fx_provider=fx_provider,
    quote_ttl_seconds=120,
    fixed_fee=Decimal("1000"),
    percent_fee=Decimal("0.008"),
    min_fee=Decimal("1000"),
    max_fee=Decimal("15000"),
)


class QuoteRequest(BaseModel):
    send_amount: Decimal
    send_currency: str
    receive_currency: str


@router.get("/fx/rate")
async def fx_rate(
    base: str = Query(..., min_length=3, max_length=3),
    quote: str = Query(..., min_length=3, max_length=3),
):
    try:
        live = await fx_provider.get_rate(base, quote)
        return {
            "base": live.base,
            "quote": live.quote,
            "rate": str(live.rate),
            "provider": live.provider,
            "fetched_at": live.fetched_at.isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.post("/quote")
async def create_quote(payload: QuoteRequest):
    try:
        q = await pricing.quote(
            send_amount=payload.send_amount,
            send_currency=payload.send_currency,
            receive_currency=payload.receive_currency,
        )
        return {
            "send_amount": str(q.send_amount),
            "send_currency": q.send_currency,
            "receive_currency": q.receive_currency,
            "rate_used": str(q.rate_used),
            "receive_amount": str(q.receive_amount),
            "fee_used": str(q.fee_used),
            "total_payable": str(q.total_payable),
            "provider": q.provider,
            "priced_at": q.priced_at.isoformat(),
            "expires_at": q.expires_at.isoformat(),
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
