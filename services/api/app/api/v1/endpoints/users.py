from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.core.security import get_current_user
from app.db.database import get_db
from app.models.user import User, UserProfile, UserRole
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

router = APIRouter()


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    headline: str | None = None
    bio: str | None = None
    location: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    company_name: str | None = None
    industry: str | None = None


class UserResponse(BaseModel):
    model_config = {'from_attributes': True}
    id: uuid.UUID
    email: str
    full_name: str | None
    avatar_url: str | None
    role: UserRole


@router.get('/me', response_model=UserResponse)
async def get_me(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.supabase_id == current_user['id'])
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    return user


@router.patch('/me/profile')
async def update_profile(
    body: ProfileUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.supabase_id == current_user['id'])
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    if body.full_name:
        user.full_name = body.full_name

    # Upsert profile
    profile_result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user.id)
    )
    profile = profile_result.scalar_one_or_none()
    if not profile:
        profile = UserProfile(user_id=user.id)
        db.add(profile)

    for field, value in body.model_dump(exclude_none=True, exclude={'full_name'}).items():
        setattr(profile, field, value)

    return {'message': 'Profile updated'}


@router.patch('/me/role')
async def set_role(
    role: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Set user role — called once after first login."""
    if role not in ('job_seeker', 'recruiter'):
        raise HTTPException(status_code=400, detail='Invalid role')

    result = await db.execute(
        select(User).where(User.supabase_id == current_user['id'])
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    user.role = UserRole(role)
    return {'message': f'Role updated to {role}'}
