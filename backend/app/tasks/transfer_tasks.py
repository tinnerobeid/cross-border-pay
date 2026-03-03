from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.celery_app import celery_app
from app.db.database import SessionLocal
from app.models.transfer import Transfer
from app.models.kyc import KYCProfile  # adjust import name to your actual model file/class
from app.services.fx_provider_exchangerate_host import ExchangeRateHostProvider
from app.services.pricing import PricingService
from app.core.config import settings


def _db() -> Session:
    return SessionLocal()


def _pricing_service() -> PricingService:
    fx_provider = ExchangeRateHostProvider(api_key=settings.EXCHANGERATE_HOST_API_KEY, cache_ttl_seconds=30)
    # Keep your same fee-on-top rule
    return PricingService(
        fx_provider=fx_provider,
        quote_ttl_seconds=120,
        fixed_fee=Decimal("1000"),
        percent_fee=Decimal("0.008"),
        min_fee=Decimal("1000"),
        max_fee=Decimal("15000"),
    )


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
        # KYC exists check (your new rule)
        kyc = db.query(KYCProfile).filter(KYCProfile.user_id == t.user_id).first()
        if not kyc:
            t.status = "FAILED"
            t.fail_reason = "KYC profile required"
            db.commit()
            return {"ok": False, "error": t.fail_reason}

        # --- pricing lock ---
        pricing = _pricing_service()
        q = pricing.quote  # async method in service; we’ll call it sync via asyncio
        import asyncio
        quote_res = asyncio.run(q(
            send_amount=Decimal(str(t.send_amount)),
            send_currency=t.send_currency,
            receive_currency=t.receive_currency,
        ))

        t.rate_used = quote_res.rate_used
        t.fee_used = quote_res.fee_used
        t.total_payable = quote_res.total_payable
        t.receive_amount = quote_res.receive_amount
        t.priced_at = datetime.now(timezone.utc).replace(tzinfo=None)

        # --- move to PROCESSING ---
        t.status = "PROCESSING"
        db.commit()

        # --- provider call (mock) ---
        # Replace this section later with NALA/Rafiki/Selcom payout call.
        # For MVP: mark as accepted immediately.
        t.provider_reference = f"MOCK-{t.id}-{int(datetime.now().timestamp())}"
        t.status = "SENT"
        db.commit()

        # schedule delivery poll to complete
        poll_delivery.apply_async(args=[t.id], countdown=8)

        return {"ok": True, "transfer_id": t.id, "status": t.status, "provider_reference": t.provider_reference}

    except Exception as e:
        db.rollback()
        # best effort mark failed if we can
        try:
            t = db.query(Transfer).filter(Transfer.id == transfer_id).first()
            if t:
                t.status = "FAILED"
                t.fail_reason = f"Exception: {type(e).__name__}"
                db.commit()
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
        return {"ok": True, "transfer_id": t.id, "status": t.status}

    except Exception as e:
        db.rollback()
        return {"ok": False, "error": str(e)}
    finally:
        db.close()