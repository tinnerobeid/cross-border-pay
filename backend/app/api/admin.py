import csv
import io

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date, timedelta, time
from decimal import Decimal

from app.db.database import get_db
from app.api.deps import require_admin
from app.models.user import User
from app.models.kyc import KYCProfile
from app.models.transfer import Transfer
from app.models.wallet import Wallet
from app.schemas.kyc import KYCOut, AdminKYCDecision
from app.schemas.transfer import TransferOut, TransferStatusUpdate
from app.services.transfer_service import validate_transition
from app.services import pricing_engine as _pe
from app.services.pricing_engine import get_rate, _FALLBACK, _USD_RATES

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


class PeriodStatsOut(BaseModel):
    from_date: date | None
    to_date: date | None
    transfer_count: int
    completed_count: int
    total_volume: float
    total_fees: float


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
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow_start = today_start + timedelta(days=1)

    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0
    verified_users = db.query(func.count(User.id)).filter(User.is_verified == True).scalar() or 0

    pending_kyc = db.query(func.count(KYCProfile.id)).filter(KYCProfile.status == "pending").scalar() or 0
    approved_kyc = db.query(func.count(KYCProfile.id)).filter(KYCProfile.status == "approved").scalar() or 0

    total_transfers = db.query(func.count(Transfer.id)).scalar() or 0
    transfers_today = (
        db.query(func.count(Transfer.id))
        .filter(Transfer.created_at >= today_start, Transfer.created_at < tomorrow_start)
        .scalar() or 0
    )

    # Volume and fees — convert each transfer's currency to KRW then sum
    from app.services.pricing_engine import get_rate

    def _to_krw_sum(rows) -> float:
        """rows: list of (send_currency, amount)"""
        return sum(
            float(amount or 0) * float(get_rate(currency, "KRW"))
            for currency, amount in rows
            if amount
        )

    volume_today = _to_krw_sum(
        db.query(Transfer.send_currency, Transfer.send_amount)
        .filter(Transfer.created_at >= today_start, Transfer.created_at < tomorrow_start)
        .all()
    )
    volume_total = _to_krw_sum(
        db.query(Transfer.send_currency, Transfer.send_amount).all()
    )

    failed_transfers = (
        db.query(func.count(Transfer.id))
        .filter(Transfer.status.in_(["FAILED", "failed"]))
        .scalar() or 0
    )
    cancelled_transfers = (
        db.query(func.count(Transfer.id))
        .filter(Transfer.status.in_(["CANCELLED", "cancelled"]))
        .scalar() or 0
    )

    # Fees earned from successful transfers only (failed/cancelled are refunded).
    # "received" and "SENT" are also successful terminal/in-flight states.
    SUCCESSFUL = ("COMPLETED", "received", "SENT")

    total_fees_earned = _to_krw_sum(
        db.query(Transfer.send_currency, Transfer.fee_used)
        .filter(Transfer.status.in_(SUCCESSFUL))
        .all()
    )
    fees_earned_today = _to_krw_sum(
        db.query(Transfer.send_currency, Transfer.fee_used)
        .filter(
            Transfer.status.in_(SUCCESSFUL),
            Transfer.created_at >= today_start,
            Transfer.created_at < tomorrow_start,
        )
        .all()
    )

    return StatsOut(
        total_users=total_users,
        active_users=active_users,
        verified_users=verified_users,
        pending_kyc=pending_kyc,
        approved_kyc=approved_kyc,
        total_transfers=total_transfers,
        transfers_today=transfers_today,
        volume_today=round(volume_today),
        volume_total=round(volume_total),
        failed_transfers=failed_transfers,
        cancelled_transfers=cancelled_transfers,
        total_fees_earned=round(total_fees_earned),
        fees_earned_today=round(fees_earned_today),
    )


# ── Period stats (date-range aggregation) ────────────────────────────────────

