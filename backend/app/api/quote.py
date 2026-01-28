from fastapi import APIRouter
from app.schemas.quote import QuoteRequest, QuoteResponse
from app.services.pricing_service import mock_fx_rate, mock_fee, quote

router = APIRouter(prefix="/quote", tags=["Quote"])

@router.post("", response_model=QuoteResponse)
def get_quote(payload: QuoteRequest):
    fx = mock_fx_rate(payload.send_currency, payload.receive_currency)
    fee = mock_fee(payload.send_amount)
    receive_amount, total_cost = quote(payload.send_amount, fx, fee)
    return QuoteResponse(
        fx_rate=fx,
        fee_amount=fee,
        receive_amount=receive_amount,
        total_cost=total_cost,
    )
