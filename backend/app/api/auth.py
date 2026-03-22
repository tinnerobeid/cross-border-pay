from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import random
import string
from datetime import datetime, timedelta

from app.db.database import get_db
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, SendOTPRequest, VerifyOTPRequest
from app.schemas.user import UserOut
from app.core.security import hash_password, verify_password, create_access_token
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserOut)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
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
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # TODO: Send OTP via email (implement email service)
        print(f"OTP for {payload.email}: {otp_code}")  # For development - log OTP

        return user

    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"DB integrity error: {str(e.orig)}")

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Register failed: {type(e).__name__}: {str(e)}")


@router.post("/send-otp")
def send_otp(payload: SendOTPRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Generate new OTP
    otp_code = ''.join(random.choices(string.digits, k=6))
    otp_expires_at = datetime.utcnow() + timedelta(minutes=10)

    user.otp_code = otp_code
    user.otp_expires_at = otp_expires_at
    db.commit()

    # TODO: Send OTP via email (implement email service)
    print(f"OTP for {payload.email}: {otp_code}")  # For development - log OTP

    return {"message": "OTP sent successfully"}


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
    db.commit()

    token = create_access_token(subject=str(user.id), role=user.role)
    return {"message": "Account verified successfully", "access_token": token}

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Account not verified. Please verify your email first.")

    token = create_access_token(subject=str(user.id), role=user.role)
    return TokenResponse(access_token=token)
