from fastapi import HTTPException

ALLOWED_STATUSES = {
    "initiated",         # CREATED
    "payment_pending",   # optional: user still needs to pay
    "processing",        # we are sending to provider
    "sent",              # provider accepted, delivering
    "received",          # COMPLETED
    "failed",
    "cancelled",
}

ALLOWED_TRANSITIONS = {
    "initiated": {"payment_pending", "processing", "failed", "cancelled"},
    "payment_pending": {"processing", "failed", "cancelled"},
    "processing": {"sent", "failed"},
    "sent": {"received", "failed"},
    "received": set(),
    "failed": set(),
    "cancelled": set(),
}


def validate_transition(current: str, new: str) -> None:
    if new not in ALLOWED_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status: {new}")
    allowed = ALLOWED_TRANSITIONS.get(current, set())
    if new not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition: {current} -> {new}. Allowed: {sorted(list(allowed))}",
        )