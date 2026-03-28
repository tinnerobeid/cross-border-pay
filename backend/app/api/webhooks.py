"""
Webhook receiver for payment provider callbacks.

Supported providers:
  - Africa's Talking (POST /webhooks/africastalking)
    Handles B2C payout results and C2B collection confirmations.
"""
from __future__ import annotations

import json
import logging
from decimal import Decimal, InvalidOperation

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.transfer import Transfer
from app.models.wallet import Wallet
from app.models.user import User
from app.services.notifications import dispatch_transfer_completed, dispatch_transfer_failed
from app.services.payment_providers import verify_at_webhook_signature

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


# ── Africa's Talking ──────────────────────────────────────────────────────────

@router.post("/africastalking")
async def at_webhook(
    request: Request,
    db: Session = Depends(get_db),
    x_africastalking_signature: str = Header(default=""),
):
    """
    Receive payment callbacks from Africa's Talking.

    AT sends a JSON body with:
      - transactionId
      - category: "MobileB2C" | "MobileCheckout"
      - transactionData.status: "Success" | "Failed" | ...
      - requestMetadata: { transferId?, walletId? }
      - transactionData.value: "KES 500.00" (for collection)
    """
    body = await request.body()

    if not verify_at_webhook_signature(body, x_africastalking_signature):
        logger.warning("AT webhook: invalid signature — rejecting request")
        raise HTTPException(status_code=403, detail="Invalid webhook signature")

    try:
        data = json.loads(body)
    except Exception:
        raise HTTPException(status_code=400, detail="Malformed JSON payload")

    logger.info("AT webhook: %s", json.dumps(data)[:600])

    tx_id = data.get("transactionId", "")
    category = (data.get("category") or "").upper()
    tx_data = data.get("transactionData") or {}
    metadata = data.get("requestMetadata") or {}
    at_status = (tx_data.get("status") or "").upper()

    transfer_id_str = metadata.get("transferId")
    wallet_id_str = metadata.get("walletId")

    if transfer_id_str:
        _handle_transfer_callback(db, int(transfer_id_str), tx_id, at_status)
    elif wallet_id_str:
        _handle_deposit_callback(db, int(wallet_id_str), tx_id, at_status, tx_data)
    else:
        logger.info("AT webhook: no transferId or walletId in metadata — ignoring (category=%s)", category)

    return {"ok": True}


def _handle_transfer_callback(
    db: Session, transfer_id: int, tx_id: str, at_status: str
) -> None:
    """Process a B2C payout callback and update transfer state."""
    t = db.query(Transfer).filter(Transfer.id == transfer_id).first()
    if not t:
        logger.warning("AT webhook: transfer %d not found", transfer_id)
        return

    if t.status in ("COMPLETED", "CANCELLED"):
        logger.info("AT webhook: transfer %d already terminal (%s) — skipping", transfer_id, t.status)
        return

    if at_status == "SUCCESS":
        if tx_id:
            t.provider_reference = tx_id
        t.status = "COMPLETED"
        db.commit()
        logger.info("AT webhook: transfer %d marked COMPLETED (ref=%s)", transfer_id, tx_id)

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
                reference=tx_id or t.provider_reference or f"TXN-{t.id}",
            )

    elif at_status in ("FAILED", "REJECTED", "CANCELLED"):
        _refund_and_fail(db, t, reason=f"Provider status: {at_status.lower()}", ref=tx_id)
        logger.info("AT webhook: transfer %d failed — refunded", transfer_id)

    else:
        logger.info("AT webhook: transfer %d unrecognised status '%s' — no action", transfer_id, at_status)


def _handle_deposit_callback(
    db: Session, wallet_id: int, tx_id: str, at_status: str, tx_data: dict
) -> None:
    """Process a C2B collection callback and credit the wallet."""
    if at_status != "SUCCESS":
        logger.info("AT webhook: deposit callback non-success (wallet=%d, status=%s)", wallet_id, at_status)
        return

    wallet = db.query(Wallet).filter(Wallet.id == wallet_id).first()
    if not wallet:
        logger.warning("AT webhook: wallet %d not found", wallet_id)
        return

    # AT value string format: "KES 500.00" or "TZS 10000"
    value_str = tx_data.get("value", "")
    try:
        amount = Decimal(value_str.split()[-1])
    except (InvalidOperation, IndexError):
        logger.error("AT webhook: cannot parse amount from '%s' for wallet %d", value_str, wallet_id)
        return

    wallet.balance = Decimal(str(wallet.balance)) + amount
    db.commit()
    logger.info("AT webhook: credited wallet %d with %s (ref=%s)", wallet_id, amount, tx_id)


def _refund_and_fail(db: Session, t: Transfer, reason: str, ref: str = "") -> None:
    """Refund total_payable to sender wallet and mark transfer FAILED."""
    if t.total_payable:
        wallet = db.query(Wallet).filter(
            Wallet.user_id == t.user_id,
            Wallet.currency == t.send_currency.upper(),
        ).first()
        if wallet:
            wallet.balance = Decimal(str(wallet.balance)) + Decimal(str(t.total_payable))

    t.status = "FAILED"
    t.fail_reason = reason
    if ref:
        t.provider_reference = ref
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
            reason=reason,
        )
