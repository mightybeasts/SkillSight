from pydantic import BaseModel, Field
from app.models.job import JobType, ExperienceLevel, JobStatus
import uuid


class JobSkillInput(BaseModel):
    skill_name: str
    skill_category: str | None = None
    is_required: bool = True
    importance_weight: float = Field(default=1.0, ge=0.0, le=1.0)


class JobListingCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    company: str = Field(..., min_length=1, max_length=255)
    location: str | None = None
    is_remote: bool = False
    job_type: JobType = JobType.full_time
    experience_level: ExperienceLevel = ExperienceLevel.mid
    salary_min: float | None = None
    salary_max: float | None = None
    salary_currency: str = 'USD'
    description: str = Field(..., min_length=50)
    requirements: str | None = None
    responsibilities: str | None = None
    benefits: str | None = None
    skills: list[JobSkillInput] = []


class JobListingUpdate(BaseModel):
    title: str | None = None
    company: str | None = None
    location: str | None = None
    is_remote: bool | None = None
    job_type: JobType | None = None
    experience_level: ExperienceLevel | None = None
    salary_min: float | None = None
    salary_max: float | None = None
    salary_currency: str | None = None
    description: str | None = None
    requirements: str | None = None
    responsibilities: str | None = None
    benefits: str | None = None
    status: JobStatus | None = None
    skills: list[JobSkillInput] | None = None


class JobListingResponse(BaseModel):
    model_config = {'from_attributes': True}

    id: uuid.UUID
    recruiter_id: uuid.UUID
    title: str
    company: str
    location: str | None
    is_remote: bool
    job_type: JobType
    experience_level: ExperienceLevel
    salary_min: float | None
    salary_max: float | None
    salary_currency: str
    description: str
    requirements: str | None = None
    responsibilities: str | None = None
    benefits: str | None = None
    status: JobStatus
