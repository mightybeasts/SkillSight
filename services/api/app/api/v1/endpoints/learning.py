from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.core.security import get_current_user
from app.models.match import MatchResult, LearningRecommendation
from app.models.resume import Resume
from app.schemas.match import LearningRecommendationResponse
import uuid

router = APIRouter()


@router.get('/me', response_model=list[LearningRecommendationResponse])
async def get_my_learning_recommendations(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = uuid.UUID(current_user['id'])

    stmt = (
        select(LearningRecommendation)
        .join(MatchResult, LearningRecommendation.match_result_id == MatchResult.id)
        .join(Resume, MatchResult.resume_id == Resume.id)
        .where(Resume.owner_id == user_id)
        .order_by(LearningRecommendation.priority.asc())
        .limit(20)
    )

    result = await db.execute(stmt)
    recommendations = result.scalars().all()

    # Deduplicate by course URL or Title (prevent same course recommended multiple times for different matches)
    unique_recs = {}
    for rec in recommendations:
        key = rec.resource_url or rec.resource_title
        if key not in unique_recs:
            unique_recs[key] = rec

    return list(unique_recs.values())
