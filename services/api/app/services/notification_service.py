from sqlalchemy.ext.asyncio import AsyncSession
from app.models.notification import Notification
import uuid


async def notify(
    db: AsyncSession,
    *,
    recipient_id: uuid.UUID,
    type: str,
    title: str,
    body: str | None = None,
    link_url: str | None = None,
    meta: dict | None = None,
) -> Notification:
    """Create and queue a notification. Caller is responsible for db.flush/commit."""
    notif = Notification(
        recipient_id=recipient_id,
        type=type,
        title=title,
        body=body,
        link_url=link_url,
        meta=meta,
    )
    db.add(notif)
    return notif
