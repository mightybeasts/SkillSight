from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from pydantic import BaseModel
from datetime import datetime
from typing import Any
import uuid

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.notification import Notification

router = APIRouter()


class NotificationOut(BaseModel):
    id: uuid.UUID
    type: str
    title: str
    body: str | None
    link_url: str | None
    meta: dict[str, Any] | None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


@router.get('/', response_model=list[NotificationOut])
async def list_notifications(
    limit: int = 20,
    unread_only: bool = False,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = uuid.UUID(current_user['id'])
    stmt = select(Notification).where(Notification.recipient_id == user_id)
    if unread_only:
        stmt = stmt.where(Notification.is_read == False)  # noqa: E712
    stmt = stmt.order_by(Notification.created_at.desc()).limit(limit)
    rows = (await db.execute(stmt)).scalars().all()
    return rows


@router.get('/unread-count')
async def unread_count(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = uuid.UUID(current_user['id'])
    result = await db.execute(
        select(func.count(Notification.id)).where(
            Notification.recipient_id == user_id,
            Notification.is_read == False,  # noqa: E712
        )
    )
    return {'count': int(result.scalar() or 0)}


@router.post('/{notification_id}/read')
async def mark_read(
    notification_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = uuid.UUID(current_user['id'])
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.recipient_id == user_id,
        )
    )
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail='Notification not found')
    notif.is_read = True
    await db.flush()
    return {'ok': True}


@router.post('/read-all')
async def mark_all_read(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = uuid.UUID(current_user['id'])
    await db.execute(
        update(Notification)
        .where(Notification.recipient_id == user_id, Notification.is_read == False)  # noqa: E712
        .values(is_read=True)
    )
    return {'ok': True}
