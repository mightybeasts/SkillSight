from fastapi import APIRouter, HTTPException, Depends, Query
from app.core.security import get_current_user
from app.db.database import get_db
from app.models.job import JobListing
from app.models.match import MatchResult
from app.models.application import Application, ApplicationStatus
from app.models.resume import Resume
from app.models.user import User, UserProfile
from app.schemas.job import JobListingResponse
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
import uuid

router = APIRouter()


class ShortlistUpdate(BaseModel):
    is_shortlisted: bool


class RejectRequest(BaseModel):
    rejection_reason: str


class ApplicationStatusUpdateRequest(BaseModel):
    status: str
    rejection_reason: str | None = None
    recruiter_notes: str | None = None


@router.get('/jobs', summary='Get all jobs posted by this recruiter', response_model=list[JobListingResponse])
async def get_my_jobs(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user['role'] != 'recruiter':
        raise HTTPException(status_code=403, detail='Recruiter only')

    result = await db.execute(
        select(JobListing).where(
            JobListing.recruiter_id == uuid.UUID(current_user['id'])
        )
    )
    return result.scalars().all()


@router.get('/jobs/{job_id}/candidates', summary='Get ranked candidates for a job')
async def get_ranked_candidates(
    job_id: uuid.UUID,
    min_score: float = Query(default=0.0, ge=0.0, le=1.0),
    shortlisted_only: bool = Query(default=False),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns all candidates who applied for this job, ranked by match score.
    Recruiter dashboard core endpoint.
    """
    if current_user['role'] != 'recruiter':
        raise HTTPException(status_code=403, detail='Recruiter only')

    # Verify job belongs to recruiter
    job_result = await db.execute(
        select(JobListing).where(
            JobListing.id == job_id,
            JobListing.recruiter_id == uuid.UUID(current_user['id']),
        )
    )
    if not job_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail='Job not found')

    query = (
        select(MatchResult)
        .where(
            MatchResult.job_id == job_id,
            MatchResult.overall_score >= min_score,
        )
        .options(selectinload(MatchResult.resume))
        .order_by(MatchResult.overall_score.desc())
    )

    if shortlisted_only:
        query = query.where(MatchResult.is_shortlisted == True)

    result = await db.execute(query)
    matches = result.scalars().all()

    return [
        {
            'match_id': str(m.id),
            'resume_id': str(m.resume_id),
            'candidate_name': (m.resume.parsed_data or {}).get('name', 'Unknown'),
            'candidate_email': (m.resume.parsed_data or {}).get('email'),
            'overall_score': m.overall_score,
            'skill_score': m.skill_score,
            'semantic_score': m.semantic_score,
            'matched_skills': m.matched_skills,
            'missing_skills': m.missing_skills,
            'is_shortlisted': m.is_shortlisted,
            'explanation': m.explanation,
        }
        for m in matches
    ]


@router.get('/jobs/{job_id}/applicants', summary='Get all applicants for a job with full details')
async def get_job_applicants(
    job_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns all applicants for a job with their resume details, application status, and match scores."""
    if current_user['role'] != 'recruiter':
        raise HTTPException(status_code=403, detail='Recruiter only')

    # Verify job belongs to recruiter
    job_result = await db.execute(
        select(JobListing).where(
            JobListing.id == job_id,
            JobListing.recruiter_id == uuid.UUID(current_user['id']),
        )
    )
    job = job_result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail='Job not found')

    # Get applications with user, resume, and match data
    stmt = (
        select(Application)
        .where(Application.job_id == job_id)
        .options(
            selectinload(Application.applicant),
        )
        .order_by(Application.created_at.desc())
    )
    result = await db.execute(stmt)
    applications = result.scalars().all()

    applicants = []
    for app in applications:
        # Get resume data
        resume_data = None
        if app.resume_id:
            resume_result = await db.execute(
                select(Resume).where(Resume.id == app.resume_id)
            )
            resume = resume_result.scalar_one_or_none()
            if resume:
                parsed = resume.parsed_data or {}
                resume_data = {
                    'id': str(resume.id),
                    'file_url': resume.file_url,
                    'file_name': resume.file_name,
                    'summary': parsed.get('summary', ''),
                    'experience': parsed.get('experience', []),
                    'education': parsed.get('education', []),
                    'skills': parsed.get('skills', []),
                    'name': parsed.get('name', ''),
                    'email': parsed.get('email', ''),
                    'phone': parsed.get('phone', ''),
                }

        # Get match score - try by match_result_id first, fallback to job_id + resume_id
        match_data = None
        match = None
        if app.match_result_id:
            match_result = await db.execute(
                select(MatchResult).where(MatchResult.id == app.match_result_id)
            )
            match = match_result.scalar_one_or_none()

        # Fallback: find match by job_id + resume_id
        if not match and app.resume_id:
            match_result = await db.execute(
                select(MatchResult).where(
                    MatchResult.job_id == app.job_id,
                    MatchResult.resume_id == app.resume_id,
                )
            )
            match = match_result.scalar_one_or_none()
            # Auto-link for future queries
            if match and not app.match_result_id:
                app.match_result_id = match.id

        if match:
            match_data = {
                'overall_score': match.overall_score,
                'skill_score': match.skill_score,
                'semantic_score': match.semantic_score,
                'experience_score': match.experience_score,
                'education_score': match.education_score,
                'matched_skills': match.matched_skills,
                'missing_skills': match.missing_skills,
                'is_shortlisted': match.is_shortlisted,
                'explanation': match.explanation,
            }

        # Get user profile for basic details
        profile_result = await db.execute(
            select(UserProfile).where(UserProfile.user_id == app.applicant_id)
        )
        profile = profile_result.scalar_one_or_none()

        applicants.append({
            'application_id': str(app.id),
            'applicant_id': str(app.applicant_id),
            'candidate_name': app.applicant.full_name or (resume_data or {}).get('name', 'Unknown'),
            'candidate_email': app.applicant.email,
            'candidate_avatar': app.applicant.avatar_url,
            'profile': {
                'headline': profile.headline if profile else None,
                'bio': profile.bio if profile else None,
                'location': profile.location if profile else None,
                'linkedin_url': profile.linkedin_url if profile else None,
                'github_url': profile.github_url if profile else None,
            } if profile else None,
            'status': app.status.value,
            'cover_letter': app.cover_letter,
            'rejection_reason': app.rejection_reason,
            'recruiter_notes': app.recruiter_notes,
            'applied_at': app.created_at.isoformat(),
            'resume': resume_data,
            'match': match_data,
        })

    return {
        'job': {
            'id': str(job.id),
            'title': job.title,
            'company': job.company,
            'status': job.status.value if hasattr(job.status, 'value') else job.status,
        },
        'applicants': applicants,
        'total': len(applicants),
    }


@router.patch('/applications/{application_id}/status', summary='Update application status')
async def update_application_status(
    application_id: uuid.UUID,
    body: ApplicationStatusUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Recruiter updates application status (shortlist, reject, etc.)."""
    if current_user['role'] != 'recruiter':
        raise HTTPException(status_code=403, detail='Recruiter only')

    # Get the application
    result = await db.execute(
        select(Application).where(Application.id == application_id)
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail='Application not found')

    # Verify the job belongs to the recruiter
    job_result = await db.execute(
        select(JobListing).where(
            JobListing.id == application.job_id,
            JobListing.recruiter_id == uuid.UUID(current_user['id']),
        )
    )
    if not job_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail='Not authorized to manage this application')

    # Validate status
    try:
        new_status = ApplicationStatus(body.status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f'Invalid status: {body.status}')

    application.status = new_status

    if body.rejection_reason is not None:
        application.rejection_reason = body.rejection_reason

    if body.recruiter_notes is not None:
        application.recruiter_notes = body.recruiter_notes

    # If shortlisted, also update match result
    if new_status == ApplicationStatus.shortlisted and application.match_result_id:
        match_res = await db.execute(
            select(MatchResult).where(MatchResult.id == application.match_result_id)
        )
        match = match_res.scalar_one_or_none()
        if match:
            match.is_shortlisted = True

    # If rejected and was shortlisted, remove shortlist
    if new_status == ApplicationStatus.rejected and application.match_result_id:
        match_res = await db.execute(
            select(MatchResult).where(MatchResult.id == application.match_result_id)
        )
        match = match_res.scalar_one_or_none()
        if match:
            match.is_shortlisted = False

    await db.flush()

    return {
        'message': 'Application status updated',
        'application_id': str(application.id),
        'status': new_status.value,
        'rejection_reason': application.rejection_reason,
    }


@router.patch('/matches/{match_id}/shortlist')
async def update_shortlist(
    match_id: uuid.UUID,
    body: ShortlistUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Recruiter shortlists or removes a candidate from shortlist."""
    result = await db.execute(select(MatchResult).where(MatchResult.id == match_id))
    match = result.scalar_one_or_none()
    if not match:
        raise HTTPException(status_code=404, detail='Match result not found')

    match.is_shortlisted = body.is_shortlisted
    return {'message': 'Shortlist status updated', 'is_shortlisted': body.is_shortlisted}


@router.get('/dashboard/stats', summary='Recruiter dashboard summary stats')
async def get_dashboard_stats(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns summary stats for the recruiter dashboard."""
    if current_user['role'] != 'recruiter':
        raise HTTPException(status_code=403, detail='Recruiter only')

    recruiter_id = uuid.UUID(current_user['id'])

    # Total jobs
    jobs_result = await db.execute(
        select(func.count(JobListing.id)).where(JobListing.recruiter_id == recruiter_id)
    )
    total_jobs = jobs_result.scalar()

    # Total applications across all jobs
    apps_result = await db.execute(
        select(func.count(Application.id))
        .join(JobListing, Application.job_id == JobListing.id)
        .where(JobListing.recruiter_id == recruiter_id)
    )
    total_applications = apps_result.scalar()

    # Shortlisted candidates
    shortlisted_result = await db.execute(
        select(func.count(Application.id))
        .join(JobListing, Application.job_id == JobListing.id)
        .where(
            JobListing.recruiter_id == recruiter_id,
            Application.status == ApplicationStatus.shortlisted,
        )
    )
    total_shortlisted = shortlisted_result.scalar()

    # Rejected candidates
    rejected_result = await db.execute(
        select(func.count(Application.id))
        .join(JobListing, Application.job_id == JobListing.id)
        .where(
            JobListing.recruiter_id == recruiter_id,
            Application.status == ApplicationStatus.rejected,
        )
    )
    total_rejected = rejected_result.scalar()

    return {
        'total_jobs': total_jobs,
        'total_applications': total_applications,
        'total_shortlisted': total_shortlisted,
        'total_rejected': total_rejected,
    }
