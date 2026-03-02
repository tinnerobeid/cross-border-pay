from celery import Celery
from app.core.config import settings

# Broker & backend (adjust if needed)
CELERY_BROKER_URL = "redis://localhost:6379/0"
CELERY_RESULT_BACKEND = "redis://localhost:6379/0"

# Celery application instance that the CLI will look for
celery = Celery(
    "zuripay",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
)

# Autodiscover tasks in app.tasks.*
celery.autodiscover_tasks(["app.tasks"])

# Optional alias, if other code imports celery_app
celery_app = celery