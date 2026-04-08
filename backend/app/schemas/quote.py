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
    fee_amount: float          # total fee (transfer fee + exchange fee)
    transfer_fee: float        # flat transfer fee component
    exchange_fee: float        # exchange/conversion fee component
    receive_amount: float
    total_cost: float          # send_amount + fee_amount
    halisi_fee: float
    transfer_type: str         # "international" | "domestic_free" | "domestic"
    expires_at: datetime
    status: str

    model_config = {"from_attributes": True}
