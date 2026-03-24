from pydantic import BaseModel, Field
from typing import Any
import uuid


class ResumeCreate(BaseModel):
    title: str = 'My Resume'
    is_master: bool = False
    raw_text: str | None = None


class ResumeResponse(BaseModel):
    model_config = {'from_attributes': True}

    id: uuid.UUID
    owner_id: uuid.UUID
    title: str
    is_master: bool
    file_name: str | None
    file_url: str | None
    processing_status: str
    parsed_data: dict[str, Any] | None


class ResumeUploadResponse(BaseModel):
    resume_id: uuid.UUID
    task_id: str
    message: str = 'Resume uploaded and queued for processing'
