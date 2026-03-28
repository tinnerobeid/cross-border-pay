from pydantic import BaseModel, EmailStr, field_validator
import re
import phonenumbers


def validate_phone_number(v: str | None) -> str | None:
    """Parse and validate a phone number using the phonenumbers library.
    Accepts international format (+255712345678) or local with country hint.
    Returns the normalized E.164 format on success."""
    if not v:
        return v
    v = v.strip()
    try:
        # Try parsing as-is (works for international format like +255...)
        parsed = phonenumbers.parse(v, None)
    except phonenumbers.NumberParseException:
        # Try with a default region (Tanzania as primary market)
        try:
            parsed = phonenumbers.parse(v, "TZ")
        except phonenumbers.NumberParseException:
            raise ValueError("Invalid phone number. Use international format e.g. +255712345678")

    if not phonenumbers.is_valid_number(parsed):
        raise ValueError("Phone number is not valid. Use international format e.g. +255712345678")

    # Return normalized E.164 format
    return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)


SUPPORTED_RESIDENCE_COUNTRIES = {
    'Tanzania', 'Kenya', 'Rwanda', 'Uganda', 'South Korea', 'Burundi',
}

class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    phone: str | None = None
    country_of_residence: str | None = None

    @field_validator("country_of_residence")
    @classmethod
    def validate_residence(cls, v: str | None) -> str | None:
        if v and v not in SUPPORTED_RESIDENCE_COUNTRIES:
            raise ValueError(f"Country of residence must be one of: {', '.join(sorted(SUPPORTED_RESIDENCE_COUNTRIES))}")
        return v

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Full name must be at least 2 characters")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        return validate_phone_number(v)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one number")
        if not re.search(r"[!@#$%^&*]", v):
            raise ValueError("Password must contain at least one special character (!@#$%^&*)")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class SendOTPRequest(BaseModel):
    email: EmailStr


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp_code: str
