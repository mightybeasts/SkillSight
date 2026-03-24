from fastapi import APIRouter, HTTPException, Depends, Query
from app.core.security import get_current_user
from app.db.database import get_db
from app.models.job import JobListing, JobSkill, JobStatus
from app.schemas.job import JobListingCreate, JobListingUpdate, JobListingResponse
from app.services.embedding_service import embedding_service
from app.services.nlp_service import nlp_service
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

router = APIRouter()


@router.post('/', response_model=JobListingResponse, status_code=201)
async def create_job(
    body: JobListingCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Recruiter creates a job listing. Auto-extracts skills and generates embedding."""
    if current_user['role'] != 'recruiter':
        raise HTTPException(status_code=403, detail='Only recruiters can post jobs')

    # Auto-extract skills from description if none provided
    auto_skills = []
    if not body.skills:
        extracted = nlp_service.extract_skills(
            f"{body.description} {body.requirements or ''}"
        )
        auto_skills = extracted

    # Generate embedding for the job description
    full_text = f"{body.title} {body.description} {body.requirements or ''}"
    embedding = embedding_service.encode(full_text[:8000])

    job = JobListing(
        recruiter_id=uuid.UUID(current_user['id']),
        title=body.title,
        company=body.company,
        location=body.location,
        is_remote=body.is_remote,
        job_type=body.job_type,
        experience_level=body.experience_level,
        salary_min=body.salary_min,
        salary_max=body.salary_max,
        salary_currency=body.salary_currency,
        description=body.description,
        requirements=body.requirements,
        responsibilities=body.responsibilities,
        benefits=body.benefits,
        embedding=embedding,
    )
    db.add(job)
    await db.flush()

    # Add skills
    skills_to_add = body.skills if body.skills else [
        JobSkill(
            job_id=job.id,
            skill_name=s['skill_name'],
            skill_category=s.get('skill_category'),
            is_required=True,
            importance_weight=1.0,
        )
        for s in auto_skills
    ]

    for skill_input in (body.skills or []):
        db.add(JobSkill(
            job_id=job.id,
            skill_name=skill_input.skill_name,
            skill_category=skill_input.skill_category,
            is_required=skill_input.is_required,
            importance_weight=skill_input.importance_weight,
        ))

    if not body.skills:
        for s in auto_skills:
            db.add(JobSkill(
                job_id=job.id,
                skill_name=s['skill_name'],
                skill_category=s.get('skill_category'),
                is_required=True,
                importance_weight=1.0,
            ))

    await db.refresh(job)
    return job


@router.get('/', response_model=list[JobListingResponse])
async def list_jobs(
    search: str | None = Query(None),
    job_type: str | None = Query(None),
    is_remote: bool | None = Query(None),
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0),
    db: AsyncSession = Depends(get_db),
):
    """Public job listings. Supports search and filters."""
    query = select(JobListing).where(JobListing.status == JobStatus.active)

    if search:
        query = query.where(
            or_(
                JobListing.title.ilike(f'%{search}%'),
                JobListing.description.ilike(f'%{search}%'),
                JobListing.company.ilike(f'%{search}%'),
            )
        )
    if job_type:
        query = query.where(JobListing.job_type == job_type)
    if is_remote is not None:
        query = query.where(JobListing.is_remote == is_remote)

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()


@router.get('/{job_id}', response_model=JobListingResponse)
async def get_job(job_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(JobListing).where(JobListing.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail='Job not found')
    return job


@router.patch('/{job_id}', response_model=JobListingResponse)
async def update_job(
    job_id: uuid.UUID,
    body: JobListingUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(JobListing).where(
            JobListing.id == job_id,
            JobListing.recruiter_id == uuid.UUID(current_user['id']),
        )
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail='Job not found')

    for field, value in body.model_dump(exclude_none=True, exclude={'skills'}).items():
        setattr(job, field, value)

    return job


@router.delete('/{job_id}', status_code=204)
async def delete_job(
    job_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(JobListing).where(
            JobListing.id == job_id,
            JobListing.recruiter_id == uuid.UUID(current_user['id']),
        )
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail='Job not found')
    await db.delete(job)
