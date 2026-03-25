from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
import logging

import httpx

logger = logging.getLogger(__name__)

# ── Admin-managed overrides (highest priority, managed via /admin/rates) ───────
SIM_FX: dict[tuple[str, str], Decimal] = {}

# ── Fee tables ─────────────────────────────────────────────────────────────────
# International flat fee per send currency (~3 000 KRW equivalent)
INTERNATIONAL_FEE: dict[str, Decimal] = {
    'KRW': Decimal('3000'),
    'TZS': Decimal('5500'),
    'USD': Decimal('3'),
    'KES': Decimal('390'),
    'RWF': Decimal('2500'),
    'UGX': Decimal('8000'),
    'BIF': Decimal('6000'),
}

# Domestic fee when recipient is NOT a linked account (~1 000 KRW equivalent)
DOMESTIC_FEE: dict[str, Decimal] = {
    'KRW': Decimal('1000'),
    'TZS': Decimal('500'),
    'USD': Decimal('1'),
    'KES': Decimal('130'),
    'RWF': Decimal('800'),
    'UGX': Decimal('2500'),
    'BIF': Decimal('2000'),
}

# Minimum send amount for international transfers (~5 000 KRW equivalent)
INTERNATIONAL_MIN_SEND: dict[str, Decimal] = {
    'KRW': Decimal('5000'),
    'TZS': Decimal('9500'),
    'USD': Decimal('4'),
    'KES': Decimal('650'),
    'RWF': Decimal('4200'),
    'UGX': Decimal('13500'),
    'BIF': Decimal('10000'),
}

# Minimum wallet balance required for international transfers (~10 000 KRW)
INTERNATIONAL_MIN_BALANCE: dict[str, Decimal] = {
    'KRW': Decimal('10000'),
    'TZS': Decimal('19000'),
    'USD': Decimal('8'),
    'KES': Decimal('1300'),
    'RWF': Decimal('8400'),
    'UGX': Decimal('27000'),
    'BIF': Decimal('20000'),
}

# ── Fallback rates (used only when live fetch fails AND no override exists) ────
_FALLBACK: dict[tuple[str, str], Decimal] = {
    ("TZS", "KRW"): Decimal("0.530"),
    ("KRW", "TZS"): Decimal("1.887"),
    ("TZS", "USD"): Decimal("0.000385"),
    ("USD", "TZS"): Decimal("2597.00"),
    ("KRW", "USD"): Decimal("0.00073"),
    ("USD", "KRW"): Decimal("1370.00"),
    # East African corridor
    ("TZS", "KES"): Decimal("0.050"),
    ("KES", "TZS"): Decimal("20.00"),
    ("TZS", "RWF"): Decimal("0.481"),
    ("RWF", "TZS"): Decimal("2.079"),
    ("TZS", "BIF"): Decimal("1.115"),
    ("BIF", "TZS"): Decimal("0.897"),
    ("TZS", "UGX"): Decimal("1.423"),
    ("UGX", "TZS"): Decimal("0.703"),
    # Cross pairs
    ("KES", "KRW"): Decimal("10.55"),
    ("KRW", "KES"): Decimal("0.0948"),
    ("KES", "USD"): Decimal("0.00769"),
    ("USD", "KES"): Decimal("130.00"),
}

# ── Live rate cache: pair -> (rate, fetched_at) ────────────────────────────────
_CACHE: dict[tuple[str, str], tuple[Decimal, datetime]] = {}
_CACHE_TTL = timedelta(hours=1)


