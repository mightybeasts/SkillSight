from fastapi import APIRouter
from app.api.v1.endpoints import auth, resumes, jobs, matches, users, recruiter, applications, skill_gaps, learning

api_router = APIRouter()

api_router.include_router(auth.router, prefix='/auth', tags=['Authentication'])
api_router.include_router(users.router, prefix='/users', tags=['Users'])
api_router.include_router(resumes.router, prefix='/resumes', tags=['Resumes'])
api_router.include_router(jobs.router, prefix='/jobs', tags=['Jobs'])
api_router.include_router(matches.router, prefix='/matches', tags=['Matching'])
api_router.include_router(recruiter.router, prefix='/recruiter', tags=['Recruiter'])
api_router.include_router(applications.router, prefix='/applications', tags=['Applications'])
api_router.include_router(skill_gaps.router, prefix='/skill-gaps', tags=['Skill Gaps'])
api_router.include_router(learning.router, prefix='/learning', tags=['Learning'])
