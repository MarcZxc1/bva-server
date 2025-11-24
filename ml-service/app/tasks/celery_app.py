# File: app/tasks/celery_app.py
"""
Purpose: Celery application configuration.
Configures task queue, broker, and result backend.

Usage:
    # Start worker:
    celery -A app.tasks.celery_app worker --loglevel=info
    
    # Start beat (scheduler):
    celery -A app.tasks.celery_app beat --loglevel=info
"""

from celery import Celery
from celery.schedules import crontab
from app.config import settings

# Create Celery app
celery_app = Celery(
    "smartshelf",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=['app.tasks.scheduled_tasks']
)

# Configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone=settings.CELERY_TIMEZONE,
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour max
    task_soft_time_limit=3000,  # 50 minutes soft limit
    worker_prefetch_multiplier=1,  # One task at a time for heavy ML tasks
    worker_max_tasks_per_child=50,  # Restart worker after 50 tasks (prevent memory leaks)
)

# Scheduled tasks (beat schedule)
celery_app.conf.beat_schedule = {
    'nightly-model-retraining': {
        'task': 'app.tasks.scheduled_tasks.retrain_models',
        'schedule': crontab(hour=2, minute=0),  # 2 AM daily
    },
    'daily-forecast-batch': {
        'task': 'app.tasks.scheduled_tasks.daily_forecast_batch',
        'schedule': crontab(hour=3, minute=0),  # 3 AM daily
    },
    'cleanup-old-models': {
        'task': 'app.tasks.scheduled_tasks.cleanup_old_models',
        'schedule': crontab(hour=4, minute=0, day_of_week=0),  # Sunday 4 AM
    },
}
