from pydantic import BaseModel

class KYCOut(BaseModel):
    id: int
    user_id: int
    status: str
    country: str
    id_type: str
    id_number: str
    selfie_path: str | None
    id_front_path: str | None
    id_back_path: str | None
    review_note: str | None

    model_config = {"from_attributes": True}

class AdminKYCDecision(BaseModel):
    note: str | None = None
