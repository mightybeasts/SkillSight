from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form, status
from fastapi.responses import StreamingResponse
from app.core.security import get_current_user
from app.core.config import settings
from app.db.database import AsyncSessionLocal, get_db
from app.models.resume import Resume, ProcessingStatus
from app.schemas.resume import ResumeResponse, ResumeUploadResponse
from app.services.pdf_service import pdf_service
from app.tasks.resume_tasks import process_resume
from app.db.supabase import get_supabase_client
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from loguru import logger
from pydantic import BaseModel
from app.models.job import JobListing
from app.services.resume_optimizer import resume_optimizer
from io import BytesIO
import re
import uuid

router = APIRouter()

MAX_FILE_SIZE = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024  # bytes


@router.post('/upload', response_model=ResumeUploadResponse, status_code=201)
async def upload_resume(
    file: UploadFile = File(...),
    title: str = Form(default='My Resume'),
    is_master: bool = Form(default=False),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a PDF resume. Triggers async processing pipeline."""
    # Validate file type
    if not file.content_type or 'pdf' not in file.content_type.lower():
        raise HTTPException(status_code=400, detail='Only PDF files are accepted')

    file_bytes = await file.read()

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f'File too large. Max size: {settings.MAX_UPLOAD_SIZE_MB}MB',
        )

    if not pdf_service.validate_pdf(file_bytes):
        raise HTTPException(status_code=400, detail='Invalid PDF file')

    # Upload to Supabase Storage
    supabase = get_supabase_client()
    storage_path = f"resumes/{current_user['id']}/{uuid.uuid4()}_{file.filename}"
    try:
        supabase.storage.from_('resumes').upload(
            path=storage_path,
            file=file_bytes,
            file_options={'content-type': 'application/pdf'},
        )
        file_url = supabase.storage.from_('resumes').get_public_url(storage_path)
    except Exception as e:
        logger.error(f'Supabase storage upload failed: {e}')
        file_url = None

    # Create DB record
    resume = Resume(
        owner_id=uuid.UUID(current_user['id']),
        title=title,
        is_master=is_master,
        file_name=file.filename,
        file_url=file_url,
        processing_status=ProcessingStatus.pending,
    )
    db.add(resume)
    await db.flush()
    await db.refresh(resume)

    # Queue async processing
    task = process_resume.delay(
        resume_id=str(resume.id),
        file_bytes_hex=file_bytes.hex(),
    )

    return ResumeUploadResponse(resume_id=resume.id, task_id=task.id)


@router.post('/text', response_model=ResumeUploadResponse, status_code=201)
async def create_resume_from_text(
    title: str = Form(default='My Resume'),
    is_master: bool = Form(default=False),
    raw_text: str = Form(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a resume from raw text (paste mode)."""
    if len(raw_text.strip()) < 100:
        raise HTTPException(status_code=400, detail='Resume text too short (min 100 characters)')

    resume = Resume(
        owner_id=uuid.UUID(current_user['id']),
        title=title,
        is_master=is_master,
        raw_text=raw_text,
        processing_status=ProcessingStatus.pending,
    )
    db.add(resume)
    await db.flush()
    await db.refresh(resume)

    task = process_resume.delay(resume_id=str(resume.id))
    return ResumeUploadResponse(resume_id=resume.id, task_id=task.id)


@router.get('/', response_model=list[ResumeResponse])
async def list_resumes(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Resume).where(Resume.owner_id == uuid.UUID(current_user['id']))
    )
    return result.scalars().all()


@router.get('/{resume_id}', response_model=ResumeResponse)
async def get_resume(
    resume_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Resume).where(
            Resume.id == resume_id,
            Resume.owner_id == uuid.UUID(current_user['id']),
        )
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail='Resume not found')
    return resume


@router.delete('/{resume_id}', status_code=204)
async def delete_resume(
    resume_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Resume).where(
            Resume.id == resume_id,
            Resume.owner_id == uuid.UUID(current_user['id']),
        )
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail='Resume not found')
    await db.delete(resume)


