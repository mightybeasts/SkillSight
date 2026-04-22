from fastapi import APIRouter, HTTPException, Depends, Query
from app.core.security import get_current_user
from app.db.database import get_db
from app.models.job import JobListing, JobSkill
from app.models.match import MatchResult
from app.models.application import Application, ApplicationStatus
from app.models.resume import Resume
from app.models.user import User, UserProfile
from app.schemas.job import JobListingResponse
from app.services.notification_service import notify
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


class AIScreenRequest(BaseModel):
    min_match_score: float = 0.70  # 0.0 – 1.0
    mandatory_skills: list[str] = []
    max_backlogs: int | None = None
    min_academic_percentage: float | None = None
    only_unreviewed: bool = True


class AIScreenDecision(BaseModel):
    application_id: uuid.UUID
    action: str  # 'shortlisted' | 'rejected'
    reason: str | None = None


class AIScreenApplyRequest(BaseModel):
    decisions: list[AIScreenDecision]


_STATUS_NOTIF: dict[ApplicationStatus, dict] = {
    ApplicationStatus.shortlisted: {
        'type': 'application_shortlisted',
        'title': 'You were shortlisted!',
        'body': 'Your application for {job} was shortlisted by the recruiter.',
    },
    ApplicationStatus.interview: {
        'type': 'application_interview',
        'title': 'Interview scheduled',
        'body': 'You moved to the interview stage for {job}.',
    },
    ApplicationStatus.offer: {
        'type': 'application_offer',
        'title': 'You got an offer!',
        'body': 'You received an offer for {job}.',
    },
    ApplicationStatus.rejected: {
        'type': 'application_rejected',
        'title': 'Application update',
        'body': 'Your application for {job} was not selected.',
    },
}


