from datetime import datetime
from pydantic import BaseModel


class QuoteRequest(BaseModel):
    send_country: str
    receive_country: str
    send_currency: str
    receive_currency: str
    send_amount: float


class QuoteResponse(BaseModel):
    id: int
    fx_rate: float
    fee_amount: float
    receive_amount: float
    total_cost: float
    expires_at: datetime
    status: str

    model_config = {"from_attributes": True}