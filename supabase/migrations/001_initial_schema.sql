-- SkillSight Initial Schema
-- Run order: this file is auto-loaded by postgres Docker init

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('job_seeker', 'recruiter', 'admin');

CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supabase_id VARCHAR(255) UNIQUE NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    full_name   VARCHAR(255),
    avatar_url  TEXT,
    role        user_role NOT NULL DEFAULT 'job_seeker',
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_supabase_id ON users(supabase_id);
CREATE INDEX idx_users_email ON users(email);

-- ─── User Profiles ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    headline     VARCHAR(255),
    bio          TEXT,
    location     VARCHAR(255),
    linkedin_url TEXT,
    github_url   TEXT,
    company_name VARCHAR(255),
    company_size VARCHAR(100),
    industry     VARCHAR(255),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Resumes ──────────────────────────────────────────────────────────────────
CREATE TYPE processing_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE IF NOT EXISTS resumes (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title             VARCHAR(255) NOT NULL DEFAULT 'My Resume',
    is_master         BOOLEAN NOT NULL DEFAULT FALSE,
    raw_text          TEXT,
    file_url          TEXT,
    file_name         VARCHAR(255),
    parsed_data       JSONB,
    embedding         vector(384),        -- all-MiniLM-L6-v2 dimensions
    processing_status processing_status NOT NULL DEFAULT 'pending',
    processing_error  TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resumes_owner_id ON resumes(owner_id);
CREATE INDEX idx_resumes_embedding ON resumes USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- ─── Resume Skills ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resume_skills (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resume_id            UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    skill_name           VARCHAR(255) NOT NULL,
    skill_category       VARCHAR(100),
    years_of_experience  FLOAT,
    proficiency_level    VARCHAR(50),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resume_skills_resume_id ON resume_skills(resume_id);

-- ─── Job Listings ─────────────────────────────────────────────────────────────
CREATE TYPE job_type AS ENUM ('full_time', 'part_time', 'contract', 'internship', 'freelance');
CREATE TYPE experience_level AS ENUM ('entry', 'mid', 'senior', 'lead', 'executive');
CREATE TYPE job_status AS ENUM ('draft', 'active', 'closed', 'paused');

CREATE TABLE IF NOT EXISTS job_listings (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recruiter_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title                 VARCHAR(255) NOT NULL,
    company               VARCHAR(255) NOT NULL,
    location              VARCHAR(255),
    is_remote             BOOLEAN NOT NULL DEFAULT FALSE,
    job_type              job_type NOT NULL DEFAULT 'full_time',
    experience_level      experience_level NOT NULL DEFAULT 'mid',
    salary_min            FLOAT,
    salary_max            FLOAT,
    salary_currency       VARCHAR(10) NOT NULL DEFAULT 'USD',
    description           TEXT NOT NULL,
    requirements          TEXT,
    responsibilities      TEXT,
    benefits              TEXT,
    parsed_requirements   JSONB,
    status                job_status NOT NULL DEFAULT 'active',
    embedding             vector(384),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_job_listings_recruiter_id ON job_listings(recruiter_id);
CREATE INDEX idx_job_listings_status ON job_listings(status);
CREATE INDEX idx_job_listings_embedding ON job_listings USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- ─── Job Skills ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_skills (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id            UUID NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
    skill_name        VARCHAR(255) NOT NULL,
    skill_category    VARCHAR(100),
    is_required       BOOLEAN NOT NULL DEFAULT TRUE,
    importance_weight FLOAT NOT NULL DEFAULT 1.0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_job_skills_job_id ON job_skills(job_id);

-- ─── Match Results ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS match_results (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resume_id        UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    job_id           UUID NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
    overall_score    FLOAT NOT NULL,
    semantic_score   FLOAT,
    skill_score      FLOAT,
    experience_score FLOAT,
    education_score  FLOAT,
    matched_skills   JSONB,
    partial_skills   JSONB,
    missing_skills   JSONB,
    explanation      TEXT,
    recruiter_rank   INTEGER,
    is_shortlisted   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(resume_id, job_id)
);

CREATE INDEX idx_match_results_resume_id ON match_results(resume_id);
CREATE INDEX idx_match_results_job_id ON match_results(job_id);
CREATE INDEX idx_match_results_overall_score ON match_results(overall_score DESC);

-- ─── Skill Gaps ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skill_gaps (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_result_id UUID NOT NULL REFERENCES match_results(id) ON DELETE CASCADE,
    skill_name      VARCHAR(255) NOT NULL,
    skill_category  VARCHAR(100),
    importance      VARCHAR(50) NOT NULL DEFAULT 'medium',
    gap_type        VARCHAR(50) NOT NULL DEFAULT 'missing',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Learning Recommendations ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS learning_recommendations (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_result_id   UUID NOT NULL REFERENCES match_results(id) ON DELETE CASCADE,
    skill_gap_id      UUID REFERENCES skill_gaps(id) ON DELETE SET NULL,
    skill_name        VARCHAR(255) NOT NULL,
    resource_type     VARCHAR(50),
    resource_title    VARCHAR(500) NOT NULL,
    resource_provider VARCHAR(255),
    resource_url      TEXT,
    estimated_hours   INTEGER,
    priority          INTEGER NOT NULL DEFAULT 1,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Applications ─────────────────────────────────────────────────────────────
CREATE TYPE application_status AS ENUM
    ('applied', 'screening', 'shortlisted', 'interview', 'offer', 'rejected', 'withdrawn');

CREATE TABLE IF NOT EXISTS applications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    applicant_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id          UUID NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
    resume_id       UUID REFERENCES resumes(id) ON DELETE SET NULL,
    match_result_id UUID REFERENCES match_results(id) ON DELETE SET NULL,
    status          application_status NOT NULL DEFAULT 'applied',
    cover_letter    TEXT,
    recruiter_notes TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(applicant_id, job_id)
);

-- ─── Auto-update updated_at trigger ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','user_profiles','resumes','job_listings','match_results','applications']
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      t, t
    );
  END LOOP;
END $$;
