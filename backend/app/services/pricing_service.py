def mock_fx_rate(send_currency: str, receive_currency: str) -> float:
    # Very simple mock mapping; adjust as you like.
    pair = (send_currency.upper(), receive_currency.upper())
    if pair == ("KRW", "TZS"):
        return 2.0  # 1 KRW -> 2 TZS (mock)
    if pair == ("TZS", "KRW"):
        return 0.5  # 1 TZS -> 0.5 KRW (mock)
    if send_currency.upper() == receive_currency.upper():
        return 1.0
    return 1.2  # default mock

def mock_fee(send_amount: float) -> float:
    # base + percent, with a minimum
    base = 2.0
    percent = 0.015 * send_amount
    fee = base + percent
    return max(fee, 2.0)

def quote(send_amount: float, fx_rate: float, fee_amount: float) -> tuple[float, float]:
    # receive = (send - fee) * fx
    net = max(send_amount - fee_amount, 0.0)
    receive_amount = net * fx_rate
    total_cost = send_amount  # user pays send_amount in MVP
    return receive_amount, total_cost