async def _notify_candidate_status_change(
    db: AsyncSession,
    *,
    application: Application,
    job: JobListing,
    new_status: ApplicationStatus,
    reason: str | None = None,
) -> None:
    template = _STATUS_NOTIF.get(new_status)
    if not template:
        return
    body = template['body'].format(job=job.title)
    rejection = reason if reason is not None else application.rejection_reason
    if new_status == ApplicationStatus.rejected and rejection:
        body = f'{body} Reason: {rejection}'
    await notify(
        db,
        recipient_id=application.applicant_id,
        type=template['type'],
        title=template['title'],
        body=body,
        link_url='/(tabs)/resumes',
        meta={
            'application_id': str(application.id),
            'job_id': str(job.id),
            'job_title': job.title,
            'status': new_status.value,
        },
    )


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

    def _top_degree(parsed: dict) -> str | None:
        education = (parsed or {}).get('education') or []
        if not education:
            return None
        first = education[0] if isinstance(education[0], dict) else {}
        return first.get('degree') or first.get('field') or first.get('institution')

    return [
        {
            'match_id': str(m.id),
            'resume_id': str(m.resume_id),
            'candidate_name': (m.resume.parsed_data or {}).get('name', 'Unknown'),
            'candidate_email': (m.resume.parsed_data or {}).get('email'),
            'candidate_degree': _top_degree(m.resume.parsed_data or {}),
            'overall_score': m.overall_score,
            'skill_score': m.skill_score,
            'semantic_score': m.semantic_score,
            'experience_score': m.experience_score,
            'education_score': m.education_score,
            'matched_skills': m.matched_skills or [],
            'partial_skills': m.partial_skills or [],
            'missing_skills': m.missing_skills or [],
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
    job = job_result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=403, detail='Not authorized to manage this application')

    # Validate status
    try:
        new_status = ApplicationStatus(body.status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f'Invalid status: {body.status}')

    prev_status = application.status
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

    # Notify the candidate when status changes to a meaningful state
    if new_status != prev_status:
        await _notify_candidate_status_change(db, application=application, job=job, new_status=new_status)

    await db.flush()

    return {
        'message': 'Application status updated',
        'application_id': str(application.id),
        'status': new_status.value,
        'rejection_reason': application.rejection_reason,
    }


@router.get('/jobs/{job_id}/screening-defaults', summary='Suggested screening criteria defaults for a job')
async def get_screening_defaults(
    job_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user['role'] != 'recruiter':
        raise HTTPException(status_code=403, detail='Recruiter only')

    job_result = await db.execute(
        select(JobListing).where(
            JobListing.id == job_id,
            JobListing.recruiter_id == uuid.UUID(current_user['id']),
        )
    )
    job = job_result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail='Job not found')

    skills_result = await db.execute(
        select(JobSkill).where(JobSkill.job_id == job_id, JobSkill.is_required == True)
    )
    required_skills = [s.skill_name for s in skills_result.scalars().all()]

    return {
        'job_id': str(job_id),
        'suggested_mandatory_skills': required_skills,
        'default_min_match_score': 0.70,
    }


@router.post('/jobs/{job_id}/ai-screen', summary='Preview AI screening recommendations (no DB writes)')
async def ai_screen_job(
    job_id: uuid.UUID,
    body: AIScreenRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Preview-only. Evaluates every applicant against recruiter-defined criteria and returns
    a recommended action + reason per candidate. Does NOT persist any changes.
    Recruiter must call /ai-screen/apply to commit the decisions.
    """
    if current_user['role'] != 'recruiter':
        raise HTTPException(status_code=403, detail='Recruiter only')

    job_result = await db.execute(
        select(JobListing).where(
            JobListing.id == job_id,
            JobListing.recruiter_id == uuid.UUID(current_user['id']),
        )
    )
    job = job_result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail='Job not found')

    stmt = (
        select(Application)
        .where(Application.job_id == job_id)
        .options(selectinload(Application.applicant))
    )
    applications = (await db.execute(stmt)).scalars().all()

    reviewed_statuses = {
        ApplicationStatus.shortlisted,
        ApplicationStatus.interview,
        ApplicationStatus.offer,
        ApplicationStatus.rejected,
    }

    mandatory_lower = [s.strip().lower() for s in body.mandatory_skills if s.strip()]
    results: list[dict] = []
    shortlisted_count = 0
    rejected_count = 0
    skipped_count = 0

    for app in applications:
        # Skip withdrawn — candidate chose to leave
        if app.status == ApplicationStatus.withdrawn:
            skipped_count += 1
            results.append({
                'application_id': str(app.id),
                'candidate_name': app.applicant.full_name or 'Unknown',
                'overall_score': None,
                'action': 'skipped',
                'reason': 'Candidate withdrew their application',
            })
            continue

        # Respect prior manual decisions unless recruiter opts in
        if body.only_unreviewed and app.status in reviewed_statuses:
            skipped_count += 1
            results.append({
                'application_id': str(app.id),
                'candidate_name': app.applicant.full_name or 'Unknown',
                'overall_score': None,
                'action': 'skipped',
                'reason': f'Already reviewed (status: {app.status.value})',
            })
            continue

        # Load the match + resume for this application
        match = None
        resume = None
        if app.resume_id:
            resume = (await db.execute(
                select(Resume).where(Resume.id == app.resume_id)
            )).scalar_one_or_none()

        match_res = await db.execute(
            select(MatchResult).where(
                MatchResult.job_id == job_id,
                MatchResult.resume_id == app.resume_id,
            )
        )
        match = match_res.scalar_one_or_none()

        overall_score = match.overall_score if match else 0.0
        score_pct = round(overall_score * 100)

        matched_names = {
            (s.get('name') or s.get('skill_name') or '').lower()
            for s in (match.matched_skills or []) if isinstance(s, dict)
        } if match else set()

        reject_reasons: list[str] = []
        pass_notes: list[str] = [f'Match score {score_pct}%']

        # 1. Match score gate
        if overall_score < body.min_match_score:
            reject_reasons.append(
                f'Match score {score_pct}% below required {round(body.min_match_score * 100)}%'
            )

        # 2. Mandatory skills gate
        if mandatory_lower:
            missing = [s for s in mandatory_lower if s not in matched_names]
            if missing:
                reject_reasons.append(f'Missing mandatory skill(s): {", ".join(missing)}')
            else:
                pass_notes.append(f'All {len(mandatory_lower)} mandatory skill(s) matched')

        # 3. Backlog gate (from resume.parsed_data.backlogs if present)
        parsed = (resume.parsed_data if resume else None) or {}
        backlog_val = parsed.get('backlogs')
        if body.max_backlogs is not None:
            if isinstance(backlog_val, (int, float)):
                if backlog_val > body.max_backlogs:
                    reject_reasons.append(
                        f'{int(backlog_val)} backlog(s) exceeds limit of {body.max_backlogs}'
                    )
                else:
                    pass_notes.append(f'{int(backlog_val)} backlog(s) within limit')
            else:
                pass_notes.append('Backlogs unverified (not in resume)')

        # 4. Academic percentage gate
        acad_val = parsed.get('academic_percentage')
        if body.min_academic_percentage is not None:
            if isinstance(acad_val, (int, float)):
                if acad_val < body.min_academic_percentage:
                    reject_reasons.append(
                        f'Academic {acad_val}% below required {body.min_academic_percentage}%'
                    )
                else:
                    pass_notes.append(f'Academic {acad_val}%')
            else:
                pass_notes.append('Academic % unverified (not in resume)')

        # Build the recommendation (NOT applied until /apply is called)
        if reject_reasons:
            reason = '; '.join(reject_reasons)
            rejected_count += 1
            results.append({
                'application_id': str(app.id),
                'candidate_name': app.applicant.full_name or parsed.get('name', 'Unknown'),
                'overall_score': overall_score,
                'action': 'rejected',
                'reason': reason,
            })
        else:
            reason = 'Meets all criteria: ' + '; '.join(pass_notes)
            shortlisted_count += 1
            results.append({
                'application_id': str(app.id),
                'candidate_name': app.applicant.full_name or parsed.get('name', 'Unknown'),
                'overall_score': overall_score,
                'action': 'shortlisted',
                'reason': reason,
            })

    return {
        'job_id': str(job_id),
        'job_title': job.title,
        'screened_count': len(applications),
        'shortlisted_count': shortlisted_count,
        'rejected_count': rejected_count,
        'skipped_count': skipped_count,
        'criteria': body.model_dump(),
        'results': results,
        'applied': False,
    }


@router.post('/jobs/{job_id}/ai-screen/apply', summary='Apply finalized AI screening decisions')
async def ai_screen_apply(
    job_id: uuid.UUID,
    body: AIScreenApplyRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Commit the recruiter's finalized decisions from the preview. Each decision updates
    Application.status + rejection_reason/recruiter_notes and syncs MatchResult.is_shortlisted.
    Only decisions for applications belonging to this recruiter's job are applied.
    """
    if current_user['role'] != 'recruiter':
        raise HTTPException(status_code=403, detail='Recruiter only')

    job_result = await db.execute(
        select(JobListing).where(
            JobListing.id == job_id,
            JobListing.recruiter_id == uuid.UUID(current_user['id']),
        )
    )
    job = job_result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail='Job not found')

    application_ids = [d.application_id for d in body.decisions]
    if not application_ids:
        return {'applied_count': 0, 'shortlisted_count': 0, 'rejected_count': 0, 'applied': True}

    apps_result = await db.execute(
        select(Application).where(
            Application.id.in_(application_ids),
            Application.job_id == job_id,
        )
    )
    apps_by_id = {a.id: a for a in apps_result.scalars().all()}

    shortlisted_count = 0
    rejected_count = 0
    applied_count = 0
    skipped_ids: list[str] = []

    for decision in body.decisions:
        app = apps_by_id.get(decision.application_id)
        if not app:
            skipped_ids.append(str(decision.application_id))
            continue

        if decision.action not in ('shortlisted', 'rejected'):
            skipped_ids.append(str(decision.application_id))
            continue

        match = None
        if app.resume_id:
            match_res = await db.execute(
                select(MatchResult).where(
                    MatchResult.job_id == job_id,
                    MatchResult.resume_id == app.resume_id,
                )
            )
            match = match_res.scalar_one_or_none()
            if match and not app.match_result_id:
                app.match_result_id = match.id

        prev_status = app.status
        if decision.action == 'shortlisted':
            app.status = ApplicationStatus.shortlisted
            app.recruiter_notes = decision.reason
            app.rejection_reason = None
            if match:
                match.is_shortlisted = True
            shortlisted_count += 1
        else:  # rejected
            app.status = ApplicationStatus.rejected
            app.rejection_reason = decision.reason
            if match:
                match.is_shortlisted = False
            rejected_count += 1

        if app.status != prev_status:
            await _notify_candidate_status_change(
                db, application=app, job=job, new_status=app.status, reason=decision.reason
            )

        applied_count += 1

    await db.flush()

    return {
        'job_id': str(job_id),
        'applied_count': applied_count,
        'shortlisted_count': shortlisted_count,
        'rejected_count': rejected_count,
        'skipped_application_ids': skipped_ids,
        'applied': True,
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


@router.get('/analytics', summary='Recruiter analytics dashboard data')
async def get_analytics(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns pipeline funnel, score distribution, top missing skills, and per-job breakdown."""
    if current_user['role'] != 'recruiter':
        raise HTTPException(status_code=403, detail='Recruiter only')

    from app.models.job import JobStatus  # local import avoids circular
    recruiter_id = uuid.UUID(current_user['id'])

    # Summary
    active_jobs = (await db.execute(
        select(func.count(JobListing.id)).where(
            JobListing.recruiter_id == recruiter_id,
            JobListing.status == JobStatus.active,
        )
    )).scalar() or 0

    total_applications = (await db.execute(
        select(func.count(Application.id))
        .join(JobListing, Application.job_id == JobListing.id)
        .where(JobListing.recruiter_id == recruiter_id)
    )).scalar() or 0

    total_shortlisted = (await db.execute(
        select(func.count(Application.id))
        .join(JobListing, Application.job_id == JobListing.id)
        .where(
            JobListing.recruiter_id == recruiter_id,
            Application.status == ApplicationStatus.shortlisted,
        )
    )).scalar() or 0

    avg_score = (await db.execute(
        select(func.avg(MatchResult.overall_score))
        .join(JobListing, MatchResult.job_id == JobListing.id)
        .where(JobListing.recruiter_id == recruiter_id)
    )).scalar()

    # Pipeline funnel — status counts
    pipeline_rows = (await db.execute(
        select(Application.status, func.count(Application.id))
        .join(JobListing, Application.job_id == JobListing.id)
        .where(JobListing.recruiter_id == recruiter_id)
        .group_by(Application.status)
    )).all()
    pipeline = {s.value: 0 for s in ApplicationStatus}
    for status, count in pipeline_rows:
        key = status.value if hasattr(status, 'value') else str(status)
        pipeline[key] = count

    # Score distribution — bucket match results
    score_rows = (await db.execute(
        select(MatchResult.overall_score)
        .join(JobListing, MatchResult.job_id == JobListing.id)
        .where(JobListing.recruiter_id == recruiter_id)
    )).scalars().all()

    buckets = [
        ('0-49%', 0, 0.50),
        ('50-69%', 0.50, 0.70),
        ('70-84%', 0.70, 0.85),
        ('85-100%', 0.85, 1.01),
    ]
    score_distribution = []
    for label, lo, hi in buckets:
        count = sum(1 for s in score_rows if s is not None and lo <= s < hi)
        score_distribution.append({'bucket': label, 'count': count})

    # Top missing skills — aggregate across all MatchResult.missing_skills for this recruiter
    missing_rows = (await db.execute(
        select(MatchResult.missing_skills)
        .join(JobListing, MatchResult.job_id == JobListing.id)
        .where(JobListing.recruiter_id == recruiter_id)
    )).scalars().all()

    skill_counts: dict[str, int] = {}
    for missing in missing_rows:
        if not missing:
            continue
        for s in missing:
            if not isinstance(s, dict):
                continue
            name = (s.get('name') or s.get('skill_name') or '').strip()
            if not name:
                continue
            skill_counts[name] = skill_counts.get(name, 0) + 1
    top_missing_skills = [
        {'skill': name, 'count': count}
        for name, count in sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    ]

    # Per-job breakdown
    jobs_result = (await db.execute(
        select(JobListing).where(JobListing.recruiter_id == recruiter_id)
    )).scalars().all()

    per_job = []
    for job in jobs_result:
        job_apps = (await db.execute(
            select(Application.status, func.count(Application.id))
            .where(Application.job_id == job.id)
            .group_by(Application.status)
        )).all()
        status_counts = {s.value: 0 for s in ApplicationStatus}
        total = 0
        for status, count in job_apps:
            key = status.value if hasattr(status, 'value') else str(status)
            status_counts[key] = count
            total += count

        job_avg = (await db.execute(
            select(func.avg(MatchResult.overall_score)).where(MatchResult.job_id == job.id)
        )).scalar()

        per_job.append({
            'job_id': str(job.id),
            'title': job.title,
            'status': job.status.value if hasattr(job.status, 'value') else str(job.status),
            'applications': total,
            'avg_match_score': float(job_avg) if job_avg is not None else None,
            'shortlisted': status_counts['shortlisted'],
            'rejected': status_counts['rejected'],
        })
    per_job.sort(key=lambda x: x['applications'], reverse=True)

    return {
        'summary': {
            'active_jobs': active_jobs,
            'total_applications': total_applications,
            'total_shortlisted': total_shortlisted,
            'avg_match_score': float(avg_score) if avg_score is not None else None,
        },
        'pipeline': pipeline,
        'score_distribution': score_distribution,
        'top_missing_skills': top_missing_skills,
        'per_job': per_job,
    }


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
