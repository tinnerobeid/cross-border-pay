from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
import logging

import httpx

logger = logging.getLogger(__name__)

# ── Admin-managed overrides (highest priority, managed via /admin/rates) ───────
SIM_FX: dict[tuple[str, str], Decimal] = {}

# ── Fee tables ─────────────────────────────────────────────────────────────────
# International transfer flat fee per send currency (~3 000 KRW equivalent)
INTERNATIONAL_FEE: dict[str, Decimal] = {
    'KRW': Decimal('3000'),
    'TZS': Decimal('5500'),
    'USD': Decimal('3'),
    'KES': Decimal('390'),
    'RWF': Decimal('2500'),
    'UGX': Decimal('8000'),
    'BIF': Decimal('6000'),
}

# Exchange/conversion fee added on top of transfer fee for international sends (~1 800 KRW)
EXCHANGE_FEE: dict[str, Decimal] = {
    'KRW': Decimal('1800'),
    'TZS': Decimal('3400'),
    'USD': Decimal('1.50'),
    'KES': Decimal('235'),
    'RWF': Decimal('1500'),
    'UGX': Decimal('4800'),
    'BIF': Decimal('3600'),
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

# ── Live rate cache ────────────────────────────────────────────────────────────
# Stores USD-based rates fetched in one bulk call: { "TZS": Decimal, "KRW": Decimal, ... }
_USD_RATES: dict[str, Decimal] = {}
_USD_RATES_FETCHED_AT: datetime | None = None
_CACHE_TTL = timedelta(hours=6)

# If the bulk fetch fails, back off for this long before retrying
_BACKOFF_TTL = timedelta(hours=1)
_LAST_FETCH_FAILED_AT: datetime | None = None

# Free bulk FX API — no API key, CDN-backed, updated daily, covers all currencies
# Docs: https://github.com/fawazahmed0/exchange-api
_BULK_FX_URL = (
    "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json"
)
_BULK_FX_FALLBACK_URL = (
    "https://latest.currency-api.pages.dev/v1/currencies/usd.json"
)

# Currencies we care about (lowercase for the API response keys)
_OUR_CURRENCIES = {"tzs", "krw", "kes", "rwf", "ugx", "bif", "usd"}


def _fetch_bulk_usd_rates() -> dict[str, Decimal] | None:
    """
    Fetch all rates against USD in a single HTTP call.
    Returns { "TZS": Decimal("2597"), "KRW": Decimal("1370"), ... } or None on failure.
    Uses a CDN-backed free API with no key required.
    """
    for url in (_BULK_FX_URL, _BULK_FX_FALLBACK_URL):
        try:
            resp = httpx.get(url, timeout=8.0)
            if resp.status_code != 200:
                logger.warning("Bulk FX API returned %s from %s", resp.status_code, url)
                continue
            data = resp.json()
            usd_map: dict = data.get("usd", {})
            if not usd_map:
                logger.warning("Bulk FX API: empty usd map from %s", url)
                continue
            result = {
                code.upper(): Decimal(str(rate))
                for code, rate in usd_map.items()
                if code.lower() in _OUR_CURRENCIES and rate
            }
            logger.info("Bulk FX: fetched %d rates from %s", len(result), url)
            return result
        except Exception as exc:
            logger.warning("Bulk FX fetch failed from %s: %s", url, exc)
    return None


def _ensure_rates_loaded() -> bool:
    """
    Load (or refresh) the USD rate table if stale.
    Returns True if live rates are available, False if using fallback.
    """
    global _USD_RATES, _USD_RATES_FETCHED_AT, _LAST_FETCH_FAILED_AT

    now = datetime.utcnow()

    # Still within cache TTL — no fetch needed
    if _USD_RATES_FETCHED_AT and (now - _USD_RATES_FETCHED_AT) < _CACHE_TTL:
        return bool(_USD_RATES)

    # Within backoff window after a failed fetch — don't hammer the API
    if _LAST_FETCH_FAILED_AT and (now - _LAST_FETCH_FAILED_AT) < _BACKOFF_TTL:
        return bool(_USD_RATES)

    rates = _fetch_bulk_usd_rates()
    if rates:
        _USD_RATES = rates
        _USD_RATES_FETCHED_AT = now
        _LAST_FETCH_FAILED_AT = None
        return True
    else:
        _LAST_FETCH_FAILED_AT = now
        return bool(_USD_RATES)  # True if we have stale data to fall back on


def _live_cross_rate(from_c: str, to_c: str) -> Decimal | None:
    """
    Derive FROM/TO rate by cross-calculating through USD.
    1 FROM = (usd_to_to / usd_to_from) TO
    """
    if not _ensure_rates_loaded():
        return None
    usd_to_from = _USD_RATES.get(from_c)
    usd_to_to = _USD_RATES.get(to_c)
    if not usd_to_from or not usd_to_to or usd_to_from == 0:
        return None
    return (usd_to_to / usd_to_from).quantize(Decimal("0.0000001"))


def get_rate(from_currency: str, to_currency: str) -> Decimal:
    """
    Rate resolution order:
    1. Admin override (SIM_FX)
    2. Live bulk-fetched rates (one HTTP call caches all pairs, refreshed every 6 h)
    3. Hardcoded fallback table
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

    # 2. Live cross-rate (bulk fetch, single HTTP call per refresh cycle)
    live = _live_cross_rate(from_c, to_c)
    if live is not None:
        return live

    # 3. Hardcoded fallback
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
        # International: transfer fee + exchange/conversion fee
        transfer_fee = INTERNATIONAL_FEE.get(currency, Decimal("3000"))
        exchange_fee = EXCHANGE_FEE.get(currency, Decimal("1800"))
        return transfer_fee + exchange_fee

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

        # Recipient gets the full send_amount converted; fee is charged on top
        receive_amount = (send_amount * fx_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total_cost = (send_amount + fee_amount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        now = datetime.utcnow()
        return PricingResult(
            fx_rate=fx_rate,
            fee_amount=fee_amount,
            receive_amount=receive_amount,
            total_cost=total_cost,
            expires_at=now + timedelta(seconds=self.quote_ttl_seconds),
        )
