from pydantic import BaseModel
from typing import Optional

class KYCUpsert(BaseModel):
    full_name: Optional[str] = None
    nationality: Optional[str] = None
    id_type: Optional[str] = None
    id_number: Optional[str] = None

class KYCOut(KYCUpsert):
    id: int
    user_id: int
    status: str

    class Config:
        from_attributes = True
