"""
Resume optimization service.
Generates a job-specific tailored resume from a master resume,
highlighting the most relevant skills and experience for the target role.
"""
from app.services.nlp_service import nlp_service
from app.services.embedding_service import embedding_service
from loguru import logger


class ResumeOptimizer:
    def generate_optimized_resume(
        self,
        master_resume_data: dict,
        job_title: str,
        job_description: str,
        job_skills: list[dict],
        match_result: dict,
    ) -> dict:
        """
        Generate a job-specific optimized resume from the master resume.

        master_resume_data structure:
        {
            name, email, phone, summary,
            experience: [{ title, company, duration, description, skills }],
            education: [{ degree, institution, year }],
            skills: [str],
            certifications: [str],
            projects: [{ title, description, skills }],
        }

        Returns optimized resume dict with tailoring suggestions.
        """
        job_skill_names = {js['skill_name'].lower() for js in job_skills}
        matched_skills = {s['skill_name'].lower() for s in match_result.get('matched_skills', [])}

        # ── 1. Prioritize relevant experience entries ─────────────────────
        scored_experience = []
        for exp in master_resume_data.get('experience', []):
            exp_text = f"{exp.get('title', '')} {exp.get('description', '')}"
            exp_skills = set(s.lower() for s in exp.get('skills', []))
            relevance = len(exp_skills & job_skill_names) / max(len(job_skill_names), 1)
            scored_experience.append({'entry': exp, 'relevance': relevance})

        scored_experience.sort(key=lambda x: x['relevance'], reverse=True)
        optimized_experience = [s['entry'] for s in scored_experience]

        # ── 2. Reorder skills — put matching skills first ──────────────────
        all_skills: list[str] = master_resume_data.get('skills', [])
        matched_first = [s for s in all_skills if s.lower() in matched_skills]
        rest = [s for s in all_skills if s.lower() not in matched_skills]
        optimized_skills = matched_first + rest

        # ── 3. Generate tailored summary suggestion ────────────────────────
        summary_suggestion = self._suggest_summary(
            original_summary=master_resume_data.get('summary', ''),
            job_title=job_title,
            matched_skills=list(matched_skills),
        )

        # ── 4. Highlight relevant projects ────────────────────────────────
        scored_projects = []
        for proj in master_resume_data.get('projects', []):
            proj_skills = set(s.lower() for s in proj.get('skills', []))
            relevance = len(proj_skills & job_skill_names) / max(len(job_skill_names), 1)
            scored_projects.append({'entry': proj, 'relevance': relevance})

        scored_projects.sort(key=lambda x: x['relevance'], reverse=True)

        # ── 5. Build tailoring suggestions ────────────────────────────────
        suggestions = self._build_suggestions(
            match_result=match_result,
            job_skill_names=job_skill_names,
            matched_skills=matched_skills,
        )

        return {
            'name': master_resume_data.get('name'),
            'email': master_resume_data.get('email'),
            'phone': master_resume_data.get('phone'),
            'summary': master_resume_data.get('summary'),
            'suggested_summary': summary_suggestion,
            'experience': optimized_experience,
            'education': master_resume_data.get('education', []),
            'skills': optimized_skills,
            'certifications': master_resume_data.get('certifications', []),
            'projects': [s['entry'] for s in scored_projects],
            'tailoring_suggestions': suggestions,
            'targeted_job': job_title,
        }

    def _suggest_summary(
        self,
        original_summary: str,
        job_title: str,
        matched_skills: list[str],
    ) -> str:
        """Generate a tailored summary hint."""
        top_skills = ', '.join(matched_skills[:4])
        return (
            f"Consider tailoring your summary to emphasize your expertise in {top_skills} "
            f"as they directly align with the {job_title} role. "
            f"Mention specific achievements and quantifiable impact where possible."
        )

    def _build_suggestions(
        self,
        match_result: dict,
        job_skill_names: set,
        matched_skills: set,
    ) -> list[str]:
        suggestions = []

        missing = match_result.get('missing_skills', [])
        if missing:
            critical = [s['skill_name'] for s in missing if s.get('is_required', True)][:3]
            if critical:
                suggestions.append(
                    f"Add these critical missing skills if you have experience: {', '.join(critical)}"
                )

        partial = match_result.get('partial_skills', [])
        if partial:
            partial_names = [s['skill_name'] for s in partial[:3]]
            suggestions.append(
                f"Expand on these partially matched skills with specific examples: {', '.join(partial_names)}"
            )

        suggestions.append(
            'Quantify your achievements (e.g., "Reduced deployment time by 40%") to strengthen impact.'
        )
        suggestions.append(
            'Use keywords from the job description naturally within your experience descriptions.'
        )

        return suggestions


resume_optimizer = ResumeOptimizer()
