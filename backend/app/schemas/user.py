from pydantic import BaseModel, EmailStr

class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    phone: str | None
    role: str
    is_active: bool
    is_verified: bool

    model_config = {"from_attributes": True}
