"""Payment provider abstraction layer.

Providers:
  - AfricasTalking: mobile money B2C (payout) and C2B (collection/STK push)
  - Mock: automatic fallback when AT credentials are not configured

Usage:
  result = initiate_b2c_payout(phone, currency, amount, transfer_id)
  result = initiate_c2b_checkout(phone, currency, amount, wallet_id)
"""
from __future__ import annotations

import hashlib
import hmac
import logging
from decimal import Decimal
from typing import TypedDict

import requests

from app.core.config import settings

logger = logging.getLogger(__name__)

_AT_SANDBOX = settings.AT_USERNAME == "sandbox"
_AT_PAYMENTS_BASE = (
    "https://payments.sandbox.africastalking.com"
    if _AT_SANDBOX
    else "https://payments.africastalking.com"
)


# ── Result types ──────────────────────────────────────────────────────────────

class PayoutResult(TypedDict):
    provider_reference: str
    status: str   # "SENT" | "FAILED"
    raw: dict


class CollectionResult(TypedDict):
    provider_reference: str
    status: str   # "PENDING" | "FAILED"
    raw: dict


# ── Africa's Talking Payments ─────────────────────────────────────────────────

def _at_headers() -> dict:
    return {
        "Accept": "application/json",
        "apiKey": settings.AT_API_KEY,
        "Content-Type": "application/json",
    }


def _at_configured() -> bool:
    return bool(settings.AT_API_KEY and settings.AT_USERNAME)


def initiate_b2c_payout(
    phone: str,
    currency: str,
    amount: float,
    transfer_id: int,
) -> PayoutResult:
    """
    Send money to a recipient's mobile wallet (B2C payout).

    In sandbox mode the call is made against AT sandbox; production uses
    the live endpoint. Falls back to mock when no AT credentials are set.
    """
    if not _at_configured():
        logger.warning("AT credentials not configured — using mock payout for transfer %d", transfer_id)
        return _mock_payout(transfer_id)

    product = settings.AT_PRODUCT_NAME or "ZuriPay"
    payload = {
        "username": settings.AT_USERNAME,
        "productName": product,
        "recipients": [
            {
                "phoneNumber": phone,
                "currencyCode": currency,
                "amount": amount,
                "metadata": {"transferId": str(transfer_id)},
            }
        ],
    }

    try:
        resp = requests.post(
            f"{_AT_PAYMENTS_BASE}/mobile/b2c/request",
            json=payload,
            headers=_at_headers(),
            timeout=30,
        )
        data = resp.json()
        logger.info("AT B2C response [transfer %d]: %s", transfer_id, data)

        entries = data.get("responses", [])
        entry = entries[0] if entries else {}
        at_status = (entry.get("status") or "").upper()
        ref = entry.get("transactionId") or f"AT-B2C-{transfer_id}"

        # AT success statuses: "Success", "Queued"
        ok = at_status in ("SUCCESS", "QUEUED")
        return PayoutResult(
            provider_reference=ref,
            status="SENT" if ok else "FAILED",
            raw=data,
        )
    except Exception as exc:
        logger.error("AT B2C request failed [transfer %d]: %s", transfer_id, exc)
        return PayoutResult(
            provider_reference=f"ERR-{transfer_id}",
            status="FAILED",
            raw={"error": str(exc)},
        )


def initiate_c2b_checkout(
    phone: str,
    currency: str,
    amount: float,
    wallet_id: int,
) -> CollectionResult:
    """
    Trigger a mobile checkout (STK push) to collect funds from the user's phone.

    The user receives a USSD / PIN prompt on their handset. On success AT
    sends a webhook to /webhooks/africastalking which credits the wallet.
    """
    if not _at_configured():
        logger.warning("AT credentials not configured — using mock collection for wallet %d", wallet_id)
        return _mock_collection(wallet_id)

    product = settings.AT_PRODUCT_NAME or "ZuriPay"
    payload = {
        "username": settings.AT_USERNAME,
        "productName": product,
        "phoneNumber": phone,
        "currencyCode": currency,
        "amount": amount,
        "metadata": {"walletId": str(wallet_id)},
    }

    try:
        resp = requests.post(
            f"{_AT_PAYMENTS_BASE}/mobile/checkout/request",
            json=payload,
            headers=_at_headers(),
            timeout=30,
        )
        data = resp.json()
        logger.info("AT C2B response [wallet %d]: %s", wallet_id, data)

        at_status = (data.get("status") or "").upper()
        description = (data.get("description") or "").lower()
        ref = data.get("transactionId") or data.get("description") or f"CHECKOUT-{wallet_id}"

        ok = at_status == "SUCCESS" or "pending" in description or "waiting" in description
        return CollectionResult(
            provider_reference=ref,
            status="PENDING" if ok else "FAILED",
            raw=data,
        )
    except Exception as exc:
        logger.error("AT C2B request failed [wallet %d]: %s", wallet_id, exc)
        return CollectionResult(
            provider_reference=f"ERR-{wallet_id}",
            status="FAILED",
            raw={"error": str(exc)},
        )


def verify_at_webhook_signature(payload_bytes: bytes, signature: str) -> bool:
    """
    Verify the X-AfricasTalking-Signature header using the configured WEBHOOK_SECRET.
    Returns True if the secret is not set (skips verification in dev).
    """
    secret = settings.WEBHOOK_SECRET
    if not secret:
        return True
    expected = hmac.new(secret.encode(), payload_bytes, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


# ── Mock implementations ──────────────────────────────────────────────────────

def _mock_payout(transfer_id: int) -> PayoutResult:
    return PayoutResult(
        provider_reference=f"MOCK-B2C-{transfer_id}",
        status="SENT",
        raw={"mock": True},
    )


def _mock_collection(wallet_id: int) -> CollectionResult:
    return CollectionResult(
        provider_reference=f"MOCK-CHECKOUT-{wallet_id}",
        status="PENDING",
        raw={"mock": True},
    )
