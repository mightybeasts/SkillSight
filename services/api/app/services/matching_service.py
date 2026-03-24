"""
Core job matching service.
Combines semantic embedding similarity + skill overlap + experience scoring
to produce a transparent, explainable match score.
"""
from app.services.embedding_service import embedding_service
from app.services.nlp_service import nlp_service
from loguru import logger
from dataclasses import dataclass


@dataclass
class MatchScore:
    overall_score: float       # 0.0 – 1.0
    semantic_score: float      # embedding cosine similarity
    skill_score: float         # direct skill match ratio
    experience_score: float    # years of experience alignment
    education_score: float     # education level alignment

    matched_skills: list[dict]
    partial_skills: list[dict]
    missing_skills: list[dict]
    explanation: str


# Score weights — total must equal 1.0
WEIGHTS = {
    'semantic': 0.35,
    'skills': 0.40,
    'experience': 0.15,
    'education': 0.10,
}


class MatchingService:
    def compute_match(
        self,
        resume_text: str,
        resume_skills: list[str],
        resume_embedding: list[float] | None,
        job_description: str,
        job_skills: list[dict],
        job_embedding: list[float] | None,
        required_experience_years: int | None = None,
        candidate_experience_years: int | None = None,
    ) -> MatchScore:
        """
        Compute full explainable match score between a resume and a job listing.
        """
        # ── 1. Semantic similarity ─────────────────────────────────────────
        if resume_embedding and job_embedding:
            semantic_score = embedding_service.similarity(resume_embedding, job_embedding)
        else:
            # Fallback: encode on-the-fly
            logger.info('Embeddings not pre-computed, encoding on the fly')
            r_emb = embedding_service.encode(resume_text[:8000])
            j_emb = embedding_service.encode(job_description[:8000])
            semantic_score = embedding_service.similarity(r_emb, j_emb)

        # ── 2. Skill overlap ───────────────────────────────────────────────
        skill_analysis = nlp_service.compute_skill_overlap(resume_skills, job_skills)
        skill_score = skill_analysis['skill_score']

        # ── 3. Experience score ────────────────────────────────────────────
        experience_score = self._compute_experience_score(
            candidate_experience_years, required_experience_years
        )

        # ── 4. Education score (simple heuristic for now) ─────────────────
        education_score = self._compute_education_score(resume_text, job_description)

        # ── 5. Weighted overall score ──────────────────────────────────────
        overall_score = (
            semantic_score * WEIGHTS['semantic']
            + skill_score * WEIGHTS['skills']
            + experience_score * WEIGHTS['experience']
            + education_score * WEIGHTS['education']
        )
        overall_score = round(min(1.0, max(0.0, overall_score)), 3)

        # ── 6. Generate explanation ────────────────────────────────────────
        explanation = self._generate_explanation(
            overall_score=overall_score,
            semantic_score=semantic_score,
            skill_score=skill_score,
            matched=skill_analysis['matched'],
            partial=skill_analysis['partial'],
            missing=skill_analysis['missing'],
        )

        return MatchScore(
            overall_score=overall_score,
            semantic_score=round(semantic_score, 3),
            skill_score=round(skill_score, 3),
            experience_score=round(experience_score, 3),
            education_score=round(education_score, 3),
            matched_skills=skill_analysis['matched'],
            partial_skills=skill_analysis['partial'],
            missing_skills=skill_analysis['missing'],
            explanation=explanation,
        )

    def _compute_experience_score(
        self,
        candidate_years: int | None,
        required_years: int | None,
    ) -> float:
        if required_years is None or candidate_years is None:
            return 0.7  # neutral if unknown
        if candidate_years >= required_years:
            return 1.0
        ratio = candidate_years / required_years
        return round(min(1.0, ratio), 3)

    def _compute_education_score(self, resume_text: str, job_text: str) -> float:
        """Heuristic education matching."""
        edu_levels = {
            'phd': 4, 'doctorate': 4,
            'master': 3, 'msc': 3, 'mba': 3,
            'bachelor': 2, 'bsc': 2, 'degree': 2,
            'diploma': 1, 'certificate': 1,
        }
        resume_lower = resume_text.lower()
        job_lower = job_text.lower()

        resume_level = max(
            (level for kw, level in edu_levels.items() if kw in resume_lower),
            default=0,
        )
        required_level = max(
            (level for kw, level in edu_levels.items() if kw in job_lower),
            default=0,
        )

        if required_level == 0:
            return 1.0  # No requirement stated
        if resume_level >= required_level:
            return 1.0
        return round(resume_level / required_level, 3)

    def _generate_explanation(
        self,
        overall_score: float,
        semantic_score: float,
        skill_score: float,
        matched: list,
        partial: list,
        missing: list,
    ) -> str:
        """Generate a human-readable match explanation."""
        pct = int(overall_score * 100)
        matched_names = [s['skill_name'] for s in matched[:5]]
        missing_critical = [
            s['skill_name'] for s in missing if s.get('is_required', True)
        ][:5]

        lines = [f'Overall Match: {pct}%\n']

        if pct >= 80:
            lines.append('Strong match — this candidate closely aligns with the role.')
        elif pct >= 60:
            lines.append('Good match — candidate meets most requirements with some gaps.')
        elif pct >= 40:
            lines.append('Partial match — candidate meets some requirements but has notable gaps.')
        else:
            lines.append('Low match — significant skill or experience gaps identified.')

        if matched_names:
            lines.append(f'\nMatched skills: {", ".join(matched_names)}')
        if partial:
            partial_names = [s['skill_name'] for s in partial[:3]]
            lines.append(f'Partial matches: {", ".join(partial_names)}')
        if missing_critical:
            lines.append(f'Missing critical skills: {", ".join(missing_critical)}')

        lines.append(
            f'\nScore breakdown — Semantic: {int(semantic_score*100)}%, '
            f'Skills: {int(skill_score*100)}%'
        )

        return '\n'.join(lines)

    def generate_learning_recommendations(
        self, missing_skills: list[dict]
    ) -> list[dict]:
        """
        Generate learning recommendations for missing skills.
        Uses a curated resource map + skill priority ordering.
        """
        # Curated resource map (extend with real URLs / API call to course provider)
        resource_map = {
            'python': [
                {'title': 'Python for Everybody', 'provider': 'Coursera', 'type': 'course', 'hours': 30},
                {'title': 'Automate the Boring Stuff with Python', 'provider': 'Free', 'type': 'book', 'hours': 20},
            ],
            'react': [
                {'title': 'React - The Complete Guide', 'provider': 'Udemy', 'type': 'course', 'hours': 40},
            ],
            'machine learning': [
                {'title': 'Machine Learning Specialization', 'provider': 'Coursera/DeepLearning.AI', 'type': 'course', 'hours': 60},
            ],
            'docker': [
                {'title': 'Docker & Kubernetes: The Practical Guide', 'provider': 'Udemy', 'type': 'course', 'hours': 25},
            ],
            'aws': [
                {'title': 'AWS Certified Solutions Architect', 'provider': 'AWS', 'type': 'certification', 'hours': 80},
            ],
            'sql': [
                {'title': 'The Complete SQL Bootcamp', 'provider': 'Udemy', 'type': 'course', 'hours': 15},
            ],
        }

        recommendations = []
        for i, skill in enumerate(missing_skills[:8]):  # top 8 gaps
            skill_name = skill['skill_name'].lower()
            resources = resource_map.get(skill_name, [
                {
                    'title': f'Learn {skill["skill_name"]} — Search on Coursera or Udemy',
                    'provider': 'Online',
                    'type': 'course',
                    'hours': None,
                }
            ])
            for resource in resources[:1]:  # 1 resource per skill
                recommendations.append({
                    'skill_name': skill['skill_name'],
                    'resource_type': resource['type'],
                    'resource_title': resource['title'],
                    'resource_provider': resource['provider'],
                    'estimated_hours': resource.get('hours'),
                    'priority': i + 1,
                })

        return recommendations


matching_service = MatchingService()
