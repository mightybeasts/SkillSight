from celery import Celery
from app.core.config import settings

celery_app = Celery(
    'skillsight',
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=['app.tasks.resume_tasks', 'app.tasks.matching_tasks'],
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    result_expires=3600,  # Results expire after 1 hour
    broker_connection_retry_on_startup=True,
)
