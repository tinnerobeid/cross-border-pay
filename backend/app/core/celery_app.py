import os

from celery import Celery
from app.core.config import settings

# Broker & backend — reads REDIS_URL env var so Docker service name resolves correctly
CELERY_BROKER_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.getenv("REDIS_URL", "redis://localhost:6379/0")

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