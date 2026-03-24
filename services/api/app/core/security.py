from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.core.config import settings
from app.db.supabase import get_supabase_client
import httpx

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """Validate Supabase JWT and return user payload."""
    token = credentials.credentials
    try:
        # Verify token with Supabase
        supabase = get_supabase_client()
        response = supabase.auth.get_user(token)
        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Invalid or expired token',
            )
        return {
            'id': response.user.id,
            'email': response.user.email,
            'role': response.user.user_metadata.get('role', 'job_seeker'),
        }
    except Exception:
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
