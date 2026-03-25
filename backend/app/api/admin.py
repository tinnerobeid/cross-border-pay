from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date
from decimal import Decimal

from app.db.database import get_db
from app.api.deps import require_admin
from app.models.user import User
from app.models.kyc import KYCProfile
from app.models.transfer import Transfer
from app.schemas.kyc import KYCOut, AdminKYCDecision
from app.schemas.transfer import TransferOut, TransferStatusUpdate
from app.services.transfer_service import validate_transition
from app.services import pricing_engine as _pe
from app.services.pricing_engine import get_rate, _FALLBACK, _CACHE

from pydantic import BaseModel, EmailStr
from app.core.security import hash_password

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class UserAdminOut(BaseModel):
    id: int
    email: str
    full_name: str
    phone: str | None
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    phone: str | None = None
    password: str
    role: str = "user"  # "user" or "admin"


class StatsOut(BaseModel):
    total_users: int
    active_users: int
    verified_users: int
    pending_kyc: int
    approved_kyc: int
    total_transfers: int
    transfers_today: int
    volume_today: float
    volume_total: float
    failed_transfers: int
    cancelled_transfers: int
    total_fees_earned: float
    fees_earned_today: float


class RateOut(BaseModel):
    pair: str
    rate: float
    is_override: bool = False  # True = admin-set override; False = live/fallback rate


class RateUpdate(BaseModel):
    rate: float


class RateCreate(BaseModel):
    from_currency: str
    to_currency: str
    rate: float


class KYCAdminOut(KYCOut):
    submitted_at: datetime | None = None
    reviewed_at: datetime | None = None
    user_email: str | None = None
    user_name: str | None = None


# ── Stats / Dashboard ─────────────────────────────────────────────────────────

