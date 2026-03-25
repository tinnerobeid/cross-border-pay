from datetime import datetime
from pydantic import BaseModel


class QuoteRequest(BaseModel):
    send_country: str
    receive_country: str
    send_currency: str
    receive_currency: str
    send_amount: float
    is_linked_recipient: bool = False  # True = sending to own linked account (free domestic)


class QuoteResponse(BaseModel):
    id: int
    send_amount: float
    fx_rate: float
    fee_amount: float
    receive_amount: float
    total_cost: float
    zuripay_fee: float      # fee ZuriPay earns on this transaction
    transfer_type: str      # "international" | "domestic_free" | "domestic"
    expires_at: datetime
    status: str

    model_config = {"from_attributes": True}
