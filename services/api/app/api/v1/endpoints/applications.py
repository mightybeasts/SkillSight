from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.core.security import get_current_user
from app.models.application import Application, ApplicationStatus
from app.models.job import JobListing
from app.models.match import MatchResult
from app.models.resume import Resume
from app.models.user import User
from app.models.notification import Notification
from app.schemas.application import ApplicationWithJobResponse, ApplicationCreate, ApplicationResponse
from app.tasks.matching_tasks import compute_match
import uuid

router = APIRouter()


@router.post('/', response_model=ApplicationResponse, status_code=201)
async def create_application(
    body: ApplicationCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Apply for a job listing. Automatically triggers AI match analysis."""
    user_id = uuid.UUID(current_user['id'])

    # Check if already applied
    existing = await db.execute(
        select(Application).where(
            Application.applicant_id == user_id,
            Application.job_id == body.job_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail='You have already applied for this job.')

    # Check job exists
    job_result = await db.execute(select(JobListing).where(JobListing.id == body.job_id))
    job = job_result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail='Job not found')

    # If no resume_id provided, try to find user's most recent completed resume
    resume_id = body.resume_id
    if not resume_id:
        resume_row = await db.execute(
            select(Resume)
            .where(Resume.owner_id == user_id, Resume.processing_status == 'completed')
            .order_by(Resume.is_master.desc())
            .limit(1)
        )
        resume = resume_row.scalar_one_or_none()
        if resume:
            resume_id = resume.id

    # Find match result if exists (to link to application)
    match_result_id = None
    if resume_id:
        match_row = await db.execute(
            select(MatchResult).where(
                MatchResult.resume_id == resume_id,
                MatchResult.job_id == body.job_id,
            )
        )
        match = match_row.scalar_one_or_none()
        if match:
            match_result_id = match.id

    application = Application(
        applicant_id=user_id,
        job_id=body.job_id,
        resume_id=resume_id,
        match_result_id=match_result_id,
        cover_letter=body.cover_letter,
    )
    db.add(application)
    await db.flush()
    await db.refresh(application)

    # Auto-trigger match analysis if resume exists but no match computed yet
    if resume_id and not match_result_id:
        try:
            compute_match.delay(str(resume_id), str(body.job_id))
        except Exception:
            pass  # Non-critical - match can be computed later

    # Notify recruiter of new application
    applicant_row = await db.execute(select(User.full_name, User.email).where(User.id == user_id))
    applicant = applicant_row.one_or_none()
    candidate_name = (applicant[0] if applicant and applicant[0] else (applicant[1] if applicant else 'A candidate'))
    db.add(Notification(
        recipient_id=job.recruiter_id,
        type='application_received',
        title='New application',
        body=f'{candidate_name} applied to {job.title}',
        link_url=f'/recruiter/jobs/{job.id}/candidates',
        meta={
            'application_id': str(application.id),
            'job_id': str(job.id),
            'job_title': job.title,
            'applicant_id': str(user_id),
            'candidate_name': candidate_name,
        },
    ))
    await db.flush()

    return application


@router.get('/me', response_model=list[ApplicationWithJobResponse])
async def get_my_applications(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = uuid.UUID(current_user['id'])
    
    # Query applications joined with JobListing and MatchResult
    stmt = (
        select(Application, JobListing.title, JobListing.company, JobListing.location, MatchResult.overall_score)
        .join(JobListing, Application.job_id == JobListing.id)
        .outerjoin(MatchResult, Application.match_result_id == MatchResult.id)
        .where(Application.applicant_id == user_id)
        .order_by(Application.created_at.desc())
    )
    
    result = await db.execute(stmt)
    rows = result.all()
    
    response = []
    for app, title, company, location, score in rows:
        app_dict = {
            "id": app.id,
            "applicant_id": app.applicant_id,
            "job_id": app.job_id,
            "resume_id": app.resume_id,
            "match_result_id": app.match_result_id,
            "status": app.status.value,
            "cover_letter": app.cover_letter,
            "created_at": app.created_at,
            "updated_at": app.updated_at,
            "job_title": title,
            "company": company,
            "location": location,
            "match_score": score,
        }
        response.append(ApplicationWithJobResponse(**app_dict))
    
    return response


@router.get('/job/{job_id}/status')
async def get_application_status_for_job(
    job_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Check if the current user has applied for a specific job and get status."""
    user_id = uuid.UUID(current_user['id'])
    result = await db.execute(
        select(Application).where(
            Application.applicant_id == user_id,
            Application.job_id == job_id,
        )
    )
    application = result.scalar_one_or_none()
    if not application:
        return {'applied': False, 'status': None, 'rejection_reason': None}

    return {
        'applied': True,
        'status': application.status.value,
        'rejection_reason': application.rejection_reason,
        'application_id': str(application.id),
    }


@router.patch('/{application_id}/withdraw')
async def withdraw_application(
    application_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Withdraw/mark as not interested in a job application."""
    user_id = uuid.UUID(current_user['id'])
    result = await db.execute(
        select(Application).where(
            Application.id == application_id,
            Application.applicant_id == user_id,
        )
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail='Application not found')

    if application.status == ApplicationStatus.withdrawn:
        raise HTTPException(status_code=400, detail='Already withdrawn')

    application.status = ApplicationStatus.withdrawn
    await db.flush()

    return {'message': 'Application withdrawn', 'status': 'withdrawn'}
