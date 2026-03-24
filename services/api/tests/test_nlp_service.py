"""Basic tests for the NLP service — no external dependencies needed."""
import pytest
from app.services.nlp_service import NLPService


@pytest.fixture
def nlp():
    return NLPService()


def test_extract_skills_finds_python(nlp):
    text = "I have 5 years of Python and React development experience."
    skills = nlp.extract_skills(text)
    skill_names = [s['skill_name'] for s in skills]
    assert 'python' in skill_names
    assert 'react' in skill_names


def test_extract_email(nlp):
    text = "Contact me at john.doe@example.com for more info."
    assert nlp.extract_email(text) == 'john.doe@example.com'


def test_extract_years_of_experience(nlp):
    text = "I have 7 years of experience in software development."
    assert nlp.extract_years_of_experience(text) == 7


def test_skill_overlap_matched(nlp):
    resume_skills = ['python', 'docker', 'postgresql']
    job_skills = [
        {'skill_name': 'python', 'is_required': True, 'importance_weight': 1.0},
        {'skill_name': 'docker', 'is_required': True, 'importance_weight': 0.8},
        {'skill_name': 'kubernetes', 'is_required': False, 'importance_weight': 0.5},
    ]
    result = nlp.compute_skill_overlap(resume_skills, job_skills)
    assert len(result['matched']) == 2
    assert len(result['missing']) == 1
    assert result['skill_score'] > 0.7
