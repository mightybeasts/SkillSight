"""
Async Celery tasks for job-resume matching.
"""
from app.celery_app import celery_app
from app.services.matching_service import matching_service
from app.services.resume_optimizer import resume_optimizer
from loguru import logger
import uuid


def _get_session():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.core.config import settings

    sync_url = settings.DATABASE_URL.replace('+asyncpg', '')
    engine = create_engine(sync_url, pool_pre_ping=True)
    return sessionmaker(bind=engine)()


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
    from app.models.resume import Resume
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

        if resume.processing_status != 'completed':
            raise ValueError(f'Resume not yet processed (status: {resume.processing_status})')

        # Get resume skills
        resume_skill_names = [s['skill_name'] for s in (resume.parsed_data or {}).get('skills', [])]

        # Get job skills
        job_skills = [
            {
                'skill_name': s.skill_name,
                'is_required': s.is_required,
                'importance_weight': s.importance_weight,
            }
            for s in job.skills
        ]

        candidate_years = (resume.parsed_data or {}).get('years_of_experience')
        required_years = None  # Could be extracted from job in future

        # Compute match
        match_score = matching_service.compute_match(
            resume_text=resume.raw_text or '',
            resume_skills=resume_skill_names,
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