@router.patch('/{resume_id}/set-master', response_model=ResumeResponse)
async def set_master(
    resume_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark this resume as the user's master and unset all others."""
    user_uuid = uuid.UUID(current_user['id'])
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.owner_id == user_uuid)
    )
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail='Resume not found')

    await db.execute(
        update(Resume).where(Resume.owner_id == user_uuid).values(is_master=False)
    )
    target.is_master = True
    await db.flush()
    await db.refresh(target)
    return target


class TailoredResumeRequest(BaseModel):
    job_id: uuid.UUID
    template: str = 'modern'  # 'modern' | 'classic' | 'minimal'
    title: str | None = None


@router.post('/tailored', response_model=ResumeResponse, status_code=201)
async def create_tailored_resume(
    body: TailoredResumeRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Build a job-tailored resume from the user's master resume.
    Uses the resume optimizer + match data and saves a new Resume row.
    """
    user_uuid = uuid.UUID(current_user['id'])

    # Load master (or fall back to most recent completed resume)
    master_q = await db.execute(
        select(Resume)
        .where(
            Resume.owner_id == user_uuid,
            Resume.processing_status == ProcessingStatus.completed,
        )
        .order_by(Resume.is_master.desc())
        .limit(1)
    )
    master = master_q.scalar_one_or_none()
    if not master or not master.parsed_data:
        raise HTTPException(status_code=400, detail='No completed master resume found. Upload and process one first.')

    # Load job + skills
    job_q = await db.execute(
        select(JobListing).where(JobListing.id == body.job_id).options(selectinload(JobListing.skills))
    )
    job = job_q.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail='Job not found')

    # Load existing match if any (for matched/missing/partial skills) — non-fatal
    from app.models.match import MatchResult
    match_q = await db.execute(
        select(MatchResult).where(
            MatchResult.resume_id == master.id,
            MatchResult.job_id == body.job_id,
        )
    )
    match = match_q.scalar_one_or_none()

    optimized = resume_optimizer.generate_optimized_resume(
        master_resume_data=master.parsed_data or {},
        job_title=job.title,
        job_description=job.description,
        job_skills=[{'skill_name': s.skill_name, 'is_required': s.is_required} for s in job.skills],
        match_result={
            'matched_skills': (match.matched_skills if match else []) or [],
            'missing_skills': (match.missing_skills if match else []) or [],
            'partial_skills': (match.partial_skills if match else []) or [],
        },
    )

    title = body.title or f'Tailored — {job.title}'
    parsed = {
        **optimized,
        '_template': body.template,
        '_target_job_id': str(body.job_id),
        '_target_job_title': job.title,
        '_target_company': job.company,
        '_match_score': match.overall_score if match else None,
    }

    tailored = Resume(
        owner_id=user_uuid,
        title=title,
        is_master=False,
        raw_text=master.raw_text,
        parsed_data=parsed,
        embedding=master.embedding,
        processing_status=ProcessingStatus.completed,
    )
    db.add(tailored)
    await db.flush()
    await db.refresh(tailored)
    return tailored


def _safe_filename(s: str) -> str:
    s = re.sub(r'[^A-Za-z0-9_-]+', '_', (s or 'resume').strip())
    return s.strip('_') or 'resume'


@router.get('/{resume_id}/download')
async def download_resume_pdf(
    resume_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Render the resume's parsed_data into a styled PDF and stream it back."""
    result = await db.execute(
        select(Resume).where(
            Resume.id == resume_id,
            Resume.owner_id == uuid.UUID(current_user['id']),
        )
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail='Resume not found')
    if not resume.parsed_data:
        raise HTTPException(status_code=400, detail='Resume has no parsed data to render')

    try:
        from app.services.resume_pdf import render_resume_pdf
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail='PDF rendering is not available. Install reportlab on the server.',
        )

    pdf_bytes = render_resume_pdf(resume.parsed_data, title=resume.title or 'Resume')
    filename = f"{_safe_filename(resume.title or 'resume')}.pdf"
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type='application/pdf',
        headers={'Content-Disposition': f'attachment; filename="{filename}"'},
    )
