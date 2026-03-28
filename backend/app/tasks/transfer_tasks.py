from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.celery_app import celery_app
from app.db.database import SessionLocal
from app.models.transfer import Transfer
from app.models.kyc import KYCProfile
from app.models.wallet import Wallet
from app.models.user import User
from app.services.notifications import dispatch_transfer_completed, dispatch_transfer_failed


def _db() -> Session:
    return SessionLocal()


def _refund_wallet(db: Session, transfer: Transfer) -> None:
    """Refund total_payable back to the sender's wallet when a transfer fails."""
    if not transfer.total_payable:
        return
    wallet = db.query(Wallet).filter(
        Wallet.user_id == transfer.user_id,
        Wallet.currency == transfer.send_currency.upper(),
    ).first()
    if wallet:
        wallet.balance = Decimal(str(wallet.balance)) + Decimal(str(transfer.total_payable))


@celery_app.task(name="transfers.process_transfer")
def process_transfer(transfer_id: int) -> dict:
    """
    CREATED -> PROCESSING -> SENT (or FAILED)
    Then schedule polling to reach COMPLETED.
    """
    db = _db()
    try:
        t = db.query(Transfer).filter(Transfer.id == transfer_id).first()
        if not t:
            return {"ok": False, "error": "transfer not found"}

        # Only process transfers in CREATED
        if t.status not in ("CREATED",):
            return {"ok": True, "skipped": True, "status": t.status}

        # --- checks ---
        # KYC exists check
        kyc = db.query(KYCProfile).filter(KYCProfile.user_id == t.user_id).first()
        if not kyc:
            t.status = "FAILED"
            t.fail_reason = "KYC profile required"
            _refund_wallet(db, t)
            db.commit()
            user = db.get(User, t.user_id)
            if user:
                dispatch_transfer_failed(
                    email=user.email,
                    full_name=user.full_name,
                    phone=user.phone,
                    transfer_id=t.id,
                    send_amount=str(t.send_amount),
                    send_currency=t.send_currency,
                    reason=t.fail_reason,
                )
            return {"ok": False, "error": t.fail_reason}

        # Pricing was already locked at creation time (rate_used, fee_used, total_payable stored).
        # No re-pricing here — just move to PROCESSING.
        t.status = "PROCESSING"
        db.commit()

        # --- provider call ---
        from app.services.payment_providers import initiate_b2c_payout
        result = initiate_b2c_payout(
            phone=t.recipient_phone,
            currency=t.receive_currency,
            amount=float(t.receive_amount or t.send_amount),
            transfer_id=t.id,
        )
        t.provider_reference = result["provider_reference"]

        if result["status"] == "FAILED":
            t.status = "FAILED"
            t.fail_reason = "Payout rejected by provider"
            _refund_wallet(db, t)
            db.commit()
            user = db.get(User, t.user_id)
            if user:
                dispatch_transfer_failed(
                    email=user.email,
                    full_name=user.full_name,
                    phone=user.phone,
                    transfer_id=t.id,
                    send_amount=str(t.send_amount),
                    send_currency=t.send_currency,
                    reason=t.fail_reason,
                )
            return {"ok": False, "error": t.fail_reason}

        t.status = "SENT"
        db.commit()

        # For real AT payouts, COMPLETED comes via webhook (/webhooks/africastalking).
        # poll_delivery is kept as a fallback for mock / sandbox where no webhook fires.
        poll_delivery.apply_async(args=[t.id], countdown=30)

        return {"ok": True, "transfer_id": t.id, "status": t.status, "provider_reference": t.provider_reference}

    except Exception as e:
        db.rollback()
        # best effort mark failed if we can
        try:
            t = db.query(Transfer).filter(Transfer.id == transfer_id).first()
            if t:
                t.status = "FAILED"
                t.fail_reason = f"Exception: {type(e).__name__}"
                _refund_wallet(db, t)
                db.commit()
                user = db.get(User, t.user_id)
                if user:
                    dispatch_transfer_failed(
                        email=user.email,
                        full_name=user.full_name,
                        phone=user.phone,
                        transfer_id=t.id,
                        send_amount=str(t.send_amount),
                        send_currency=t.send_currency,
                        reason=t.fail_reason,
                    )
        except Exception:
            pass
        return {"ok": False, "error": str(e)}
    finally:
        db.close()


@celery_app.task(name="transfers.poll_delivery")
def poll_delivery(transfer_id: int) -> dict:
    """
    SENT -> COMPLETED (or FAILED) by polling/webhook simulation.
    In production, replace with provider webhook handler and/or real polling API.
    """
    db = _db()
    try:
        t = db.query(Transfer).filter(Transfer.id == transfer_id).first()
        if not t:
            return {"ok": False, "error": "transfer not found"}

        if t.status != "SENT":
            return {"ok": True, "skipped": True, "status": t.status}

        # Mock outcome: succeed
        t.status = "COMPLETED"
        db.commit()

        user = db.get(User, t.user_id)
        if user:
            dispatch_transfer_completed(
                email=user.email,
                full_name=user.full_name,
                phone=user.phone,
                transfer_id=t.id,
                send_amount=str(t.send_amount),
                send_currency=t.send_currency,
                receive_amount=str(t.receive_amount or ""),
                receive_currency=t.receive_currency,
                recipient_name=t.recipient_name,
                reference=t.provider_reference or f"TXN-{t.id}",
            )

        return {"ok": True, "transfer_id": t.id, "status": t.status}

    except Exception as e:
        db.rollback()
        try:
            t = db.query(Transfer).filter(Transfer.id == transfer_id).first()
            if t and t.status not in ("COMPLETED", "CANCELLED"):
                t.status = "FAILED"
                t.fail_reason = f"Delivery error: {type(e).__name__}"
                _refund_wallet(db, t)
                db.commit()
                user = db.get(User, t.user_id)
                if user:
                    dispatch_transfer_failed(
                        email=user.email,
                        full_name=user.full_name,
                        phone=user.phone,
                        transfer_id=t.id,
                        send_amount=str(t.send_amount),
                        send_currency=t.send_currency,
                        reason=t.fail_reason,
                    )
        except Exception:
            pass
        return {"ok": False, "error": str(e)}
    finally:
        db.close()