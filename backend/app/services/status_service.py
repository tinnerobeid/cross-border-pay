ALLOWED_STATUSES = {"initiated", "processing", "sent", "received", "failed"}

ALLOWED_TRANSITIONS = {
    "initiated": {"processing", "failed"},
    "processing": {"sent", "failed"},
    "sent": {"received", "failed"},
    "received": set(),
    "failed": set(),
}

def validate_transition(current: str, new: str):
    if new not in ALLOWED_STATUSES:
        return False, f"Invalid status '{new}'. Allowed: {sorted(ALLOWED_STATUSES)}"
    if new not in ALLOWED_TRANSITIONS.get(current, set()):
        return False, f"Invalid transition '{current}' -> '{new}'."
    return True, ""
