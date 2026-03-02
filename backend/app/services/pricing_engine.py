from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP

# Simple in-memory FX table for now; later you can swap this for DB / provider
SIM_FX = {
    ("TZS", "KRW"): Decimal("0.055"),
    ("KRW", "TZS"): Decimal("18.18"),
}

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

    def _get_fx_rate(self, send_currency: str, receive_currency: str) -> Decimal:
        pair = (send_currency.upper(), receive_currency.upper())
        if pair[0] == pair[1]:
            return Decimal("1.0")
        return SIM_FX.get(pair, Decimal("1.0"))

    def _calculate_fee(self, send_amount: Decimal, send_currency: str) -> Decimal:
        percent_fee = (send_amount * Decimal("0.018")).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        fixed_fee = Decimal("1500.00") if send_currency.upper() == "TZS" else Decimal("1000.00")
        return (percent_fee + fixed_fee).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def price(
        self,
        send_amount: Decimal,
        send_currency: str,
        receive_currency: str,
        send_country: str,
        receive_country: str,
    ) -> PricingResult:
        fx_rate = self._get_fx_rate(send_currency, receive_currency)
        fee_amount = self._calculate_fee(send_amount, send_currency)

        net = (send_amount - fee_amount).max(Decimal("0"))
        receive_amount = (net * fx_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total_cost = send_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        now = datetime.utcnow()
        expires_at = now + timedelta(seconds=self.quote_ttl_seconds)

        return PricingResult(
            fx_rate=fx_rate,
            fee_amount=fee_amount,
            receive_amount=receive_amount,
            total_cost=total_cost,
            expires_at=expires_at,
        )