def _fetch_live_rate(from_currency: str, to_currency: str) -> Decimal | None:
    """Fetch a single conversion rate from exchangerate.host. Returns None on failure."""
    try:
        # Lazy import to avoid circular at startup
        from app.core.config import settings
        api_key = settings.EXCHANGERATE_HOST_API_KEY
        if not api_key or api_key == "free":
            return None

        resp = httpx.get(
            "https://api.exchangerate.host/convert",
            params={
                "from": from_currency,
                "to": to_currency,
                "amount": 1,
                "access_key": api_key,
            },
            timeout=5.0,
        )
        data = resp.json()
        if data.get("success") and data.get("result"):
            rate = Decimal(str(data["result"]))
            logger.info("Live FX %s/%s = %s", from_currency, to_currency, rate)
            return rate
        logger.warning("exchangerate.host bad response for %s/%s: %s", from_currency, to_currency, data)
    except Exception as exc:
        logger.warning("Live FX fetch failed for %s/%s: %s", from_currency, to_currency, exc)
    return None


def get_rate(from_currency: str, to_currency: str) -> Decimal:
    """
    Rate resolution order:
    1. Admin override (SIM_FX)
    2. Live API cache (refreshed every hour)
    3. Fallback hardcoded table
    4. 1.0 (same-currency passthrough)
    """
    from_c = from_currency.upper()
    to_c = to_currency.upper()

    if from_c == to_c:
        return Decimal("1.0")

    pair = (from_c, to_c)

    # 1. Admin override
    if pair in SIM_FX:
        return SIM_FX[pair]

    # 2. Cache hit
    if pair in _CACHE:
        rate, fetched_at = _CACHE[pair]
        if datetime.utcnow() - fetched_at < _CACHE_TTL:
            return rate
        # Cache stale — fall through to re-fetch

    # 3. Live fetch
    live = _fetch_live_rate(from_c, to_c)
    if live is not None:
        _CACHE[pair] = (live, datetime.utcnow())
        return live

    # 4. Stale cache is better than nothing
    if pair in _CACHE:
        rate, fetched_at = _CACHE[pair]
        logger.warning("Using stale cached rate for %s/%s (age: %s)", from_c, to_c, datetime.utcnow() - fetched_at)
        return rate

    # 5. Hardcoded fallback
    if pair in _FALLBACK:
        logger.warning("Using hardcoded fallback rate for %s/%s", from_c, to_c)
        return _FALLBACK[pair]

    logger.error("No rate available for %s/%s, returning 1.0", from_c, to_c)
    return Decimal("1.0")


class PricingResult:
    def __init__(
        self,
        fx_rate: Decimal,
        fee_amount: Decimal,
        receive_amount: Decimal,
        total_cost: Decimal,
        expires_at: datetime,
    ):
        self.fx_rate = fx_rate
        self.fee_amount = fee_amount
        self.receive_amount = receive_amount
        self.total_cost = total_cost
        self.expires_at = expires_at


class PricingEngine:
    def __init__(self, quote_ttl_seconds: int = 60):
        self.quote_ttl_seconds = quote_ttl_seconds

    def _calculate_fee(
        self,
        send_currency: str,
        is_domestic: bool,
        is_linked_recipient: bool,
    ) -> Decimal:
        currency = send_currency.upper()
        if is_domestic and is_linked_recipient:
            return Decimal("0")
        if is_domestic:
            return DOMESTIC_FEE.get(currency, Decimal("500"))
        return INTERNATIONAL_FEE.get(currency, Decimal("3000"))

    def price(
        self,
        send_amount: Decimal,
        send_currency: str,
        receive_currency: str,
        send_country: str,
        receive_country: str,
        is_linked_recipient: bool = False,
    ) -> PricingResult:
        is_domestic = send_currency.upper() == receive_currency.upper()
        fx_rate = get_rate(send_currency, receive_currency)
        fee_amount = self._calculate_fee(send_currency, is_domestic, is_linked_recipient)

        net = (send_amount - fee_amount).max(Decimal("0"))
        receive_amount = (net * fx_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total_cost = send_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        now = datetime.utcnow()
        return PricingResult(
            fx_rate=fx_rate,
            fee_amount=fee_amount,
            receive_amount=receive_amount,
            total_cost=total_cost,
            expires_at=now + timedelta(seconds=self.quote_ttl_seconds),
        )
