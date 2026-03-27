from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.api.v1.router import api_router
from app.db.database import engine, Base
from loguru import logger
import sys

# ─── Logging setup ───────────────────────────────────────────────────────────
logger.remove()
logger.add(
    sys.stdout,
    format='<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level}</level> | {message}',
    level='DEBUG' if settings.is_development else 'INFO',
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info(f'Starting {settings.APP_NAME} v{settings.APP_VERSION}')
    logger.info(f'Environment: {settings.ENVIRONMENT}')

    # Create DB tables on startup (use Alembic in production)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Manual migration: add rejection_reason column if missing
    from sqlalchemy import text
    async with engine.begin() as conn:
        try:
            await conn.execute(text(
                "ALTER TABLE applications ADD COLUMN IF NOT EXISTS rejection_reason TEXT"
            ))
            logger.info('Migration check: rejection_reason column ensured')
        except Exception as e:
            logger.warning(f'Migration skip (may already exist): {e}')

    # Pre-load AI models to avoid cold start on first request
    from app.services.embedding_service import embedding_service
    from app.services.nlp_service import nlp_service
    _ = embedding_service.model
    _ = nlp_service.nlp
    logger.info('AI models loaded')

    yield

    logger.info('Shutting down...')
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        'SkillSight API — AI-powered resume analysis and job matching platform. '
        'Uses semantic NLP matching, explainable AI scoring, and skill-gap identification.'
    ),
    docs_url='/docs' if settings.is_development else None,
    redoc_url='/redoc' if settings.is_development else None,
    lifespan=lifespan,
)

# ─── Middleware ───────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ─── Routes ───────────────────────────────────────────────────────────────────
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get('/health', tags=['Health'])
async def health_check():
    return {
        'status': 'healthy',
        'version': settings.APP_VERSION,
        'environment': settings.ENVIRONMENT,
    }


@app.get('/', tags=['Root'])
async def root():
    return {
        'name': settings.APP_NAME,
        'version': settings.APP_VERSION,
        'docs': '/docs',
    }
