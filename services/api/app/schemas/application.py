from pydantic import BaseModel
from datetime import datetime
import uuid


class ApplicationCreate(BaseModel):
    job_id: uuid.UUID
    resume_id: uuid.UUID | None = None
    cover_letter: str | None = None


class ApplicationResponse(BaseModel):
    model_config = {'from_attributes': True}

    id: uuid.UUID
    applicant_id: uuid.UUID
    job_id: uuid.UUID
    resume_id: uuid.UUID | None
    match_result_id: uuid.UUID | None
    status: str
    cover_letter: str | None
    rejection_reason: str | None = None
    recruiter_notes: str | None = None
    created_at: datetime
    updated_at: datetime


class ApplicationWithJobResponse(ApplicationResponse):
    job_title: str
    company: str
    location: str | None
    match_score: float | None


class ApplicationStatusUpdate(BaseModel):
    status: str
    rejection_reason: str | None = None
    recruiter_notes: str | None = None
