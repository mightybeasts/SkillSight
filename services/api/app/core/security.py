from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.core.config import settings
from app.db.supabase import get_supabase_client
import httpx

bearer_scheme = HTTPBearer(auto_error=False)

# Demo user mapping (matches seed data)
DEMO_USERS = {
    'a1000000-0000-0000-0000-000000000001': {'id': 'a1000000-0000-0000-0000-000000000001', 'email': 'aisha.khan@example.com', 'role': 'job_seeker'},
    'a1000000-0000-0000-0000-000000000002': {'id': 'a1000000-0000-0000-0000-000000000002', 'email': 'james.chen@example.com', 'role': 'job_seeker'},
    'a1000000-0000-0000-0000-000000000003': {'id': 'a1000000-0000-0000-0000-000000000003', 'email': 'maria.garcia@example.com', 'role': 'job_seeker'},
    'b2000000-0000-0000-0000-000000000001': {'id': 'b2000000-0000-0000-0000-000000000001', 'email': 'sarah.johnson@techcorp.com', 'role': 'recruiter'},
    'b2000000-0000-0000-0000-000000000002': {'id': 'b2000000-0000-0000-0000-000000000002', 'email': 'david.kim@innovate.io', 'role': 'recruiter'},
    'c3000000-0000-0000-0000-000000000001': {'id': 'c3000000-0000-0000-0000-000000000001', 'email': 'placement@stanford.edu', 'role': 'admin'},
}


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    """Validate auth: demo header or Supabase JWT."""
    # Check for demo mode header (only in development)
    demo_user_id = request.headers.get('X-Demo-User-Id')
    if demo_user_id and settings.is_development:
        demo_user = DEMO_USERS.get(demo_user_id)
        if demo_user:
            return demo_user
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid demo user ID',
        )

    # Real auth via Supabase JWT
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
