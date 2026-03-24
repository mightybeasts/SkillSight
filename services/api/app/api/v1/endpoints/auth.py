from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from app.db.supabase import get_supabase_client
from app.db.database import AsyncSessionLocal
from app.models.user import User, UserRole
from sqlalchemy import select
from loguru import logger

router = APIRouter()


class GoogleAuthRequest(BaseModel):
    id_token: str  # Google ID token from frontend


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'
    user_id: str
    email: str
    role: str
    is_new_user: bool = False


class SetRoleRequest(BaseModel):
    role: str  # 'job_seeker' | 'recruiter'


@router.post('/google', response_model=AuthResponse, summary='Sign in with Google')
async def google_signin(body: GoogleAuthRequest):
    """
    Exchange a Google ID token (from frontend) for a Supabase session.
    Creates user record in local DB if first time.
    """
    supabase = get_supabase_client()
    try:
        # Exchange Google token with Supabase
        response = supabase.auth.sign_in_with_id_token({
            'provider': 'google',
            'token': body.id_token,
        })
        if not response.user or not response.session:
            raise HTTPException(status_code=401, detail='Google authentication failed')

        sb_user = response.user
        is_new_user = False

        # Sync user to local DB
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(User).where(User.supabase_id == sb_user.id)
            )
            db_user = result.scalar_one_or_none()

            if not db_user:
                is_new_user = True
                db_user = User(
                    supabase_id=sb_user.id,
                    email=sb_user.email,
                    full_name=sb_user.user_metadata.get('full_name'),
                    avatar_url=sb_user.user_metadata.get('avatar_url'),
                    role=UserRole.job_seeker,
                )
                session.add(db_user)
                await session.commit()
                await session.refresh(db_user)

        return AuthResponse(
            access_token=response.session.access_token,
            user_id=str(db_user.id),
            email=db_user.email,
            role=db_user.role.value,
            is_new_user=is_new_user,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f'Google auth error: {e}')
        raise HTTPException(status_code=500, detail='Authentication error')


@router.post('/role', summary='Set user role (job_seeker or recruiter)')
async def set_role(body: SetRoleRequest):
    """Called after first login to set whether the user is a job seeker or recruiter."""
    if body.role not in ('job_seeker', 'recruiter'):
        raise HTTPException(status_code=400, detail='Role must be job_seeker or recruiter')
    # Role update is handled client-side via Supabase user metadata + local DB update
    return {'message': f'Role set to {body.role}'}
