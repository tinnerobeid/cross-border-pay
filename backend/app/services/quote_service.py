from decimal import Decimal, ROUND_HALF_UP

# Simulated FX for MVP: TZS -> KRW
SIM_FX = {
    ("TZS", "KRW"): Decimal("0.055"),  # example
    ("KRW", "TZS"): Decimal("18.18"),
}

def calculate_quote(send_amount: Decimal, send_currency: str, receive_currency: str):
    # fee: 1.8% + small fixed fee (MVP simulation)
    percent_fee = (send_amount * Decimal("0.018")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    fixed_fee = Decimal("1500.00") if send_currency == "TZS" else Decimal("1000.00")
    fee_amount = (percent_fee + fixed_fee).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    fx_rate = SIM_FX.get((send_currency, receive_currency), Decimal("1.0"))
    return fx_rate, fee_amount
