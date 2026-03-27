from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.core.security import get_current_user
from app.models.match import MatchResult, SkillGap
from app.models.resume import Resume
from pydantic import BaseModel
import uuid

router = APIRouter()


class SkillGapDashboardResponse(BaseModel):
    skill: str
    current: int
    required: int
    gap: int


@router.get('/me', response_model=list[SkillGapDashboardResponse])
async def get_my_skill_gaps(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = uuid.UUID(current_user['id'])

    # Find all skill gaps from match results where the resume belongs to the user
    stmt = (
        select(SkillGap)
        .join(MatchResult, SkillGap.match_result_id == MatchResult.id)
        .join(Resume, MatchResult.resume_id == Resume.id)
        .where(Resume.owner_id == user_id)
        .order_by(SkillGap.id.desc())
        .limit(50)  # arbitrary limit to avoid massive lists
    )

    result = await db.execute(stmt)
    gaps = result.scalars().all()

    # Deduplicate by skill name (keep the most recent / highest gap)
    unique_gaps = {}
    for gap in gaps:
        if gap.skill_name not in unique_gaps:
            unique_gaps[gap.skill_name] = gap

    response = []
    for gap in unique_gaps.values():
        current = 0
        required = 0

        # Heuristic mapping since DB does not store exact percentages for required/current
        if gap.gap_type == 'missing':
            current = 0
            if gap.importance == 'high':
                required = 90
            elif gap.importance == 'medium':
                required = 70
            else:
                required = 50
        elif gap.gap_type == 'partial':
            if gap.importance == 'high':
                current = 40
                required = 80
            else:
                current = 50
                required = 70
        else:
            current = 80
            required = 100

        gap_value = required - current

        response.append(
            SkillGapDashboardResponse(
                skill=gap.skill_name,
                current=current,
                required=required,
                gap=gap_value,
            )
        )

    # Sort completely missing / highest gaps first
    response.sort(key=lambda x: x.gap, reverse=True)

    return response
