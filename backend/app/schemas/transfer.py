from pydantic import BaseModel, Field
from decimal import Decimal
from datetime import datetime
from typing import Optional

class TransferCreate(BaseModel):
    send_country: str = Field(..., min_length=2, max_length=2, description="ISO country code, e.g., TZ")
    receive_country: str = Field(..., min_length=2, max_length=2, description="ISO country code, e.g., KR")

    send_method: str = Field(..., min_length=3, max_length=30)
    receive_method: str = Field(..., min_length=3, max_length=30)

    send_amount: Decimal = Field(..., gt=0)
    send_currency: str = Field(..., min_length=3, max_length=3)
    receive_currency: str = Field(..., min_length=3, max_length=3)

class TransferOut(BaseModel):
    id: int

    send_country: str
    receive_country: str
    send_method: str
    receive_method: str

    send_amount: Decimal
    send_currency: str
    receive_currency: str

    fx_rate: Decimal
    fee_amount: Decimal
    provider: str
    estimated_minutes: int

    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TransferStatusUpdate(BaseModel):
    status: str = Field(..., min_length=3, max_length=20)
