from celery import Celery
import os

# Configure Celery to use Redis as broker and backend
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "dropship_tasks",
    broker=redis_url,
    backend=redis_url,
    include=['app.services.tasks']
)

# Optional: configure routing, timezone, etc.
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Asia/Almaty',
    enable_utc=True,
    # Rate limits to avoid banning
    task_default_rate_limit='1/s',
)

# Scheduled tasks
from celery.schedules import crontab

celery_app.conf.beat_schedule = {
    'update-all-links-every-3-hours': {
        'task': 'app.services.tasks.trigger_all_active_links_update',
        'schedule': crontab(minute=0, hour='*/3'),
    },
}