@router.get("/stats", response_model=StatsOut)
def get_stats(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    today = date.today()

    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0
    verified_users = db.query(func.count(User.id)).filter(User.is_verified == True).scalar() or 0

    pending_kyc = db.query(func.count(KYCProfile.id)).filter(KYCProfile.status == "pending").scalar() or 0
    approved_kyc = db.query(func.count(KYCProfile.id)).filter(KYCProfile.status == "approved").scalar() or 0

    total_transfers = db.query(func.count(Transfer.id)).scalar() or 0
    transfers_today = (
        db.query(func.count(Transfer.id))
        .filter(func.date(Transfer.created_at) == today)
        .scalar() or 0
    )

    volume_today = db.query(func.sum(Transfer.send_amount)).filter(
        func.date(Transfer.created_at) == today
    ).scalar() or 0

    volume_total = db.query(func.sum(Transfer.send_amount)).scalar() or 0

    failed_transfers = db.query(func.count(Transfer.id)).filter(Transfer.status == "failed").scalar() or 0
    cancelled_transfers = (
        db.query(func.count(Transfer.id))
        .filter(Transfer.status.in_(["cancelled", "CANCELLED"]))
        .scalar() or 0
    )

    total_fees_earned = db.query(func.sum(Transfer.zuripay_fee)).scalar() or 0
    fees_earned_today = (
        db.query(func.sum(Transfer.zuripay_fee))
        .filter(func.date(Transfer.created_at) == today)
        .scalar() or 0
    )

    return StatsOut(
        total_users=total_users,
        active_users=active_users,
        verified_users=verified_users,
        pending_kyc=pending_kyc,
        approved_kyc=approved_kyc,
        total_transfers=total_transfers,
        transfers_today=transfers_today,
        volume_today=float(volume_today),
        volume_total=float(volume_total),
        failed_transfers=failed_transfers,
        cancelled_transfers=cancelled_transfers,
        total_fees_earned=float(total_fees_earned),
        fees_earned_today=float(fees_earned_today),
    )


# ── Users ─────────────────────────────────────────────────────────────────────

@router.get("/users", response_model=list[UserAdminOut])
def list_users(
    search: str | None = Query(None),
    is_active: bool | None = Query(None),
    is_verified: bool | None = Query(None),
    role: str | None = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    q = db.query(User)
    if search:
        like = f"%{search}%"
        q = q.filter((User.email.ilike(like)) | (User.full_name.ilike(like)))
    if is_active is not None:
        q = q.filter(User.is_active == is_active)
    if is_verified is not None:
        q = q.filter(User.is_verified == is_verified)
    if role:
        q = q.filter(User.role == role)
    return q.order_by(User.id.desc()).offset(skip).limit(limit).all()


@router.post("/users", response_model=UserAdminOut, status_code=201)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Create a new user (or admin) directly from the admin panel — no OTP required."""
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if payload.role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="Role must be 'user' or 'admin'")
    u = User(
        email=payload.email,
        full_name=payload.full_name,
        phone=payload.phone,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        is_active=True,
        is_verified=True,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@router.get("/users/{user_id}", response_model=UserAdminOut)
def get_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return u


@router.get("/users/{user_id}/transfers", response_model=list[TransferOut])
def get_user_transfers(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return db.query(Transfer).filter(Transfer.user_id == user_id).order_by(Transfer.id.desc()).all()


@router.patch("/users/{user_id}/status", response_model=UserAdminOut)
def update_user_status(
    user_id: int,
    payload: UserStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    if u.role == "admin":
        raise HTTPException(status_code=403, detail="Cannot change admin status")
    u.is_active = payload.is_active
    db.commit()
    db.refresh(u)
    return u


# ── KYC ───────────────────────────────────────────────────────────────────────

@router.get("/kyc", response_model=list[KYCAdminOut])
def list_kyc(
    status: str | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    q = db.query(KYCProfile)
    if status:
        q = q.filter(KYCProfile.status == status)
    records = q.order_by(KYCProfile.id.desc()).offset(skip).limit(limit).all()

    result = []
    for k in records:
        user = db.get(User, k.user_id)
        result.append(KYCAdminOut(
            id=k.id,
            user_id=k.user_id,
            status=k.status,
            country=k.country,
            id_type=k.id_type,
            id_number=k.id_number,
            selfie_path=k.selfie_path,
            id_front_path=k.id_front_path,
            id_back_path=k.id_back_path,
            review_note=k.review_note,
            submitted_at=getattr(k, "submitted_at", None),
            reviewed_at=getattr(k, "reviewed_at", None),
            user_email=user.email if user else None,
            user_name=user.full_name if user else None,
        ))
    return result


@router.post("/kyc/{kyc_id}/approve", response_model=KYCOut)
def approve_kyc(kyc_id: int, payload: AdminKYCDecision, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    kyc = db.get(KYCProfile, kyc_id)
    if not kyc:
        raise HTTPException(status_code=404, detail="KYC not found")
    kyc.status = "approved"
    kyc.review_note = payload.note
    kyc.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(kyc)
    return kyc


@router.post("/kyc/{kyc_id}/reject", response_model=KYCOut)
def reject_kyc(kyc_id: int, payload: AdminKYCDecision, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    kyc = db.get(KYCProfile, kyc_id)
    if not kyc:
        raise HTTPException(status_code=404, detail="KYC not found")
    kyc.status = "rejected"
    kyc.review_note = payload.note
    kyc.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(kyc)
    return kyc


# ── Transfers ─────────────────────────────────────────────────────────────────

@router.get("/transfers", response_model=list[TransferOut])
def list_transfers(
    status: str | None = None,
    user_id: int | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    q = db.query(Transfer)
    if status:
        q = q.filter(Transfer.status == status)
    if user_id:
        q = q.filter(Transfer.user_id == user_id)
    return q.order_by(Transfer.id.desc()).offset(skip).limit(limit).all()


@router.patch("/transfers/{transfer_id}/status", response_model=TransferOut)
def update_transfer_status(
    transfer_id: int,
    payload: TransferStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    t = db.get(Transfer, transfer_id)
    if not t:
        raise HTTPException(status_code=404, detail="Transfer not found")

    validate_transition(t.status, payload.status)

    t.status = payload.status
    t.updated_at = datetime.utcnow()

    if payload.status == "failed":
        t.fail_reason = payload.fail_reason or "Unknown failure"

    db.commit()
    db.refresh(t)
    return t


# ── Exchange Rates ────────────────────────────────────────────────────────────

@router.get("/rates", response_model=list[RateOut])
def list_rates(admin: User = Depends(require_admin)):
    """
    Returns all known rates:
    - Admin overrides (is_override=True) — set manually, take highest priority
    - Live/cached rates from the FX API (is_override=False)
    - Fallback hardcoded rates (is_override=False) shown only if no live rate exists
    """
    seen: set[tuple] = set()
    result: list[RateOut] = []

    # 1. Admin overrides
    for pair, rate in _pe.SIM_FX.items():
        result.append(RateOut(pair=f"{pair[0]}/{pair[1]}", rate=float(rate), is_override=True))
        seen.add(pair)

    # 2. Cached live rates
    for pair, (rate, _) in _CACHE.items():
        if pair not in seen:
            result.append(RateOut(pair=f"{pair[0]}/{pair[1]}", rate=float(rate), is_override=False))
            seen.add(pair)

    # 3. Fallback rates (show ones not already covered)
    for pair, rate in _FALLBACK.items():
        if pair not in seen:
            result.append(RateOut(pair=f"{pair[0]}/{pair[1]}", rate=float(rate), is_override=False))
            seen.add(pair)

    return result


@router.put("/rates/{from_currency}/{to_currency}", response_model=RateOut)
def update_rate(
    from_currency: str,
    to_currency: str,
    payload: RateUpdate,
    admin: User = Depends(require_admin),
):
    pair = (from_currency.upper(), to_currency.upper())
    _pe.SIM_FX[pair] = Decimal(str(payload.rate))
    return RateOut(pair=f"{pair[0]}/{pair[1]}", rate=payload.rate, is_override=True)


@router.post("/rates", response_model=RateOut)
def add_rate(
    payload: RateCreate,
    admin: User = Depends(require_admin),
):
    pair = (payload.from_currency.upper(), payload.to_currency.upper())
    _pe.SIM_FX[pair] = Decimal(str(payload.rate))
    return RateOut(pair=f"{pair[0]}/{pair[1]}", rate=payload.rate, is_override=True)


@router.delete("/rates/{from_currency}/{to_currency}")
def delete_rate(
    from_currency: str,
    to_currency: str,
    admin: User = Depends(require_admin),
):
    pair = (from_currency.upper(), to_currency.upper())
    if pair not in _pe.SIM_FX:
        raise HTTPException(status_code=404, detail="Rate not found")
    del _pe.SIM_FX[pair]
    return {"message": f"Rate {pair[0]}/{pair[1]} deleted"}
