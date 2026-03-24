from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file='.env',
        env_file_encoding='utf-8',
        case_sensitive=False,
        extra='ignore',
    )

    # App
    APP_NAME: str = 'SkillSight API'
    APP_VERSION: str = '1.0.0'
    ENVIRONMENT: str = 'development'
    API_HOST: str = '0.0.0.0'
    API_PORT: int = 8000
    API_SECRET_KEY: str = 'change-me'
    API_V1_PREFIX: str = '/v1'

    # CORS
    ALLOWED_ORIGINS: str = 'http://localhost:3000,http://localhost:19006'

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(',')]

    # Database
    DATABASE_URL: str = 'postgresql+asyncpg://skillsight:skillsight_dev_password@postgres:5432/skillsight'

    # Redis / Celery
    REDIS_URL: str = 'redis://redis:6379/0'

    # Supabase
    SUPABASE_URL: str = ''
    SUPABASE_ANON_KEY: str = ''
    SUPABASE_SERVICE_ROLE_KEY: str = ''

    # AI Models
    EMBEDDING_MODEL: str = 'sentence-transformers/all-MiniLM-L6-v2'
    SPACY_MODEL: str = 'en_core_web_sm'
    MODEL_CACHE_DIR: str = '/app/.cache'

    # Optional Gemini fallback
    GEMINI_API_KEY: str = ''

    # File upload
    MAX_UPLOAD_SIZE_MB: int = 10

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == 'development'


settings = Settings()
