from fastapi import HTTPException

ALLOWED_STATUSES = {
    "CREATED",
    "initiated",
    "payment_pending",
    "processing",
    "sent",
    "received",
    "failed",
    "cancelled",
    "CANCELLED",
}

ALLOWED_TRANSITIONS = {
    "CREATED": {"initiated", "payment_pending", "processing", "failed", "CANCELLED", "cancelled"},
    "initiated": {"payment_pending", "processing", "failed", "cancelled", "CANCELLED"},
    "payment_pending": {"processing", "failed", "cancelled", "CANCELLED"},
    "processing": {"sent", "failed"},
    "sent": {"received", "failed"},
    "received": set(),
    "failed": set(),
    "cancelled": set(),
    "CANCELLED": set(),
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