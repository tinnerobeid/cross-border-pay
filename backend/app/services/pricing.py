from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

from app.services.fx_provider_exchangerate_host import ExchangeRateHostProvider

UTC = timezone.utc

CURRENCY_DECIMALS = {"KRW": 0, "TZS": 0}


def q_money(amount: Decimal, currency: str) -> Decimal:
    currency = currency.upper()
    places = CURRENCY_DECIMALS.get(currency, 2)
    q = Decimal("1") if places == 0 else Decimal("1").scaleb(-places)
    return amount.quantize(q, rounding=ROUND_HALF_UP)


@dataclass(frozen=True)
class QuoteResult:
    send_amount: Decimal
    send_currency: str
    receive_currency: str
    rate_used: Decimal
    receive_amount: Decimal
    fee_used: Decimal
    total_payable: Decimal
    priced_at: datetime
    expires_at: datetime
    provider: str


class PricingService:
    """
    Fee-on-top model:
      receive_amount = send_amount * rate
      total_payable  = send_amount + fee
    """

    def __init__(
        self,
        fx_provider: ExchangeRateHostProvider,
        quote_ttl_seconds: int = 120,
        fixed_fee: Decimal = Decimal("0"),
        percent_fee: Decimal = Decimal("0.0"),
        min_fee: Decimal = Decimal("0"),
        max_fee: Optional[Decimal] = None,
    ) -> None:
        self.fx_provider = fx_provider
        self.quote_ttl = timedelta(seconds=quote_ttl_seconds)

        self.fixed_fee = fixed_fee
        self.percent_fee = percent_fee
        self.min_fee = min_fee
        self.max_fee = max_fee

    def compute_fee(self, send_amount: Decimal, send_currency: str) -> Decimal:
        fee = self.fixed_fee + (send_amount * self.percent_fee)
        if fee < self.min_fee:
            fee = self.min_fee
        if self.max_fee is not None and fee > self.max_fee:
            fee = self.max_fee
        return q_money(fee, send_currency)

    async def quote(self, send_amount: Decimal, send_currency: str, receive_currency: str) -> QuoteResult:
        send_currency = send_currency.upper()
        receive_currency = receive_currency.upper()

        if send_amount <= 0:
            raise ValueError("send_amount must be > 0")

        send_amount_q = q_money(send_amount, send_currency)

        live = await self.fx_provider.get_rate(send_currency, receive_currency)
        rate = live.rate

        fee = self.compute_fee(send_amount_q, send_currency)
        receive_amount = q_money(send_amount_q * rate, receive_currency)
        total_payable = q_money(send_amount_q + fee, send_currency)

        priced_at = live.fetched_at
        expires_at = priced_at + self.quote_ttl

        return QuoteResult(
            send_amount=send_amount_q,
            send_currency=send_currency,
            receive_currency=receive_currency,
            rate_used=rate,
            receive_amount=receive_amount,
            fee_used=fee,
            total_payable=total_payable,
            priced_at=priced_at,
            expires_at=expires_at,
            provider=live.provider,
        )
