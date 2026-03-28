from pydantic import BaseModel


class RecipientCreate(BaseModel):
    name: str
    phone: str
    bank_name: str | None = None
    account_number: str | None = None
    country: str
    currency: str


class RecipientOut(BaseModel):
    id: int
    user_id: int
    name: str
    phone: str
    bank_name: str | None
    account_number: str | None
    country: str
    currency: str

    model_config = {"from_attributes": True}
