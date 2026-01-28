from pydantic import BaseModel

class QuoteRequest(BaseModel):
    send_country: str
    receive_country: str
    send_currency: str
    receive_currency: str
    send_amount: float

class QuoteResponse(BaseModel):
    fx_rate: float
    fee_amount: float
    receive_amount: float
    total_cost: float
