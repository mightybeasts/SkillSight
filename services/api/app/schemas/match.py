from pydantic import BaseModel
import uuid


class MatchRequest(BaseModel):
    resume_id: uuid.UUID
    job_id: uuid.UUID


class SkillDetail(BaseModel):
    skill_name: str
    weight: float | None = None
    is_required: bool | None = None
    importance: str | None = None


class MatchResultResponse(BaseModel):
    model_config = {'from_attributes': True}

    id: uuid.UUID
    resume_id: uuid.UUID
    job_id: uuid.UUID
    overall_score: float
    semantic_score: float
    skill_score: float
    experience_score: float
    education_score: float
    matched_skills: list | None
    partial_skills: list | None
    missing_skills: list | None
    explanation: str | None
    is_shortlisted: bool


class SkillGapResponse(BaseModel):
    model_config = {'from_attributes': True}

    id: uuid.UUID
    skill_name: str
    skill_category: str | None
    importance: str
    gap_type: str


class LearningRecommendationResponse(BaseModel):
    model_config = {'from_attributes': True}

    id: uuid.UUID
    skill_name: str
    resource_type: str
    resource_title: str
    resource_provider: str | None
    resource_url: str | None
    estimated_hours: int | None
    priority: int


class FullMatchAnalysis(BaseModel):
    match_result: MatchResultResponse
    skill_gaps: list[SkillGapResponse]
    recommendations: list[LearningRecommendationResponse]


class MatchScoreSummary(BaseModel):
    model_config = {'from_attributes': True}

    job_id: uuid.UUID
    resume_id: uuid.UUID
    overall_score: float


class MyMatchScoresResponse(BaseModel):
    resume_id: uuid.UUID | None
    scores: list[MatchScoreSummary]
