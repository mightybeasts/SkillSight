from fastapi import APIRouter, HTTPException, Depends, Query
from app.core.security import get_current_user
from app.db.database import get_db
from app.models.job import JobListing
from app.models.match import MatchResult
from app.models.application import Application, ApplicationStatus
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
import uuid

router = APIRouter()


class ShortlistUpdate(BaseModel):
    is_shortlisted: bool


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus
    recruiter_notes: str | None = None


@router.get('/jobs', summary='Get all jobs posted by this recruiter')
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
        select(func.count(MatchResult.id))
        .join(JobListing, MatchResult.job_id == JobListing.id)
        .where(
            JobListing.recruiter_id == recruiter_id,
            MatchResult.is_shortlisted == True,
        )
    )
    total_shortlisted = shortlisted_result.scalar()

    return {
        'total_jobs': total_jobs,
        'total_applications': total_applications,
        'total_shortlisted': total_shortlisted,
    }
