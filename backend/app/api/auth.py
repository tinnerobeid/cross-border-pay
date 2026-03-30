from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel
import random
import string
from datetime import datetime, timedelta

from app.db.database import get_db
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, SendOTPRequest, VerifyOTPRequest
from app.schemas.user import UserOut
from app.core.security import hash_password, verify_password, create_access_token
from app.api.deps import get_current_user
from app.services.notifications import dispatch_otp
from app.models.wallet import Wallet, currency_from_phone

try:
    from slowapi import Limiter
    from slowapi.util import get_remote_address
    _limiter = Limiter(key_func=get_remote_address)
except ImportError:
    _limiter = None

router = APIRouter(prefix="/auth", tags=["Auth"])


# ── First-time setup ──────────────────────────────────────────────────────────

class SetupRequest(BaseModel):
    email: str
    full_name: str
    password: str
    phone: str | None = None


@router.get("/setup/status")
def setup_status(db: Session = Depends(get_db)):
    """Returns whether an admin account already exists."""
    admin_exists = db.query(User).filter(User.role == "admin").first() is not None
    return {"admin_exists": admin_exists}


@router.post("/setup", response_model=TokenResponse)
def first_setup(payload: SetupRequest, db: Session = Depends(get_db)):
    """
    Create the very first admin account.
    Blocked once any admin exists — ensures it can only be used once.
    """
    if db.query(User).filter(User.role == "admin").first():
        raise HTTPException(status_code=403, detail="Setup already complete. An admin account already exists.")
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    admin = User(
        email=payload.email,
        full_name=payload.full_name,
        phone=payload.phone,
        hashed_password=hash_password(payload.password),
        role="admin",
        is_active=True,
        is_verified=True,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    token = create_access_token(subject=str(admin.id), role=admin.role)
    return TokenResponse(access_token=token)


@router.post("/register", response_model=UserOut)
@(_limiter.limit("5/minute") if _limiter else lambda f: f)
def register(request: Request, payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Generate OTP
    otp_code = ''.join(random.choices(string.digits, k=6))
    otp_expires_at = datetime.utcnow() + timedelta(minutes=10)

    try:
        user = User(
            email=payload.email,
            full_name=payload.full_name,
            phone=payload.phone,
            hashed_password=hash_password(payload.password),
            role="user",
            is_active=False,  # User needs to verify email first
            is_verified=False,
            otp_code=otp_code,
            otp_expires_at=otp_expires_at,
            country_of_residence=payload.country_of_residence,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        dispatch_otp(
            email=payload.email,
            otp=otp_code,
            phone=payload.phone,
            full_name=payload.full_name,
        )

        return user

    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"DB integrity error: {str(e.orig)}")

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Register failed: {type(e).__name__}: {str(e)}")


@router.post("/send-otp")
@(_limiter.limit("3/minute") if _limiter else lambda f: f)
def send_otp(request: Request, payload: SendOTPRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Generate new OTP
    otp_code = ''.join(random.choices(string.digits, k=6))
    otp_expires_at = datetime.utcnow() + timedelta(minutes=10)

    user.otp_code = otp_code
    user.otp_expires_at = otp_expires_at
    db.commit()

    result = dispatch_otp(email=user.email, otp=otp_code, phone=user.phone, full_name=user.full_name)
    channels = ", ".join(result["channels"])
    return {"message": f"OTP sent via {channels}"}


@router.post("/verify-otp")
def verify_otp(payload: VerifyOTPRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_verified:
        return {"message": "Account already verified"}

    if not user.otp_code or not user.otp_expires_at:
        raise HTTPException(status_code=400, detail="No OTP found. Please request a new one.")

    if datetime.utcnow() > user.otp_expires_at:
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    if user.otp_code != payload.otp_code:
        raise HTTPException(status_code=400, detail="Invalid OTP code")

    # Verify the user
    user.is_verified = True
    user.is_active = True
    user.otp_code = None
    user.otp_expires_at = None

    # Auto-create primary wallet based on phone country if not yet created
    existing_wallet = db.query(Wallet).filter(Wallet.user_id == user.id).first()
    if not existing_wallet:
        primary_currency = currency_from_phone(user.phone)
        db.add(Wallet(user_id=user.id, currency=primary_currency, balance=0.0, is_primary=True))

    db.commit()

    token = create_access_token(subject=str(user.id), role=user.role)
    return {"message": "Account verified successfully", "access_token": token}

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/login", response_model=TokenResponse)
@(_limiter.limit("10/minute") if _limiter else lambda f: f)
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Account not verified. Please verify your email first.")

    token = create_access_token(subject=str(user.id), role=user.role)
    return TokenResponse(access_token=token)


@router.post("/admin/login", response_model=TokenResponse)
def admin_login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Login endpoint exclusively for admin portal — rejects non-admin accounts."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admin accounts only.")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled.")

    token = create_access_token(subject=str(user.id), role=user.role)
    return TokenResponse(access_token=token)


@router.get("/me")
def get_me(user: User = Depends(get_current_user)):
    return user


@router.delete("/me")
def delete_account(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Soft-delete: deactivates the account."""
    user.is_active = False
    db.commit()
    return {"message": "Account deactivated successfully"}


# ── Password change ────────────────────────────────────────────────────────────

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.patch("/password")
def change_password(
    payload: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password updated successfully"}


# ── PIN management ─────────────────────────────────────────────────────────────

class SetPinRequest(BaseModel):
    current_pin: str | None = None   # required only when user already has a PIN
    new_pin: str
    confirm_pin: str


@router.patch("/pin")
def change_pin(
    payload: SetPinRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if len(payload.new_pin) != 6 or not payload.new_pin.isdigit():
        raise HTTPException(status_code=400, detail="PIN must be exactly 6 digits")
    if payload.new_pin != payload.confirm_pin:
        raise HTTPException(status_code=400, detail="PINs do not match")

    # If user already has a PIN, verify the current one
    if user.pin_hash:
        if not payload.current_pin:
            raise HTTPException(status_code=400, detail="Current PIN is required")
        if not verify_password(payload.current_pin, user.pin_hash):
            raise HTTPException(status_code=400, detail="Current PIN is incorrect")

    user.pin_hash = hash_password(payload.new_pin)
    db.commit()
    return {"message": "PIN updated successfully", "has_pin": True}


@router.get("/pin/status")
def pin_status(user: User = Depends(get_current_user)):
    return {"has_pin": user.pin_hash is not None}


# ── Phone change ───────────────────────────────────────────────────────────────

class PhoneChangeRequest(BaseModel):
    new_phone: str


class PhoneVerifyRequest(BaseModel):
    otp_code: str


@router.post("/phone/request")
def request_phone_change(
    payload: PhoneChangeRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Stage a new phone number and send an OTP to verify it."""
    new_phone = payload.new_phone.strip()
    if not new_phone:
        raise HTTPException(status_code=400, detail="Phone number is required")
    if db.query(User).filter(User.phone == new_phone, User.id != user.id).first():
        raise HTTPException(status_code=409, detail="This phone number is already in use by another account")

    otp_code = ''.join(random.choices(string.digits, k=6))
    user.pending_phone = new_phone
    user.otp_code = otp_code
    user.otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
    db.commit()

    result = dispatch_otp(email=user.email, otp=otp_code, phone=new_phone, full_name=user.full_name)
    channels = ", ".join(result["channels"])
    return {"message": f"Verification code sent via {channels}"}


@router.post("/phone/verify")
def verify_phone_change(
    payload: PhoneVerifyRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Confirm OTP and apply the staged phone number."""
    if not user.pending_phone:
        raise HTTPException(status_code=400, detail="No phone change in progress")
    if not user.otp_code or not user.otp_expires_at:
        raise HTTPException(status_code=400, detail="No OTP found. Request a new one.")
    if datetime.utcnow() > user.otp_expires_at:
        raise HTTPException(status_code=400, detail="OTP has expired. Request a new one.")
    if user.otp_code != payload.otp_code:
        raise HTTPException(status_code=400, detail="Invalid OTP code")

    user.phone = user.pending_phone
    user.pending_phone = None
    user.otp_code = None
    user.otp_expires_at = None
    db.commit()

    return {"message": "Phone number updated successfully", "phone": user.phone}


# ── Forgot / Reset Password ────────────────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    email: str
    otp_code: str
    new_password: str


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Send a password-reset OTP to the user's email. Always returns 200 to avoid user enumeration."""
    user = db.query(User).filter(User.email == payload.email).first()
    if user and user.is_active:
        otp_code = ''.join(random.choices(string.digits, k=6))
        user.otp_code = otp_code
        user.otp_expires_at = datetime.utcnow() + timedelta(minutes=15)
        db.commit()
        dispatch_otp(
            email=user.email,
            otp=otp_code,
            phone=user.phone,
            full_name=user.full_name,
        )
    return {"message": "If that email is registered, a reset code has been sent."}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Verify OTP and set a new password."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code.")
    if not user.otp_code or not user.otp_expires_at:
        raise HTTPException(status_code=400, detail="No reset code found. Please request a new one.")
    if datetime.utcnow() > user.otp_expires_at:
        raise HTTPException(status_code=400, detail="Reset code has expired. Please request a new one.")
    if user.otp_code != payload.otp_code:
        raise HTTPException(status_code=400, detail="Invalid reset code.")
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    user.hashed_password = hash_password(payload.new_password)
    user.otp_code = None
    user.otp_expires_at = None
    db.commit()
    return {"message": "Password reset successfully. You can now log in."}
