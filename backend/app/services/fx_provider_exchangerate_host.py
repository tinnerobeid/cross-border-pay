from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, Optional, Tuple

import httpx

UTC = timezone.utc


def to_decimal(x: Any, field: str) -> Decimal:
    try:
        return Decimal(str(x))
    except (InvalidOperation, ValueError, TypeError):
        raise ValueError(f"Invalid decimal for {field}: {x!r}")


@dataclass(frozen=True)
class LiveRate:
    base: str
    quote: str
    rate: Decimal
    provider: str
    fetched_at: datetime
    raw: Dict[str, Any]


class ExchangeRateHostProvider:
    """
    Live FX rate provider for https://api.exchangerate.host/latest

    API key placement varies by plan. To be robust, we send:
      - header: apikey
      - query: access_key and apikey
    """
    name = "exchangerate.host"

    def __init__(
        self,
        api_key: str,
        timeout_seconds: float = 6.0,
        cache_ttl_seconds: int = 30,
    ) -> None:
        self.api_key = api_key
        self.timeout_seconds = timeout_seconds
        self.cache_ttl = timedelta(seconds=cache_ttl_seconds)
        self._cache: Dict[Tuple[str, str], LiveRate] = {}

    async def get_rate(self, base: str, quote: str) -> LiveRate:
        base = base.upper().strip()
        quote = quote.upper().strip()

        now = datetime.now(tz=UTC)
        key = (base, quote)

        cached = self._cache.get(key)
        if cached and (now - cached.fetched_at) <= self.cache_ttl:
            return cached

        url = "https://api.exchangerate.host/latest"
        params = {"base": base, "symbols": quote, "access_key": self.api_key, "apikey": self.api_key}
        headers = {"apikey": self.api_key}

        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            resp = await client.get(url, params=params, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        if isinstance(data, dict) and data.get("success") is False:
            raise RuntimeError(f"FX provider error: {data}")

        rates = data.get("rates") if isinstance(data, dict) else None
        if not isinstance(rates, dict) or quote not in rates:
            raise RuntimeError(f"Unexpected FX response: {data}")

        rate = to_decimal(rates[quote], "rate")

        live = LiveRate(
            base=base,
            quote=quote,
            rate=rate,
            provider=self.name,
            fetched_at=now,
            raw=data,
        )
        self._cache[key] = live
        return live
