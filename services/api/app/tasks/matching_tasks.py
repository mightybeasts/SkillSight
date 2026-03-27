"""
Async Celery tasks for job-resume matching.
"""
from app.celery_app import celery_app
from app.services.matching_service import matching_service
from app.services.resume_optimizer import resume_optimizer
from loguru import logger
import uuid
from sqlalchemy import select


def _get_session():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.core.config import settings

    sync_url = settings.DATABASE_URL.replace('+asyncpg', '')
    engine = create_engine(sync_url, pool_pre_ping=True)
    return sessionmaker(bind=engine)()


def _build_profile_text(parsed_data: dict) -> str:
    """
    Build a text representation from profile data (skills, education, projects, experience)
    for use in semantic matching and education scoring — instead of raw resume text.
    """
    parts = []

    skills = parsed_data.get('skills', [])
    if skills:
        skill_names = [s if isinstance(s, str) else s.get('skill_name', '') for s in skills]
        parts.append(f"Skills: {', '.join(skill_names)}")

    sections = parsed_data.get('sections', {})

    for key in ('education', 'experience', 'projects', 'certifications'):
        section = sections.get(key)
        if section:
            label = key.capitalize()
            if isinstance(section, list):
                parts.append(f"{label}: {' '.join(str(item) for item in section)}")
            elif isinstance(section, str):
                parts.append(f"{label}: {section}")
            elif isinstance(section, dict):
                parts.append(f"{label}: {' '.join(str(v) for v in section.values())}")

    name = parsed_data.get('name')
    if name:
        parts.insert(0, name)

    return '\n\n'.join(parts)


@celery_app.task(
    name='tasks.compute_match',
    bind=True,
    max_retries=3,
    default_retry_delay=30,
)
def compute_match(self, resume_id: str, job_id: str):
    """
    Compute semantic match between a resume and a job listing.
    Creates or updates a MatchResult record with full explainability data.
    """
    from app.models.resume import Resume, ProcessingStatus
    from app.models.job import JobListing
    from app.models.match import MatchResult, SkillGap, LearningRecommendation

    logger.info(f'Computing match: resume={resume_id}, job={job_id}')
    session = _get_session()

    try:
        resume = session.query(Resume).filter(Resume.id == uuid.UUID(resume_id)).first()
        job = session.query(JobListing).filter(JobListing.id == uuid.UUID(job_id)).first()

        if not resume or not job:
            logger.error(f'Resume or job not found: resume={resume_id}, job={job_id}')
            return

        if resume.processing_status != ProcessingStatus.completed:
            raise ValueError(f'Resume not yet processed (status: {resume.processing_status})')

        parsed = resume.parsed_data or {}

        # Build profile text from skills, education, projects, experience
        profile_text = _build_profile_text(parsed)

        # Get profile skills
        skills_raw = parsed.get('skills', [])
        profile_skill_names = [
            s if isinstance(s, str) else s.get('skill_name', '')
            for s in skills_raw
        ]

        # Get job skills
        job_skills = [
            {
                'skill_name': s.skill_name,
                'is_required': s.is_required,
                'importance_weight': s.importance_weight,
            }
            for s in job.skills
        ]

        candidate_years = parsed.get('years_of_experience')
        required_years = None  # Could be extracted from job in future

        # Compute match using profile data instead of raw resume text
        match_score = matching_service.compute_match(
            resume_text=profile_text,
            resume_skills=profile_skill_names,
            resume_embedding=resume.embedding,
            job_description=job.description,
            job_skills=job_skills,
            job_embedding=job.embedding,
            required_experience_years=required_years,
            candidate_experience_years=candidate_years,
        )

        # Upsert MatchResult
        existing = session.query(MatchResult).filter(
            MatchResult.resume_id == resume.id,
            MatchResult.job_id == job.id,
        ).first()

        if existing:
            result = existing
        else:
            result = MatchResult(resume_id=resume.id, job_id=job.id)
            session.add(result)

        result.overall_score = match_score.overall_score
        result.semantic_score = match_score.semantic_score
        result.skill_score = match_score.skill_score
        result.experience_score = match_score.experience_score
        result.education_score = match_score.education_score
        result.matched_skills = match_score.matched_skills
        result.partial_skills = match_score.partial_skills
        result.missing_skills = match_score.missing_skills
        result.explanation = match_score.explanation

        session.flush()

        # Create skill gap records
        session.query(SkillGap).filter(SkillGap.match_result_id == result.id).delete()
        for gap in match_score.missing_skills:
            session.add(SkillGap(
                match_result_id=result.id,
                skill_name=gap['skill_name'],
                importance=gap.get('importance', 'medium'),
                gap_type='missing',
            ))

        # Create learning recommendations
        session.query(LearningRecommendation).filter(
            LearningRecommendation.match_result_id == result.id
        ).delete()
        recommendations = matching_service.generate_learning_recommendations(
            match_score.missing_skills
        )
        for rec in recommendations:
            session.add(LearningRecommendation(
                match_result_id=result.id,
                skill_name=rec['skill_name'],
                resource_type=rec['resource_type'],
                resource_title=rec['resource_title'],
                resource_provider=rec.get('resource_provider'),
                estimated_hours=rec.get('estimated_hours'),
                priority=rec['priority'],
            ))

        session.commit()
        logger.info(
            f'Match computed: resume={resume_id}, job={job_id}, '
            f'score={match_score.overall_score}'
        )
        return {'match_id': str(result.id), 'overall_score': match_score.overall_score}

    except Exception as exc:
        logger.error(f'Match computation failed: {exc}')
        session.rollback()
        raise self.retry(exc=exc)
    finally:
        session.close()


