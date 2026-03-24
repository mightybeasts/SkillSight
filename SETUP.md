# SkillSight — Setup Guide

## Prerequisites
- Docker Desktop (Windows)
- Node.js 20+
- Python 3.11+
- Git

---

## 1. Clone & Configure

```bash
git clone https://github.com/YOUR_USERNAME/skillsight.git
cd skillsight

# Copy env file and fill in your values
cp .env.example .env
```

### Required .env values to fill in:
1. **Supabase** — Create free project at [supabase.com](https://supabase.com)
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - Enable Google OAuth in Supabase Auth → Providers
   - Create `resumes` storage bucket (public)

2. **Google OAuth** — [console.cloud.google.com](https://console.cloud.google.com)
   - Create OAuth 2.0 credentials
   - Add `http://localhost:3000/auth/callback` as redirect URI
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

3. **NEXT_PUBLIC_** and **EXPO_PUBLIC_** vars — same values as above

---

## 2. Start with Docker Compose

```bash
# Start all services (first run downloads ~2GB AI models)
docker compose up --build

# Services will be available at:
# Web app:     http://localhost:3000
# API docs:    http://localhost:8000/docs
# Celery UI:   http://localhost:5555
# Nginx:       http://localhost:80
```

**First startup takes 5–10 minutes** — downloading sentence-transformers model (~90MB) and spaCy model.

---

## 3. Set Up GitHub Actions Self-Hosted Runner

This enables auto-deploy to your local Docker Desktop on every push to `main`.

```bash
# On your machine, go to:
# GitHub repo → Settings → Actions → Runners → New self-hosted runner

# Follow the instructions — roughly:
mkdir actions-runner && cd actions-runner
# Download runner (GitHub provides the exact command)
./config.sh --url https://github.com/YOUR_USERNAME/skillsight --token YOUR_TOKEN
./run.sh  # or install as Windows service
```

### Required GitHub Secrets
Go to repo → Settings → Secrets → Actions:
- `GITHUB_TOKEN` is automatic (no setup needed)

---

## 4. Install Dependencies (for local dev without Docker)

```bash
# Root (Turborepo)
npm install

# Web
cd apps/web && npm install

# Mobile
cd apps/mobile && npm install

# API
cd services/api
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

---

## 5. Run Mobile App (Expo)

```bash
cd apps/mobile
npx expo start

# Scan QR with Expo Go app on your phone
# Or press 'a' for Android emulator, 'i' for iOS simulator
```

---

## Architecture Summary

```
User → Nginx (:80)
         ├── / → Next.js Web (:3000)
         └── /api/ → FastAPI (:8000)
                         └── Redis → Celery Worker
                                         └── PostgreSQL+pgvector
```

## AI Pipeline

```
PDF Upload → PyMuPDF (text extraction)
          → spaCy NER (entities, skills)
          → sentence-transformers (384-dim embeddings → pgvector)
          → Cosine similarity + skill overlap → Match Score (0–100%)
          → Explainable breakdown (matched/partial/missing skills)
          → Learning recommendations
```
