from pydantic import BaseModel

class TransferCreate(BaseModel):
    send_country: str
    receive_country: str
    send_currency: str
    receive_currency: str
    send_amount: float

class TransferOut(BaseModel):
    id: int
    user_id: int
    send_country: str
    receive_country: str
    send_currency: str
    receive_currency: str
    send_amount: float
    fx_rate: float
    fee_amount: float
    receive_amount: float
    provider: str
    status: str
    failure_reason: str | None

    model_config = {"from_attributes": True}

class TransferStatusUpdate(BaseModel):
    status: str
    failure_reason: str | None = None
