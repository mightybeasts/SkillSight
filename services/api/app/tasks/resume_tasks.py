"""
Async Celery tasks for resume processing.
Runs in background so API stays responsive during heavy NLP work.
"""
from app.celery_app import celery_app
from app.services.nlp_service import nlp_service
from app.services.embedding_service import embedding_service
from app.services.pdf_service import pdf_service
from loguru import logger
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.core.config import settings
from sqlalchemy import update
import uuid


def _get_sync_db_session():
    """Create a synchronous DB session for use in Celery tasks."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    sync_url = settings.DATABASE_URL.replace('+asyncpg', '')
    engine = create_engine(sync_url, pool_pre_ping=True)
    Session = sessionmaker(bind=engine)
    return Session()


@celery_app.task(
    name='tasks.process_resume',
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def process_resume(self, resume_id: str, file_bytes_hex: str | None = None):
    """
    Process a resume:
    1. Extract text (if PDF bytes provided)
    2. Parse sections using NLP
    3. Extract skills
    4. Generate embedding
    5. Update DB record
    """
    from app.models.resume import Resume, ResumeSkill, ProcessingStatus

    logger.info(f'Processing resume {resume_id}')
    session = _get_sync_db_session()

    try:
        resume = session.query(Resume).filter(Resume.id == uuid.UUID(resume_id)).first()
        if not resume:
            logger.error(f'Resume {resume_id} not found')
            return

        # Update status to processing
        resume.processing_status = ProcessingStatus.processing
        session.commit()

        raw_text = resume.raw_text or ''

        # Extract text from PDF if needed
        if file_bytes_hex and not raw_text:
            file_bytes = bytes.fromhex(file_bytes_hex)
            raw_text = pdf_service.extract_text(file_bytes)
            resume.raw_text = raw_text

        if not raw_text.strip():
            raise ValueError('Could not extract text from resume')

        # Parse resume sections
        sections = nlp_service.parse_resume_sections(raw_text)

        # Extract entities
        entities = nlp_service.extract_entities(raw_text)

        # Extract skills
        skills = nlp_service.extract_skills(raw_text)

        # Extract experience years
        years_exp = nlp_service.extract_years_of_experience(raw_text)

        # Extract contact info
        email = nlp_service.extract_email(raw_text) or resume.owner.email
        phone = nlp_service.extract_phone(raw_text)
        name = entities['persons'][0] if entities['persons'] else None

        # Build parsed data
        parsed_data = {
            'name': name,
            'email': email,
            'phone': phone,
            'years_of_experience': years_exp,
            'sections': sections,
            'entities': entities,
            'skills': [s['skill_name'] for s in skills],
        }
        resume.parsed_data = parsed_data

        # Generate embedding from profile data (skills, education, projects)
        from app.tasks.matching_tasks import _build_profile_text
        profile_text = _build_profile_text(parsed_data)
        embedding = embedding_service.encode((profile_text or raw_text)[:8000])
        resume.embedding = embedding

        # Upsert skill records
        session.query(ResumeSkill).filter(ResumeSkill.resume_id == resume.id).delete()
        for skill in skills:
            session.add(ResumeSkill(
                resume_id=resume.id,
                skill_name=skill['skill_name'],
                skill_category=skill['skill_category'],
            ))

        resume.processing_status = ProcessingStatus.completed
        session.commit()
        logger.info(f'Resume {resume_id} processed successfully')

        # Trigger batch matching against all active jobs
        from app.tasks.matching_tasks import batch_match_for_user
        batch_match_for_user.delay(str(resume.owner_id))

    except Exception as exc:
        logger.error(f'Resume processing failed for {resume_id}: {exc}')
        if resume:
            resume.processing_status = ProcessingStatus.failed
            resume.processing_error = str(exc)
            session.commit()
        raise self.retry(exc=exc)
    finally:
        session.close()
