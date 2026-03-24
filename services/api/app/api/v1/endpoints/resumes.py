from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form, status
from app.core.security import get_current_user
from app.core.config import settings
from app.db.database import AsyncSessionLocal, get_db
from app.models.resume import Resume
from app.schemas.resume import ResumeResponse, ResumeUploadResponse
from app.services.pdf_service import pdf_service
from app.tasks.resume_tasks import process_resume
from app.db.supabase import get_supabase_client
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger
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
        processing_status='pending',
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
        processing_status='pending',
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
