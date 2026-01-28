def choose_provider(send_country: str, receive_country: str) -> str:
    # mock rules
    corridor = (send_country.lower(), receive_country.lower())
    if corridor == ("tanzania", "south korea") or corridor == ("south korea", "tanzania"):
        return "internal"
    return "partner_mock"
