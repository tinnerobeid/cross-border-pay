from datetime import datetime
from pydantic import BaseModel

class TransferCreate(BaseModel):
    send_country: str
    receive_country: str
    send_currency: str
    receive_currency: str
    send_amount: float
    recipient_name: str
    recipient_phone: str

class TransferOut(BaseModel):
    id: int
    user_id: int
    send_country: str
    receive_country: str
    send_currency: str
    receive_currency: str
    send_amount: float
    rate_used: float | None
    fee_used: float | None
    total_payable: float | None
    receive_amount: float | None
    recipient_name: str
    recipient_phone: str
    provider: str
    status: str
    fail_reason: str | None
    created_at: datetime

    model_config = {"from_attributes": True}

class TransferStatusUpdate(BaseModel):
    status: str
    fail_reason: str | None = None

class TransferCreateFromQuote(BaseModel):
    quote_id: int