@celery_app.task(name='tasks.batch_match_for_user')
def batch_match_for_user(user_id: str):
    """
    After a resume is processed, compute matches against all active jobs
    that don't already have a match result for this user's primary resume.
    """
    from app.models.resume import Resume, ProcessingStatus
    from app.models.job import JobListing, JobStatus
    from app.models.match import MatchResult

    logger.info(f'Batch matching for user {user_id}')
    session = _get_session()

    try:
        # Find user's primary resume (master first, then most recent completed)
        resume = (
            session.query(Resume)
            .filter(
                Resume.owner_id == uuid.UUID(user_id),
                Resume.processing_status == ProcessingStatus.completed,
            )
            .order_by(Resume.is_master.desc())
            .first()
        )
        if not resume:
            logger.info(f'No completed resume for user {user_id}, skipping batch match')
            return

        # Get all active jobs
        active_jobs = session.query(JobListing.id).filter(
            JobListing.status == JobStatus.active
        ).all()

        # Get jobs that already have a match for this resume
        existing_matches = set(
            row[0] for row in
            session.query(MatchResult.job_id)
            .filter(MatchResult.resume_id == resume.id)
            .all()
        )

        queued = 0
        for (job_id,) in active_jobs:
            if job_id not in existing_matches:
                compute_match.delay(
                    resume_id=str(resume.id),
                    job_id=str(job_id),
                )
                queued += 1
                if queued >= 50:
                    break

        logger.info(f'Queued {queued} match tasks for user {user_id}')
    except Exception as exc:
        logger.error(f'Batch match for user failed: {exc}')
    finally:
        session.close()


@celery_app.task(name='tasks.batch_match_for_new_job')
def batch_match_for_new_job(job_id: str):
    """
    When a new job is created, compute matches against all users
    who have a completed resume.
    """
    from app.models.resume import Resume, ProcessingStatus

    logger.info(f'Batch matching for new job {job_id}')
    session = _get_session()

    try:
        # Get one primary resume per user (master preferred)
        resumes = (
            session.query(Resume)
            .filter(Resume.processing_status == ProcessingStatus.completed)
            .order_by(Resume.owner_id, Resume.is_master.desc())
            .all()
        )

        # Deduplicate: one resume per user
        seen_users = set()
        queued = 0
        for resume in resumes:
            if resume.owner_id in seen_users:
                continue
            seen_users.add(resume.owner_id)
            compute_match.delay(
                resume_id=str(resume.id),
                job_id=job_id,
            )
            queued += 1
            if queued >= 100:
                break

        logger.info(f'Queued {queued} match tasks for new job {job_id}')
    except Exception as exc:
        logger.error(f'Batch match for new job failed: {exc}')
    finally:
        session.close()
