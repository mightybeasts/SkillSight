"""
NLP service using spaCy for Named Entity Recognition and skill extraction.
Handles extracting structured data from raw resume/job description text.
"""
import spacy
from spacy.language import Language
from app.core.config import settings
from loguru import logger
from functools import lru_cache
import re


# ─── Curated skill taxonomy (extendable) ─────────────────────────────────────
SKILL_TAXONOMY = {
    'programming_languages': [
        'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'go', 'rust',
        'swift', 'kotlin', 'ruby', 'php', 'scala', 'r', 'matlab', 'sql',
    ],
    'frameworks': [
        'react', 'next.js', 'vue', 'angular', 'node.js', 'express', 'fastapi',
        'django', 'flask', 'spring', 'laravel', 'rails', 'flutter', 'react native',
        'expo', 'tailwindcss', 'graphql', 'rest api',
    ],
    'databases': [
        'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'sqlite',
        'cassandra', 'dynamodb', 'firebase', 'supabase', 'neo4j',
    ],
    'cloud_devops': [
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'ci/cd', 'github actions',
        'terraform', 'jenkins', 'nginx', 'linux', 'git',
    ],
    'ai_ml': [
        'machine learning', 'deep learning', 'nlp', 'computer vision', 'pytorch',
        'tensorflow', 'scikit-learn', 'huggingface', 'transformers', 'langchain',
        'llm', 'generative ai', 'data science', 'pandas', 'numpy',
    ],
    'soft_skills': [
        'leadership', 'communication', 'teamwork', 'problem solving', 'agile',
        'scrum', 'project management', 'mentoring', 'collaboration',
    ],
}

ALL_SKILLS = {
    skill: category
    for category, skills in SKILL_TAXONOMY.items()
    for skill in skills
}


@lru_cache(maxsize=1)
def _load_nlp() -> Language:
    logger.info(f'Loading spaCy model: {settings.SPACY_MODEL}')
    nlp = spacy.load(settings.SPACY_MODEL)
    logger.info('spaCy model loaded successfully')
    return nlp


class NLPService:
    def __init__(self):
        self._nlp: Language | None = None

    @property
    def nlp(self) -> Language:
        if self._nlp is None:
            self._nlp = _load_nlp()
        return self._nlp

    def extract_skills(self, text: str) -> list[dict]:
        """
        Extract skills from text using taxonomy matching + NER.
        Returns list of { skill_name, skill_category, context }.
        """
        text_lower = text.lower()
        found_skills = []
        seen = set()

        for skill, category in ALL_SKILLS.items():
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text_lower):
                if skill not in seen:
                    seen.add(skill)
                    found_skills.append({
                        'skill_name': skill,
                        'skill_category': category,
                    })

        return found_skills

    def extract_entities(self, text: str) -> dict:
        """
        Use spaCy NER to extract person names, organizations, locations, dates.
        """
        doc = self.nlp(text[:50_000])  # Limit to avoid memory issues
        entities = {
            'persons': [],
            'organizations': [],
            'locations': [],
            'dates': [],
        }
        for ent in doc.ents:
            if ent.label_ == 'PERSON' and ent.text not in entities['persons']:
                entities['persons'].append(ent.text)
            elif ent.label_ == 'ORG' and ent.text not in entities['organizations']:
                entities['organizations'].append(ent.text)
            elif ent.label_ in ('GPE', 'LOC') and ent.text not in entities['locations']:
                entities['locations'].append(ent.text)
            elif ent.label_ == 'DATE' and ent.text not in entities['dates']:
                entities['dates'].append(ent.text)

        return entities

    def extract_years_of_experience(self, text: str) -> int | None:
        """Heuristic extraction of years of experience from text."""
        patterns = [
            r'(\d+)\+?\s*years?\s*of\s*experience',
            r'(\d+)\+?\s*yrs?\s*of\s*experience',
            r'experience\s*of\s*(\d+)\+?\s*years?',
        ]
        for pattern in patterns:
            match = re.search(pattern, text.lower())
            if match:
                return int(match.group(1))
        return None

    def extract_email(self, text: str) -> str | None:
        match = re.search(r'[\w.+-]+@[\w-]+\.[\w.]+', text)
        return match.group(0) if match else None

    def extract_phone(self, text: str) -> str | None:
        match = re.search(r'[\+\(]?[1-9][0-9 .\-\(\)]{8,}[0-9]', text)
        return match.group(0).strip() if match else None

    def parse_resume_sections(self, text: str) -> dict:
        """
        Heuristically split resume text into sections.
        Returns { summary, experience, education, skills, certifications }
        """
        sections: dict[str, str] = {}
        current_section = 'header'
        current_lines: list[str] = []

        section_keywords = {
            'summary': ['summary', 'objective', 'about', 'profile'],
            'experience': ['experience', 'work history', 'employment', 'career'],
            'education': ['education', 'academic', 'qualification', 'degree'],
            'skills': ['skills', 'technical skills', 'competencies', 'technologies'],
            'certifications': ['certification', 'certificate', 'licenses', 'awards'],
            'projects': ['projects', 'portfolio'],
        }

        for line in text.split('\n'):
            line_lower = line.strip().lower()
            matched_section = None

            for section, keywords in section_keywords.items():
                if any(kw in line_lower for kw in keywords) and len(line.strip()) < 60:
                    matched_section = section
                    break

            if matched_section:
                if current_lines:
                    sections[current_section] = '\n'.join(current_lines).strip()
                current_section = matched_section
                current_lines = []
            else:
                current_lines.append(line)

        if current_lines:
            sections[current_section] = '\n'.join(current_lines).strip()

        return sections

    def compute_skill_overlap(
        self,
        resume_skills: list[str],
        job_skills: list[dict],  # [{ skill_name, is_required, importance_weight }]
    ) -> dict:
        """
        Compare resume skills vs job required skills.
        Returns { matched, partial, missing, skill_score }
        """
        resume_set = {s.lower() for s in resume_skills}
        matched = []
        partial = []
        missing = []

        total_weight = sum(js.get('importance_weight', 1.0) for js in job_skills)
        earned_weight = 0.0

        for js in job_skills:
            skill = js['skill_name'].lower()
            weight = js.get('importance_weight', 1.0)

            # Exact match
            if skill in resume_set:
                matched.append({'skill_name': js['skill_name'], 'weight': weight})
                earned_weight += weight
            else:
                # Partial match — check if any resume skill contains this skill or vice versa
                partial_match = any(
                    skill in rs or rs in skill
                    for rs in resume_set
                    if len(rs) > 2
                )
                if partial_match:
                    partial.append({'skill_name': js['skill_name'], 'weight': weight})
                    earned_weight += weight * 0.5
                else:
                    missing.append({
                        'skill_name': js['skill_name'],
                        'is_required': js.get('is_required', True),
                        'weight': weight,
                        'importance': 'critical' if js.get('is_required', True) else 'medium',
                    })

        skill_score = (earned_weight / total_weight) if total_weight > 0 else 0.0

        return {
            'matched': matched,
            'partial': partial,
            'missing': missing,
            'skill_score': round(float(skill_score), 3),
        }


nlp_service = NLPService()
