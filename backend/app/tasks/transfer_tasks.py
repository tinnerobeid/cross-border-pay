from __future__ import annotations

from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.celery_app import celery_app
from app.db.database import SessionLocal
from app.models.transfer import Transfer
from app.models.kyc import KYCProfile
from app.models.wallet import Wallet
from app.models.user import User
from app.services.notifications import dispatch_transfer_completed, dispatch_transfer_failed

# Transfers stuck in PROCESSING or SENT longer than this are reconciled
_STUCK_THRESHOLD_MINUTES = 30


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


@celery_app.task(name="transfers.reconcile_stuck")
def reconcile_stuck_transfers() -> dict:
    """
    Periodic reconciliation task — runs every 15 minutes via Celery beat.

    Finds transfers stuck in PROCESSING or SENT for more than
    _STUCK_THRESHOLD_MINUTES and attempts to resolve them:

    - PROCESSING (no provider response yet): re-trigger the payout.
    - SENT (payout was accepted but no webhook arrived): query AT for
      the transaction status and apply the result. Falls back to marking
      FAILED + refund when AT is not configured (mock/sandbox environment).
    """
    import logging
    logger = logging.getLogger(__name__)

    db = _db()
    cutoff = datetime.utcnow() - timedelta(minutes=_STUCK_THRESHOLD_MINUTES)
    resolved = 0
    errors = 0

    try:
        stuck = (
            db.query(Transfer)
            .filter(
                Transfer.status.in_(("PROCESSING", "SENT")),
                Transfer.updated_at <= cutoff,
            )
            .all()
        )

        if not stuck:
            return {"ok": True, "checked": 0, "resolved": 0}

        logger.info("reconcile_stuck: found %d stuck transfer(s)", len(stuck))

        from app.services.payment_providers import _at_configured
        at_ok = _at_configured()

        for t in stuck:
            try:
                age_mins = (datetime.utcnow() - t.updated_at).total_seconds() / 60
                logger.warning(
                    "reconcile_stuck: transfer %d stuck in %s for %.0f min",
                    t.id, t.status, age_mins,
                )

                if t.status == "PROCESSING":
                    # No provider reference yet — re-trigger payout
                    from app.services.payment_providers import initiate_b2c_payout
                    result = initiate_b2c_payout(
                        phone=t.recipient_phone,
                        currency=t.receive_currency,
                        amount=float(t.receive_amount or t.send_amount),
                        transfer_id=t.id,
                    )
                    t.provider_reference = result["provider_reference"]
                    if result["status"] == "FAILED":
                        _refund_wallet(db, t)
                        t.status = "FAILED"
                        t.fail_reason = "Reconciliation: provider rejected re-attempt"
                        user = db.get(User, t.user_id)
                        if user:
                            dispatch_transfer_failed(
                                email=user.email, full_name=user.full_name,
                                phone=user.phone, transfer_id=t.id,
                                send_amount=str(t.send_amount),
                                send_currency=t.send_currency,
                                reason=t.fail_reason,
                            )
                    else:
                        t.status = "SENT"
                    db.commit()
                    resolved += 1

                elif t.status == "SENT":
                    if at_ok and t.provider_reference:
                        # Query AT for the real transaction status
                        import requests as _req
                        from app.core.config import settings
                        headers = {
                            "Accept": "application/json",
                            "apiKey": settings.AT_API_KEY,
                        }
                        base = (
                            "https://payments.sandbox.africastalking.com"
                            if settings.AT_USERNAME == "sandbox"
                            else "https://payments.africastalking.com"
                        )
                        resp = _req.get(
                            f"{base}/query/transaction/find",
                            params={
                                "username": settings.AT_USERNAME,
                                "transactionId": t.provider_reference,
                            },
                            headers=headers,
                            timeout=15,
                        )
                        data = resp.json()
                        at_status = (
                            (data.get("status") or "")
                            .upper()
                            .replace(" ", "_")
                        )
                        logger.info(
                            "reconcile_stuck: AT query for %s → %s",
                            t.provider_reference, at_status,
                        )

                        if at_status in ("SUCCESS", "COMPLETED"):
                            t.status = "COMPLETED"
                            db.commit()
                            user = db.get(User, t.user_id)
                            if user:
                                dispatch_transfer_completed(
                                    email=user.email, full_name=user.full_name,
                                    phone=user.phone, transfer_id=t.id,
                                    send_amount=str(t.send_amount),
                                    send_currency=t.send_currency,
                                    receive_amount=str(t.receive_amount or ""),
                                    receive_currency=t.receive_currency,
                                    recipient_name=t.recipient_name,
                                    reference=t.provider_reference or f"TXN-{t.id}",
                                )
                            resolved += 1
                        elif at_status in ("FAILED", "REJECTED", "INVALID_REQUEST"):
                            _refund_wallet(db, t)
                            t.status = "FAILED"
                            t.fail_reason = f"Reconciliation: AT status {at_status}"
                            db.commit()
                            user = db.get(User, t.user_id)
                            if user:
                                dispatch_transfer_failed(
                                    email=user.email, full_name=user.full_name,
                                    phone=user.phone, transfer_id=t.id,
                                    send_amount=str(t.send_amount),
                                    send_currency=t.send_currency,
                                    reason=t.fail_reason,
                                )
                            resolved += 1
                        else:
                            # Still pending at AT — log and wait for next cycle
                            logger.info(
                                "reconcile_stuck: transfer %d AT status '%s' — waiting",
                                t.id, at_status,
                            )
                    else:
                        # No AT config or no reference — fail and refund after threshold
                        _refund_wallet(db, t)
                        t.status = "FAILED"
                        t.fail_reason = "Reconciliation: no webhook received within threshold"
                        db.commit()
                        user = db.get(User, t.user_id)
                        if user:
                            dispatch_transfer_failed(
                                email=user.email, full_name=user.full_name,
                                phone=user.phone, transfer_id=t.id,
                                send_amount=str(t.send_amount),
                                send_currency=t.send_currency,
                                reason=t.fail_reason,
                            )
                        resolved += 1

            except Exception as exc:
                logger.error("reconcile_stuck: error processing transfer %d: %s", t.id, exc)
                db.rollback()
                errors += 1

        return {"ok": True, "checked": len(stuck), "resolved": resolved, "errors": errors}

    except Exception as exc:
        logger.error("reconcile_stuck: unexpected error: %s", exc)
        return {"ok": False, "error": str(exc)}
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