@router.get("/stats/period", response_model=PeriodStatsOut)
def get_period_stats(
    from_date: date | None = Query(None, description="Start date inclusive (YYYY-MM-DD)"),
    to_date: date | None = Query(None, description="End date inclusive (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Return transfer count, volume and fees earned for any date range."""
    def _apply_date_filter(q):
        if from_date:
            q = q.filter(Transfer.created_at >= datetime.combine(from_date, time.min))
        if to_date:
            q = q.filter(Transfer.created_at < datetime.combine(to_date + timedelta(days=1), time.min))
        return q

    from app.services.pricing_engine import get_rate as _get_rate

    def _period_to_krw(rows) -> float:
        return sum(
            float(amount or 0) * float(_get_rate(currency, "KRW"))
            for currency, amount in rows
            if amount
        )

    SUCCESSFUL = ("COMPLETED", "received", "SENT")

    transfer_count = _apply_date_filter(db.query(func.count(Transfer.id))).scalar() or 0
    completed_count = (
        _apply_date_filter(db.query(func.count(Transfer.id)))
        .filter(Transfer.status.in_(SUCCESSFUL))
        .scalar() or 0
    )
    total_volume = _period_to_krw(
        _apply_date_filter(
            db.query(Transfer.send_currency, Transfer.send_amount)
        ).all()
    )
    total_fees = _period_to_krw(
        _apply_date_filter(
            db.query(Transfer.send_currency, Transfer.fee_used)
        ).filter(Transfer.status.in_(SUCCESSFUL)).all()
    )

    return PeriodStatsOut(
        from_date=from_date,
        to_date=to_date,
        transfer_count=transfer_count,
        completed_count=completed_count,
        total_volume=round(total_volume),
        total_fees=round(total_fees),
    )


# ── Users ─────────────────────────────────────────────────────────────────────

@router.get("/users", response_model=list[UserAdminOut])
def list_users(
    response: Response,
    search: str | None = Query(None),
    is_active: bool | None = Query(None),
    is_verified: bool | None = Query(None),
    role: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
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
    total = q.count()
    items = q.order_by(User.id.desc()).offset(skip).limit(limit).all()
    response.headers["X-Total-Count"] = str(total)
    response.headers["Access-Control-Expose-Headers"] = "X-Total-Count"
    return items


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
    response: Response,
    status: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    q = db.query(KYCProfile)
    if status:
        q = q.filter(KYCProfile.status == status)
    total = q.count()
    records = q.order_by(KYCProfile.id.desc()).offset(skip).limit(limit).all()
    response.headers["X-Total-Count"] = str(total)
    response.headers["Access-Control-Expose-Headers"] = "X-Total-Count"

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
    response: Response,
    status: str | None = None,
    user_id: int | None = None,
    from_date: date | None = Query(None, description="Filter from this date inclusive (YYYY-MM-DD)"),
    to_date: date | None = Query(None, description="Filter to this date inclusive (YYYY-MM-DD)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    q = db.query(Transfer)
    if status:
        q = q.filter(Transfer.status == status)
    if user_id:
        q = q.filter(Transfer.user_id == user_id)
    if from_date:
        q = q.filter(Transfer.created_at >= datetime.combine(from_date, time.min))
    if to_date:
        q = q.filter(Transfer.created_at < datetime.combine(to_date + timedelta(days=1), time.min))
    total = q.count()
    items = q.order_by(Transfer.id.desc()).offset(skip).limit(limit).all()
    response.headers["X-Total-Count"] = str(total)
    response.headers["Access-Control-Expose-Headers"] = "X-Total-Count"

    from app.services.pricing_engine import get_rate as _get_rate
    from app.schemas.transfer import TransferOut as _TransferOut
    result = []
    for t in items:
        out = _TransferOut.model_validate(t)
        if t.send_currency.upper() != "KRW" and t.send_amount:
            out.send_amount_krw = round(float(t.send_amount) * float(_get_rate(t.send_currency, "KRW")))
        else:
            out.send_amount_krw = float(t.send_amount or 0)
        result.append(out)
    return result


@router.get("/transfers/export")
def export_transfers_csv(
    status: str | None = None,
    user_id: int | None = None,
    from_date: date | None = Query(None, description="Start date inclusive (YYYY-MM-DD)"),
    to_date: date | None = Query(None, description="End date inclusive (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Download all matching transfers as a CSV file."""
    q = db.query(Transfer)
    if status:
        q = q.filter(Transfer.status == status)
    if user_id:
        q = q.filter(Transfer.user_id == user_id)
    if from_date:
        q = q.filter(Transfer.created_at >= datetime.combine(from_date, time.min))
    if to_date:
        q = q.filter(Transfer.created_at < datetime.combine(to_date + timedelta(days=1), time.min))
    transfers = q.order_by(Transfer.id.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Status", "Recipient Name", "Recipient Phone",
        "Send Currency", "Send Amount", "Receive Currency", "Receive Amount",
        "Fee", "Rate", "Transfer Type", "Provider", "Fail Reason", "Created At",
    ])
    for t in transfers:
        writer.writerow([
            f"ZP-{t.id}",
            t.status,
            t.recipient_name,
            t.recipient_phone,
            t.send_currency,
            float(t.send_amount or 0),
            t.receive_currency,
            float(t.receive_amount or 0),
            float(t.fee_used or 0),
            float(t.rate_used or 0),
            t.transfer_type or "",
            t.provider or "",
            t.fail_reason or "",
            t.created_at.strftime("%Y-%m-%d %H:%M:%S") if t.created_at else "",
        ])

    output.seek(0)
    filename = f"zuripay-transfers-{datetime.utcnow().strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


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

    if payload.status in ("failed", "FAILED"):
        t.fail_reason = payload.fail_reason or "Unknown failure"
        # Refund total_payable back to the sender's wallet
        wallet = db.query(Wallet).filter(
            Wallet.user_id == t.user_id,
            Wallet.currency == t.send_currency.upper(),
        ).first()
        if wallet and t.total_payable:
            wallet.balance = Decimal(str(wallet.balance)) + Decimal(str(t.total_payable))

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

    # 2. Live bulk-fetched rates (cross-calculated through USD)
    from app.services.pricing_engine import _live_cross_rate
    for pair, rate in _FALLBACK.items():
        if pair not in seen:
            live = _live_cross_rate(pair[0], pair[1])
            if live is not None:
                result.append(RateOut(pair=f"{pair[0]}/{pair[1]}", rate=float(live), is_override=False))
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
