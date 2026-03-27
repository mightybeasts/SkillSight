from fastapi import APIRouter, HTTPException, Depends
from app.core.security import get_current_user
from app.db.database import get_db
from app.models.match import MatchResult, SkillGap, LearningRecommendation
from app.models.resume import Resume, ProcessingStatus
from app.models.job import JobListing
from app.schemas.match import MatchRequest, FullMatchAnalysis, MatchResultResponse, MyMatchScoresResponse, MatchScoreSummary
from app.tasks.matching_tasks import compute_match, batch_match_for_user
from app.services.resume_optimizer import resume_optimizer
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

router = APIRouter()


@router.post('/analyze', status_code=202)
async def trigger_match_analysis(
    body: MatchRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger async job-resume match analysis.
    Returns task_id to poll status.
    """
    # Verify ownership of resume
    result = await db.execute(
        select(Resume).where(
            Resume.id == body.resume_id,
            Resume.owner_id == uuid.UUID(current_user['id']),
        )
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail='Resume not found')

    if resume.processing_status != ProcessingStatus.completed:
        raise HTTPException(
            status_code=400,
            detail=f'Resume is still being processed (status: {resume.processing_status})',
        )

    # Verify job exists
    job_result = await db.execute(select(JobListing).where(JobListing.id == body.job_id))
    if not job_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail='Job listing not found')

    # Queue match task
    task = compute_match.delay(
        resume_id=str(body.resume_id),
        job_id=str(body.job_id),
    )

    return {'task_id': task.id, 'message': 'Match analysis queued'}


@router.post('/compute-all', status_code=202)
async def trigger_batch_match_for_user(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Trigger match computation for all active jobs the user doesn't have scores for yet."""
    user_id = current_user['id']

    # Check user has a completed resume
    result = await db.execute(
        select(Resume)
        .where(
            Resume.owner_id == uuid.UUID(user_id),
            Resume.processing_status == ProcessingStatus.completed,
        )
        .order_by(Resume.is_master.desc())
        .limit(1)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        return {'message': 'No completed resume found. Upload a resume first.', 'queued': False}

    batch_match_for_user.delay(user_id)
    return {'message': 'Match computation queued for all jobs', 'queued': True}


@router.get('/my-scores', response_model=MyMatchScoresResponse)
async def get_my_match_scores(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all pre-computed match scores for the user's primary resume."""
    # Find master resume, or fallback to most recent completed resume
    result = await db.execute(
        select(Resume)
        .where(
            Resume.owner_id == uuid.UUID(current_user['id']),
            Resume.processing_status == ProcessingStatus.completed,
        )
        .order_by(Resume.is_master.desc())
    )
    resumes = result.scalars().all()
    if not resumes:
        return MyMatchScoresResponse(resume_id=None, scores=[])

    primary_resume = resumes[0]

    matches = await db.execute(
        select(MatchResult)
        .where(MatchResult.resume_id == primary_resume.id)
    )
    scores = [
        MatchScoreSummary(
            job_id=m.job_id,
            resume_id=m.resume_id,
            overall_score=m.overall_score,
        )
        for m in matches.scalars().all()
    ]
    return MyMatchScoresResponse(resume_id=primary_resume.id, scores=scores)


@router.get('/my-match/{job_id}', response_model=FullMatchAnalysis)
async def get_my_match_for_job(
    job_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get full match analysis for a specific job using the user's primary resume."""
    # Find master resume, or fallback to most recent completed
    result = await db.execute(
        select(Resume)
        .where(
            Resume.owner_id == uuid.UUID(current_user['id']),
            Resume.processing_status == ProcessingStatus.completed,
        )
        .order_by(Resume.is_master.desc())
    )
    resume = result.scalars().first()
    if not resume:
        raise HTTPException(status_code=404, detail='No profile data found. Complete your profile first.')

    match_result = await db.execute(
        select(MatchResult)
        .where(MatchResult.resume_id == resume.id, MatchResult.job_id == job_id)
        .options(
            selectinload(MatchResult.skill_gaps),
            selectinload(MatchResult.recommendations),
        )
    )
    match = match_result.scalar_one_or_none()
    if not match:
        raise HTTPException(
            status_code=404,
            detail='Match analysis not yet available for this job.',
        )

    return FullMatchAnalysis(
        match_result=MatchResultResponse.model_validate(match),
        skill_gaps=match.skill_gaps,
        recommendations=match.recommendations,
    )


@router.get('/{resume_id}/{job_id}', response_model=FullMatchAnalysis)
async def get_match_result(
    resume_id: uuid.UUID,
    job_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get full match analysis result for a resume-job pair."""
    result = await db.execute(
        select(MatchResult)
        .where(MatchResult.resume_id == resume_id, MatchResult.job_id == job_id)
        .options(
            selectinload(MatchResult.skill_gaps),
            selectinload(MatchResult.recommendations),
        )
    )
    match = result.scalar_one_or_none()
    if not match:
        raise HTTPException(
            status_code=404,
            detail='Match not yet computed. Call POST /matches/analyze first.',
        )

    return FullMatchAnalysis(
        match_result=MatchResultResponse.model_validate(match),
        skill_gaps=match.skill_gaps,
        recommendations=match.recommendations,
    )


@router.get('/resume/{resume_id}', response_model=list[MatchResultResponse])
async def get_all_matches_for_resume(
    resume_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all match results for a specific resume, sorted by score."""
    result = await db.execute(
        select(MatchResult)
        .where(MatchResult.resume_id == resume_id)
        .order_by(MatchResult.overall_score.desc())
    )
    return result.scalars().all()


@router.post('/{match_id}/optimize-resume')
async def get_optimized_resume(
    match_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a job-specific optimized resume from the master resume
    based on the match analysis.
    """
    result = await db.execute(
        select(MatchResult)
        .where(MatchResult.id == match_id)
        .options(selectinload(MatchResult.skill_gaps))
    )
    match = result.scalar_one_or_none()
    if not match:
        raise HTTPException(status_code=404, detail='Match result not found')

    # Load resume and job
    resume_result = await db.execute(select(Resume).where(Resume.id == match.resume_id))
    resume = resume_result.scalar_one_or_none()

    job_result = await db.execute(
        select(JobListing)
        .where(JobListing.id == match.job_id)
        .options(selectinload(JobListing.skills))
    )
    job = job_result.scalar_one_or_none()

    if not resume or not job:
        raise HTTPException(status_code=404, detail='Resume or job not found')

    optimized = resume_optimizer.generate_optimized_resume(
        master_resume_data=resume.parsed_data or {},
        job_title=job.title,
        job_description=job.description,
        job_skills=[{'skill_name': s.skill_name, 'is_required': s.is_required} for s in job.skills],
        match_result={
            'matched_skills': match.matched_skills or [],
            'missing_skills': match.missing_skills or [],
            'partial_skills': match.partial_skills or [],
        },
    )

    return optimized
