from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings
from app.db.supabase import get_supabase_client
from app.db.database import get_db
from app.models.user import User, UserRole
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Validate Supabase JWT, auto-create local user if needed, return local user info."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Missing authentication credentials',
        )
    token = credentials.credentials
    try:
        supabase = get_supabase_client()
        response = supabase.auth.get_user(token)
        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Invalid or expired token',
            )

        supabase_user = response.user
        supabase_id = supabase_user.id
        email = supabase_user.email
        role_str = supabase_user.user_metadata.get('role', 'job_seeker')
        full_name = (
            supabase_user.user_metadata.get('full_name')
            or supabase_user.user_metadata.get('name')
            or email.split('@')[0]
        )
        avatar_url = (
            supabase_user.user_metadata.get('avatar_url')
            or supabase_user.user_metadata.get('picture')
        )

        # Look up local user by supabase_id
        result = await db.execute(
            select(User).where(User.supabase_id == supabase_id)
        )
        local_user = result.scalar_one_or_none()

        if not local_user:
            # Auto-create local user on first login
            role = UserRole.recruiter if role_str == 'recruiter' else UserRole.job_seeker
            local_user = User(
                supabase_id=supabase_id,
                email=email,
                full_name=full_name,
                avatar_url=avatar_url,
                role=role,
            )
            db.add(local_user)
            await db.flush()
            await db.refresh(local_user)

        return {
            'id': str(local_user.id),
            'email': local_user.email,
            'role': local_user.role.value,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Could not validate credentials',
        )


def require_role(role: str):
    async def _check(user: dict = Depends(get_current_user)):
        if user.get('role') != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f'Requires {role} role',
            )
        return user
    return _check


require_recruiter = require_role('recruiter')
require_job_seeker = require_role('job_seeker')
