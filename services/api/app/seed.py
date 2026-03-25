"""
Seed script — populates the database with realistic sample data.
Run: docker compose exec api python -m app.seed
"""

import asyncio
import uuid
from sqlalchemy import text

# Use sync psycopg2 for seeding since asyncpg can be tricky for scripts
import psycopg2
import psycopg2.extras
import os
import json

DB_URL = os.environ.get(
    'DATABASE_URL',
    'postgresql+asyncpg://skillsight:skillsight_dev_password@postgres:5432/skillsight',
)
# Convert asyncpg URL to psycopg2
SYNC_URL = DB_URL.replace('postgresql+asyncpg://', 'postgresql://').replace('postgresql://', 'postgresql://')


def get_conn():
    url = SYNC_URL
    if url.startswith('postgresql+asyncpg://'):
        url = url.replace('postgresql+asyncpg://', 'postgresql://')
    return psycopg2.connect(url)


# ─── Fixed UUIDs for reproducibility ──────────────────────────────────────────
STUDENT_1_ID = uuid.UUID('a1000000-0000-0000-0000-000000000001')
STUDENT_2_ID = uuid.UUID('a1000000-0000-0000-0000-000000000002')
STUDENT_3_ID = uuid.UUID('a1000000-0000-0000-0000-000000000003')
RECRUITER_1_ID = uuid.UUID('b2000000-0000-0000-0000-000000000001')
RECRUITER_2_ID = uuid.UUID('b2000000-0000-0000-0000-000000000002')
UNIVERSITY_1_ID = uuid.UUID('c3000000-0000-0000-0000-000000000001')

RESUME_1_ID = uuid.UUID('d4000000-0000-0000-0000-000000000001')
RESUME_2_ID = uuid.UUID('d4000000-0000-0000-0000-000000000002')
RESUME_3_ID = uuid.UUID('d4000000-0000-0000-0000-000000000003')
RESUME_4_ID = uuid.UUID('d4000000-0000-0000-0000-000000000004')
RESUME_5_ID = uuid.UUID('d4000000-0000-0000-0000-000000000005')

JOB_1_ID = uuid.UUID('e5000000-0000-0000-0000-000000000001')
JOB_2_ID = uuid.UUID('e5000000-0000-0000-0000-000000000002')
JOB_3_ID = uuid.UUID('e5000000-0000-0000-0000-000000000003')
JOB_4_ID = uuid.UUID('e5000000-0000-0000-0000-000000000004')
JOB_5_ID = uuid.UUID('e5000000-0000-0000-0000-000000000005')
JOB_6_ID = uuid.UUID('e5000000-0000-0000-0000-000000000006')

MATCH_1_ID = uuid.UUID('f6000000-0000-0000-0000-000000000001')
MATCH_2_ID = uuid.UUID('f6000000-0000-0000-0000-000000000002')
MATCH_3_ID = uuid.UUID('f6000000-0000-0000-0000-000000000003')
MATCH_4_ID = uuid.UUID('f6000000-0000-0000-0000-000000000004')
MATCH_5_ID = uuid.UUID('f6000000-0000-0000-0000-000000000005')


def seed():
    conn = get_conn()
    conn.autocommit = False
    cur = conn.cursor()
    psycopg2.extras.register_uuid()

    try:
        # ─── Clean existing seed data ─────────────────────────────────────
        print('Cleaning existing seed data...')
        cur.execute("DELETE FROM learning_recommendations WHERE match_result_id IN (SELECT id FROM match_results WHERE id IN (%s,%s,%s,%s,%s))", (MATCH_1_ID, MATCH_2_ID, MATCH_3_ID, MATCH_4_ID, MATCH_5_ID))
        cur.execute("DELETE FROM skill_gaps WHERE match_result_id IN (SELECT id FROM match_results WHERE id IN (%s,%s,%s,%s,%s))", (MATCH_1_ID, MATCH_2_ID, MATCH_3_ID, MATCH_4_ID, MATCH_5_ID))
        cur.execute("DELETE FROM applications WHERE applicant_id IN (%s,%s,%s)", (STUDENT_1_ID, STUDENT_2_ID, STUDENT_3_ID))
        cur.execute("DELETE FROM match_results WHERE id IN (%s,%s,%s,%s,%s)", (MATCH_1_ID, MATCH_2_ID, MATCH_3_ID, MATCH_4_ID, MATCH_5_ID))
        cur.execute("DELETE FROM job_skills WHERE job_id IN (%s,%s,%s,%s,%s,%s)", (JOB_1_ID, JOB_2_ID, JOB_3_ID, JOB_4_ID, JOB_5_ID, JOB_6_ID))
        cur.execute("DELETE FROM resume_skills WHERE resume_id IN (%s,%s,%s,%s,%s)", (RESUME_1_ID, RESUME_2_ID, RESUME_3_ID, RESUME_4_ID, RESUME_5_ID))
        cur.execute("DELETE FROM resumes WHERE id IN (%s,%s,%s,%s,%s)", (RESUME_1_ID, RESUME_2_ID, RESUME_3_ID, RESUME_4_ID, RESUME_5_ID))
        cur.execute("DELETE FROM job_listings WHERE id IN (%s,%s,%s,%s,%s,%s)", (JOB_1_ID, JOB_2_ID, JOB_3_ID, JOB_4_ID, JOB_5_ID, JOB_6_ID))
        cur.execute("DELETE FROM user_profiles WHERE user_id IN (%s,%s,%s,%s,%s,%s)", (STUDENT_1_ID, STUDENT_2_ID, STUDENT_3_ID, RECRUITER_1_ID, RECRUITER_2_ID, UNIVERSITY_1_ID))
        cur.execute("DELETE FROM users WHERE id IN (%s,%s,%s,%s,%s,%s)", (STUDENT_1_ID, STUDENT_2_ID, STUDENT_3_ID, RECRUITER_1_ID, RECRUITER_2_ID, UNIVERSITY_1_ID))

        # ─── Users ────────────────────────────────────────────────────────
        print('Creating users...')
        users = [
            (STUDENT_1_ID, 'seed-student-1', 'aisha.khan@example.com', 'Aisha Khan', None, 'job_seeker'),
            (STUDENT_2_ID, 'seed-student-2', 'james.chen@example.com', 'James Chen', None, 'job_seeker'),
            (STUDENT_3_ID, 'seed-student-3', 'maria.garcia@example.com', 'Maria Garcia', None, 'job_seeker'),
            (RECRUITER_1_ID, 'seed-recruiter-1', 'sarah.johnson@techcorp.com', 'Sarah Johnson', None, 'recruiter'),
            (RECRUITER_2_ID, 'seed-recruiter-2', 'david.kim@innovate.io', 'David Kim', None, 'recruiter'),
            (UNIVERSITY_1_ID, 'seed-university-1', 'placement@stanford.edu', 'Dr. Emily Watson', None, 'admin'),
        ]
        cur.executemany(
            "INSERT INTO users (id, supabase_id, email, full_name, avatar_url, role) VALUES (%s, %s, %s, %s, %s, %s::user_role)",
            users,
        )

        # ─── User Profiles ───────────────────────────────────────────────
        print('Creating profiles...')
        profiles = [
            (uuid.uuid4(), STUDENT_1_ID, 'Full Stack Developer | CS Graduate', 'Passionate about building web applications with React and Python. Looking for full-time roles in software engineering.', 'San Francisco, CA', None, None, None, None, None),
            (uuid.uuid4(), STUDENT_2_ID, 'Data Science Enthusiast | ML Engineer', 'Masters student specializing in NLP and computer vision. Published researcher with industry experience.', 'New York, NY', None, None, None, None, None),
            (uuid.uuid4(), STUDENT_3_ID, 'UX/UI Designer & Frontend Developer', 'Creative designer with strong coding skills. 2 years experience in startup environments.', 'Austin, TX', None, None, None, None, None),
            (uuid.uuid4(), RECRUITER_1_ID, 'Senior Technical Recruiter', 'Building world-class engineering teams at TechCorp for 8 years.', 'San Francisco, CA', None, None, 'TechCorp Inc.', '1000-5000', 'Technology'),
            (uuid.uuid4(), RECRUITER_2_ID, 'Head of Talent Acquisition', 'Scaling engineering teams at fast-growing startups.', 'Remote', None, None, 'Innovate.io', '50-200', 'SaaS'),
            (uuid.uuid4(), UNIVERSITY_1_ID, 'Director of Career Services', 'Helping students transition from academia to industry for over 15 years.', 'Stanford, CA', None, None, 'Stanford University', '5000+', 'Education'),
        ]
        cur.executemany(
            "INSERT INTO user_profiles (id, user_id, headline, bio, location, linkedin_url, github_url, company_name, company_size, industry) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
            profiles,
        )

        # ─── Resumes ─────────────────────────────────────────────────────
        print('Creating resumes...')
        resumes = [
            # Aisha's master resume
            (RESUME_1_ID, STUDENT_1_ID, 'Master Resume - Full Stack', True,
             '''Aisha Khan — Full Stack Developer
Contact: aisha.khan@example.com | San Francisco, CA | github.com/aishak

SUMMARY
Full-stack developer with 2+ years of experience building scalable web applications. Proficient in React, TypeScript, Node.js, Python, and cloud services. Strong foundation in computer science with a passion for clean architecture and user-centric design.

EXPERIENCE
Software Engineer Intern — Google, Mountain View, CA (Jun 2025 – Aug 2025)
• Built internal dashboard using React + TypeScript serving 500+ engineers
• Implemented REST API endpoints with Python Flask, reducing response time by 40%
• Wrote comprehensive unit tests achieving 95% code coverage
• Participated in code reviews and design discussions

Full Stack Developer — StartupXYZ, San Francisco, CA (Jan 2024 – May 2025)
• Developed e-commerce platform from scratch using Next.js, PostgreSQL, and Stripe
• Implemented real-time notifications using WebSocket and Redis
• Designed CI/CD pipeline with GitHub Actions, reducing deployment time by 60%
• Managed AWS infrastructure (EC2, S3, RDS, CloudFront)

EDUCATION
B.S. Computer Science — University of California, Berkeley (2021 – 2025)
GPA: 3.8/4.0 | Dean's List | ACM Club President

SKILLS
Languages: Python, TypeScript, JavaScript, SQL, HTML/CSS, Java
Frontend: React, Next.js, Tailwind CSS, Redux, Figma
Backend: Node.js, Express, FastAPI, Flask, Django
Database: PostgreSQL, MongoDB, Redis, DynamoDB
Cloud/DevOps: AWS, Docker, Kubernetes, GitHub Actions, Terraform
Other: Git, REST APIs, GraphQL, Agile/Scrum, TDD''',
             'Aisha_Khan_Resume.pdf',
             json.dumps({
                 'name': 'Aisha Khan',
                 'email': 'aisha.khan@example.com',
                 'phone': '+1-415-555-0101',
                 'location': 'San Francisco, CA',
                 'summary': 'Full-stack developer with 2+ years experience building scalable web applications.',
                 'experience': [
                     {'title': 'Software Engineer Intern', 'company': 'Google', 'duration': '3 months', 'location': 'Mountain View, CA'},
                     {'title': 'Full Stack Developer', 'company': 'StartupXYZ', 'duration': '1.5 years', 'location': 'San Francisco, CA'},
                 ],
                 'education': [{'degree': 'B.S. Computer Science', 'institution': 'UC Berkeley', 'gpa': '3.8/4.0'}],
                 'skills': ['Python', 'TypeScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL', 'AWS', 'Docker', 'FastAPI', 'Redis'],
             }),
             'completed'),

            # Aisha's targeted resume
            (RESUME_2_ID, STUDENT_1_ID, 'Resume - Frontend Focus', False,
             '''Aisha Khan — Frontend Engineer
Specialized React/Next.js developer with experience at Google. Focused on building performant, accessible user interfaces.''',
             'Aisha_Khan_Frontend.pdf',
             json.dumps({
                 'name': 'Aisha Khan',
                 'email': 'aisha.khan@example.com',
                 'summary': 'Frontend engineer specializing in React and Next.js',
                 'skills': ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Redux', 'Figma', 'Jest', 'Cypress'],
             }),
             'completed'),

            # James's resume
            (RESUME_3_ID, STUDENT_2_ID, 'Master Resume - Data Science', True,
             '''James Chen — Data Scientist & ML Engineer
Contact: james.chen@example.com | New York, NY

SUMMARY
Data scientist with expertise in NLP, computer vision, and deep learning. Published 3 papers in top-tier conferences. Experience building production ML pipelines processing 10M+ records daily.

EXPERIENCE
Machine Learning Engineer — Meta AI, New York, NY (May 2025 – Aug 2025)
• Fine-tuned LLaMA models for content classification achieving 92% accuracy
• Built data pipeline processing 50M daily interactions using Apache Spark
• Deployed models using TorchServe with <50ms inference latency

Research Assistant — NYU Center for Data Science (Sep 2023 – Present)
• Published paper on transformer-based NER at ACL 2025
• Developed novel attention mechanism improving BERT performance by 3.2%
• Mentored 5 undergraduate researchers

EDUCATION
M.S. Data Science — New York University (2023 – 2025) GPA: 3.9/4.0
B.S. Mathematics — MIT (2019 – 2023) GPA: 3.7/4.0

SKILLS
ML/AI: PyTorch, TensorFlow, Hugging Face, scikit-learn, spaCy, OpenCV
Languages: Python, R, SQL, Scala, Julia
Data: Pandas, NumPy, Apache Spark, Airflow, dbt
Cloud: AWS SageMaker, GCP Vertex AI, MLflow, Weights & Biases
Other: Docker, Git, A/B Testing, Statistical Analysis''',
             'James_Chen_Resume.pdf',
             json.dumps({
                 'name': 'James Chen',
                 'email': 'james.chen@example.com',
                 'summary': 'Data scientist with expertise in NLP, computer vision, and deep learning.',
                 'experience': [
                     {'title': 'ML Engineer Intern', 'company': 'Meta AI', 'duration': '4 months'},
                     {'title': 'Research Assistant', 'company': 'NYU Center for Data Science', 'duration': '2 years'},
                 ],
                 'education': [
                     {'degree': 'M.S. Data Science', 'institution': 'NYU', 'gpa': '3.9/4.0'},
                     {'degree': 'B.S. Mathematics', 'institution': 'MIT', 'gpa': '3.7/4.0'},
                 ],
                 'skills': ['Python', 'PyTorch', 'TensorFlow', 'NLP', 'Computer Vision', 'Spark', 'SQL', 'Docker', 'AWS SageMaker', 'Hugging Face'],
             }),
             'completed'),

            # Maria's resume
            (RESUME_4_ID, STUDENT_3_ID, 'Master Resume - UX/Frontend', True,
             '''Maria Garcia — UX/UI Designer & Frontend Developer
Contact: maria.garcia@example.com | Austin, TX

SUMMARY
Creative designer and frontend developer with 2 years of startup experience. Expertise in user research, prototyping, and building accessible interfaces. Passionate about design systems and component-driven development.

EXPERIENCE
UX Engineer — DesignStudio, Austin, TX (Mar 2024 – Present)
• Designed and built design system used across 4 products serving 100K+ users
• Conducted 30+ user interviews and usability tests, improving conversion by 25%
• Built interactive prototypes in Figma and implemented in React + Storybook

Frontend Developer — FreelanceXYZ (Jan 2023 – Feb 2024)
• Delivered 12 client projects including e-commerce, SaaS dashboards, and landing pages
• Specialized in responsive design, animations (Framer Motion), and accessibility (WCAG 2.1)

EDUCATION
B.F.A. Digital Design — University of Texas at Austin (2019 – 2023)
Minor: Computer Science | Cum Laude

SKILLS
Design: Figma, Adobe XD, Sketch, Illustrator, After Effects, Design Systems
Frontend: React, Next.js, TypeScript, Tailwind CSS, Framer Motion, Storybook
Other: HTML/CSS, JavaScript, Git, Responsive Design, Accessibility, User Research''',
             'Maria_Garcia_Resume.pdf',
             json.dumps({
                 'name': 'Maria Garcia',
                 'email': 'maria.garcia@example.com',
                 'summary': 'UX/UI designer and frontend developer with startup experience.',
                 'experience': [
                     {'title': 'UX Engineer', 'company': 'DesignStudio', 'duration': '1+ years'},
                     {'title': 'Frontend Developer', 'company': 'Freelance', 'duration': '1 year'},
                 ],
                 'education': [{'degree': 'B.F.A. Digital Design', 'institution': 'UT Austin'}],
                 'skills': ['Figma', 'React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'User Research', 'Design Systems', 'Framer Motion', 'Accessibility'],
             }),
             'completed'),

            # Maria's second resume
            (RESUME_5_ID, STUDENT_3_ID, 'Resume - Design Lead', False,
             'Maria Garcia — Design-focused resume for lead roles.',
             'Maria_Garcia_Design.pdf',
             json.dumps({'name': 'Maria Garcia', 'skills': ['Figma', 'Design Systems', 'User Research', 'Prototyping', 'Team Leadership']}),
             'completed'),
        ]
        cur.executemany(
            "INSERT INTO resumes (id, owner_id, title, is_master, raw_text, file_name, parsed_data, processing_status) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            resumes,
        )

        # ─── Resume Skills ───────────────────────────────────────────────
        print('Creating resume skills...')
        resume_skills = []
        aisha_skills = [
            ('Python', 'technical', 2.0, 'advanced'), ('TypeScript', 'technical', 2.0, 'advanced'),
            ('React', 'technical', 2.0, 'advanced'), ('Next.js', 'technical', 1.5, 'advanced'),
            ('Node.js', 'technical', 2.0, 'intermediate'), ('PostgreSQL', 'technical', 1.5, 'intermediate'),
            ('AWS', 'technical', 1.0, 'intermediate'), ('Docker', 'technical', 1.0, 'intermediate'),
            ('FastAPI', 'technical', 1.0, 'intermediate'), ('Redis', 'technical', 1.0, 'intermediate'),
            ('Git', 'technical', 2.0, 'advanced'), ('REST APIs', 'technical', 2.0, 'advanced'),
            ('Agile/Scrum', 'soft', 2.0, 'advanced'), ('Problem Solving', 'soft', None, 'advanced'),
        ]
        for skill_name, cat, yoe, level in aisha_skills:
            resume_skills.append((uuid.uuid4(), RESUME_1_ID, skill_name, cat, yoe, level))

        james_skills = [
            ('Python', 'technical', 4.0, 'expert'), ('PyTorch', 'technical', 3.0, 'advanced'),
            ('TensorFlow', 'technical', 2.0, 'advanced'), ('NLP', 'technical', 3.0, 'advanced'),
            ('Computer Vision', 'technical', 2.0, 'intermediate'), ('SQL', 'technical', 3.0, 'advanced'),
            ('Apache Spark', 'technical', 1.0, 'intermediate'), ('Docker', 'technical', 1.0, 'intermediate'),
            ('AWS SageMaker', 'technical', 1.0, 'intermediate'), ('Hugging Face', 'technical', 2.0, 'advanced'),
            ('Research', 'soft', None, 'expert'), ('Statistical Analysis', 'technical', 3.0, 'advanced'),
        ]
        for skill_name, cat, yoe, level in james_skills:
            resume_skills.append((uuid.uuid4(), RESUME_3_ID, skill_name, cat, yoe, level))

        maria_skills = [
            ('Figma', 'technical', 3.0, 'expert'), ('React', 'technical', 2.0, 'advanced'),
            ('Next.js', 'technical', 1.5, 'intermediate'), ('TypeScript', 'technical', 2.0, 'intermediate'),
            ('Tailwind CSS', 'technical', 2.0, 'advanced'), ('User Research', 'soft', 2.0, 'advanced'),
            ('Design Systems', 'technical', 2.0, 'advanced'), ('Framer Motion', 'technical', 1.0, 'intermediate'),
            ('Accessibility', 'technical', 1.5, 'advanced'), ('Storybook', 'technical', 1.0, 'intermediate'),
        ]
        for skill_name, cat, yoe, level in maria_skills:
            resume_skills.append((uuid.uuid4(), RESUME_4_ID, skill_name, cat, yoe, level))

        cur.executemany(
            "INSERT INTO resume_skills (id, resume_id, skill_name, skill_category, years_of_experience, proficiency_level) VALUES (%s, %s, %s, %s, %s, %s)",
            resume_skills,
        )

        # ─── Job Listings ─────────────────────────────────────────────────
        print('Creating job listings...')
        jobs = [
            (JOB_1_ID, RECRUITER_1_ID, 'Senior Full Stack Engineer', 'TechCorp Inc.', 'San Francisco, CA', False,
             'full_time', 'senior', 130000, 180000, 'USD',
             'We are looking for a Senior Full Stack Engineer to join our product team. You will build and scale our core platform serving millions of users. You will work closely with product managers, designers, and other engineers to deliver high-quality features.',
             'Requirements:\n- 4+ years of full-stack development experience\n- Strong proficiency in React/Next.js and TypeScript\n- Backend experience with Python or Node.js\n- Database design with PostgreSQL\n- Experience with cloud services (AWS preferred)\n- CI/CD and DevOps practices\n- Strong communication and collaboration skills',
             'Responsibilities:\n- Design and implement new features end-to-end\n- Write clean, tested, maintainable code\n- Mentor junior engineers\n- Participate in architecture decisions\n- On-call rotation (1 week/quarter)',
             'Benefits:\n- Competitive salary + equity\n- Health/dental/vision insurance\n- 401k match\n- Unlimited PTO\n- $5K annual learning budget',
             json.dumps({'required': ['React', 'TypeScript', 'Python', 'PostgreSQL', 'AWS'], 'nice_to_have': ['Docker', 'Kubernetes', 'GraphQL']}),
             'active'),

            (JOB_2_ID, RECRUITER_1_ID, 'Machine Learning Engineer', 'TechCorp Inc.', 'New York, NY', True,
             'full_time', 'mid', 140000, 190000, 'USD',
             'Join our AI team to build production ML systems that power our recommendation engine and content understanding pipeline. You will work on cutting-edge NLP and CV problems at scale.',
             'Requirements:\n- 3+ years ML engineering experience\n- Strong Python and PyTorch/TensorFlow\n- Experience with NLP or Computer Vision\n- Production ML pipeline experience\n- Statistical analysis and experimentation\n- MS/PhD in CS, ML, or related field preferred',
             'Responsibilities:\n- Design and train ML models\n- Build and maintain ML pipelines\n- Run A/B tests and analyze results\n- Collaborate with product and data teams',
             'Benefits:\n- Top-of-market compensation\n- Research publication support\n- GPU compute budget\n- Conference attendance',
             json.dumps({'required': ['Python', 'PyTorch', 'NLP', 'ML Pipelines', 'SQL'], 'nice_to_have': ['Spark', 'Kubernetes', 'MLflow']}),
             'active'),

            (JOB_3_ID, RECRUITER_1_ID, 'Junior Frontend Developer', 'TechCorp Inc.', 'Remote', True,
             'full_time', 'entry', 80000, 110000, 'USD',
             'Great opportunity for early-career developers! Join our frontend team to build beautiful, accessible user interfaces for our platform.',
             'Requirements:\n- 0-2 years of frontend experience\n- Proficiency in React and TypeScript\n- HTML/CSS expertise\n- Understanding of responsive design\n- Eagerness to learn and grow',
             'Responsibilities:\n- Build UI components with React\n- Implement designs from Figma\n- Write unit tests\n- Participate in code reviews',
             'Benefits:\n- Mentorship program\n- Learning stipend\n- Flexible hours\n- Remote-first',
             json.dumps({'required': ['React', 'TypeScript', 'HTML', 'CSS'], 'nice_to_have': ['Next.js', 'Tailwind CSS', 'Testing']}),
             'active'),

            (JOB_4_ID, RECRUITER_2_ID, 'UX Designer', 'Innovate.io', 'Austin, TX', False,
             'full_time', 'mid', 95000, 130000, 'USD',
             'We need a talented UX Designer to lead the design of our B2B SaaS platform. You will own the entire design process from research to high-fidelity prototypes.',
             'Requirements:\n- 3+ years UX design experience\n- Expert-level Figma skills\n- User research and usability testing\n- Design system experience\n- Basic frontend knowledge (HTML/CSS/React a plus)\n- Portfolio demonstrating problem-solving approach',
             'Responsibilities:\n- Conduct user research and interviews\n- Create wireframes, prototypes, and high-fidelity designs\n- Build and maintain design system\n- Collaborate with engineering team',
             'Benefits:\n- Creative freedom\n- Design tool budget\n- Conference attendance\n- 4-day work week option',
             json.dumps({'required': ['Figma', 'User Research', 'Design Systems', 'Prototyping'], 'nice_to_have': ['React', 'Accessibility', 'Motion Design']}),
             'active'),

            (JOB_5_ID, RECRUITER_2_ID, 'Data Analyst', 'Innovate.io', 'Remote', True,
             'full_time', 'entry', 70000, 95000, 'USD',
             'Looking for a Data Analyst to help us make data-driven decisions. You will build dashboards, analyze user behavior, and provide insights to the product team.',
             'Requirements:\n- 1+ years data analysis experience\n- Strong SQL skills\n- Python for data analysis (Pandas, NumPy)\n- Data visualization (Tableau, Looker, or similar)\n- Statistical knowledge\n- Excellent communication skills',
             'Responsibilities:\n- Build and maintain analytics dashboards\n- Analyze product metrics and user behavior\n- Present findings to stakeholders\n- Support A/B test analysis',
             'Benefits:\n- Fully remote\n- Flexible schedule\n- Learning budget',
             json.dumps({'required': ['SQL', 'Python', 'Data Visualization', 'Statistics'], 'nice_to_have': ['Tableau', 'dbt', 'Airflow']}),
             'active'),

            (JOB_6_ID, RECRUITER_2_ID, 'DevOps Engineer', 'Innovate.io', 'San Francisco, CA', True,
             'contract', 'senior', 150000, 200000, 'USD',
             'Contract role for an experienced DevOps engineer to help us migrate from monolith to microservices on Kubernetes.',
             'Requirements:\n- 5+ years DevOps/SRE experience\n- Expert Kubernetes and Docker\n- AWS or GCP cloud infrastructure\n- Terraform/Pulumi IaC\n- CI/CD pipeline design\n- Monitoring and observability',
             'Responsibilities:\n- Design microservices architecture\n- Set up Kubernetes clusters\n- Implement CI/CD pipelines\n- Establish monitoring and alerting',
             'Benefits:\n- Premium contract rate\n- Flexible hours\n- Potential full-time conversion',
             json.dumps({'required': ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'CI/CD'], 'nice_to_have': ['GCP', 'Prometheus', 'ArgoCD']}),
             'active'),
        ]
        cur.executemany(
            """INSERT INTO job_listings
            (id, recruiter_id, title, company, location, is_remote, job_type, experience_level,
             salary_min, salary_max, salary_currency, description, requirements, responsibilities,
             benefits, parsed_requirements, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s::job_type, %s::experience_level,
                    %s, %s, %s, %s, %s, %s, %s, %s, %s::job_status)""",
            jobs,
        )

        # ─── Job Skills ───────────────────────────────────────────────────
        print('Creating job skills...')
        job_skills = []
        # Job 1 - Senior Full Stack
        for skill, required in [('React', True), ('TypeScript', True), ('Python', True), ('PostgreSQL', True), ('AWS', True), ('Docker', False), ('Kubernetes', False), ('GraphQL', False), ('Node.js', True), ('CI/CD', True)]:
            job_skills.append((uuid.uuid4(), JOB_1_ID, skill, 'technical', required, 1.0 if required else 0.5))
        # Job 2 - ML Engineer
        for skill, required in [('Python', True), ('PyTorch', True), ('NLP', True), ('ML Pipelines', True), ('SQL', True), ('TensorFlow', False), ('Spark', False), ('Kubernetes', False), ('Statistics', True)]:
            job_skills.append((uuid.uuid4(), JOB_2_ID, skill, 'technical', required, 1.0 if required else 0.5))
        # Job 3 - Junior Frontend
        for skill, required in [('React', True), ('TypeScript', True), ('HTML', True), ('CSS', True), ('Next.js', False), ('Tailwind CSS', False), ('Jest', False)]:
            job_skills.append((uuid.uuid4(), JOB_3_ID, skill, 'technical', required, 1.0 if required else 0.5))
        # Job 4 - UX Designer
        for skill, required in [('Figma', True), ('User Research', True), ('Design Systems', True), ('Prototyping', True), ('React', False), ('Accessibility', False), ('Motion Design', False)]:
            job_skills.append((uuid.uuid4(), JOB_4_ID, skill, 'technical' if skill not in ['User Research'] else 'soft', required, 1.0 if required else 0.5))
        # Job 5 - Data Analyst
        for skill, required in [('SQL', True), ('Python', True), ('Data Visualization', True), ('Statistics', True), ('Tableau', False), ('dbt', False)]:
            job_skills.append((uuid.uuid4(), JOB_5_ID, skill, 'technical', required, 1.0 if required else 0.5))
        # Job 6 - DevOps
        for skill, required in [('Kubernetes', True), ('Docker', True), ('AWS', True), ('Terraform', True), ('CI/CD', True), ('GCP', False), ('Prometheus', False)]:
            job_skills.append((uuid.uuid4(), JOB_6_ID, skill, 'technical', required, 1.0 if required else 0.5))

        cur.executemany(
            "INSERT INTO job_skills (id, job_id, skill_name, skill_category, is_required, importance_weight) VALUES (%s, %s, %s, %s, %s, %s)",
            job_skills,
        )

        # ─── Match Results ────────────────────────────────────────────────
        print('Creating match results...')
        matches = [
            # Aisha vs Senior Full Stack (great match)
            (MATCH_1_ID, RESUME_1_ID, JOB_1_ID, 0.87, 0.91, 0.85, 0.80, 0.90,
             json.dumps([{'name': 'React', 'score': 1.0}, {'name': 'TypeScript', 'score': 1.0}, {'name': 'Python', 'score': 1.0}, {'name': 'PostgreSQL', 'score': 1.0}, {'name': 'AWS', 'score': 0.9}]),
             json.dumps([{'name': 'Docker', 'score': 0.7}, {'name': 'CI/CD', 'score': 0.8}]),
             json.dumps([{'name': 'Kubernetes', 'score': 0.0}, {'name': 'GraphQL', 'score': 0.0}]),
             'Strong match! Aisha has direct experience with all core required technologies (React, TypeScript, Python, PostgreSQL, AWS). Her Google internship and StartupXYZ experience demonstrate production-level skills. Minor gaps in Kubernetes and GraphQL, which are nice-to-haves.',
             1, True),

            # James vs ML Engineer (excellent match)
            (MATCH_2_ID, RESUME_3_ID, JOB_2_ID, 0.93, 0.95, 0.92, 0.90, 0.95,
             json.dumps([{'name': 'Python', 'score': 1.0}, {'name': 'PyTorch', 'score': 1.0}, {'name': 'NLP', 'score': 1.0}, {'name': 'SQL', 'score': 1.0}, {'name': 'Statistics', 'score': 0.95}]),
             json.dumps([{'name': 'ML Pipelines', 'score': 0.85}]),
             json.dumps([{'name': 'Kubernetes', 'score': 0.0}]),
             'Excellent match! James has published NLP research at ACL 2025 and production ML experience at Meta AI. His combination of academic rigor and industry experience is ideal. Strong in all required skills with minor gap only in Kubernetes (nice-to-have).',
             1, True),

            # Aisha vs Junior Frontend (overqualified but good match)
            (MATCH_3_ID, RESUME_1_ID, JOB_3_ID, 0.82, 0.85, 0.90, 0.95, 0.88,
             json.dumps([{'name': 'React', 'score': 1.0}, {'name': 'TypeScript', 'score': 1.0}, {'name': 'HTML', 'score': 1.0}, {'name': 'CSS', 'score': 1.0}]),
             json.dumps([{'name': 'Next.js', 'score': 0.95}, {'name': 'Tailwind CSS', 'score': 0.9}]),
             json.dumps([]),
             'Aisha exceeds all requirements for this junior role. She has direct experience with all required and nice-to-have skills. Note: She may be overqualified given her Google internship and 2+ years of experience.',
             2, True),

            # Maria vs UX Designer (strong match)
            (MATCH_4_ID, RESUME_4_ID, JOB_4_ID, 0.89, 0.88, 0.92, 0.85, 0.80,
             json.dumps([{'name': 'Figma', 'score': 1.0}, {'name': 'User Research', 'score': 1.0}, {'name': 'Design Systems', 'score': 1.0}, {'name': 'Prototyping', 'score': 0.95}]),
             json.dumps([{'name': 'React', 'score': 0.85}, {'name': 'Accessibility', 'score': 0.9}]),
             json.dumps([{'name': 'Motion Design', 'score': 0.3}]),
             'Maria is an excellent fit for this UX Designer role. Expert-level Figma skills, strong user research background, and design system experience at DesignStudio. Bonus: she can also code in React. Minor gap in motion design.',
             1, True),

            # James vs Data Analyst (partial match — overqualified)
            (MATCH_5_ID, RESUME_3_ID, JOB_5_ID, 0.72, 0.70, 0.75, 0.95, 0.90,
             json.dumps([{'name': 'SQL', 'score': 1.0}, {'name': 'Python', 'score': 1.0}, {'name': 'Statistics', 'score': 1.0}]),
             json.dumps([{'name': 'Data Visualization', 'score': 0.6}]),
             json.dumps([{'name': 'Tableau', 'score': 0.0}]),
             'James has the technical skills for this role but is significantly overqualified as an ML engineer with a Masters degree. Good SQL and Python skills but limited data visualization tool experience (Tableau/Looker). Better suited for ML Engineer roles.',
             3, False),
        ]
        cur.executemany(
            """INSERT INTO match_results
            (id, resume_id, job_id, overall_score, semantic_score, skill_score, experience_score, education_score,
             matched_skills, partial_skills, missing_skills, explanation, recruiter_rank, is_shortlisted)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            matches,
        )

        # ─── Skill Gaps ──────────────────────────────────────────────────
        print('Creating skill gaps...')
        skill_gaps = [
            # Aisha gaps for Senior Full Stack
            (uuid.uuid4(), MATCH_1_ID, 'Kubernetes', 'technical', 'medium', 'missing'),
            (uuid.uuid4(), MATCH_1_ID, 'GraphQL', 'technical', 'low', 'missing'),
            # James gaps for ML Engineer
            (uuid.uuid4(), MATCH_2_ID, 'Kubernetes', 'technical', 'low', 'missing'),
            # Maria gaps for UX Designer
            (uuid.uuid4(), MATCH_4_ID, 'Motion Design', 'technical', 'low', 'missing'),
            # James gaps for Data Analyst
            (uuid.uuid4(), MATCH_5_ID, 'Tableau', 'technical', 'high', 'missing'),
            (uuid.uuid4(), MATCH_5_ID, 'Data Visualization', 'technical', 'high', 'insufficient'),
        ]
        sg_ids = []
        for sg in skill_gaps:
            sg_ids.append(sg[0])
        cur.executemany(
            "INSERT INTO skill_gaps (id, match_result_id, skill_name, skill_category, importance, gap_type) VALUES (%s, %s, %s, %s, %s, %s)",
            skill_gaps,
        )

        # ─── Learning Recommendations ─────────────────────────────────────
        print('Creating learning recommendations...')
        recommendations = [
            (uuid.uuid4(), MATCH_1_ID, sg_ids[0], 'Kubernetes', 'course', 'Kubernetes for Developers', 'Udemy', 'https://udemy.com/kubernetes', 20, 1),
            (uuid.uuid4(), MATCH_1_ID, sg_ids[0], 'Kubernetes', 'certification', 'CKA - Certified Kubernetes Administrator', 'CNCF', 'https://cncf.io/cka', 40, 2),
            (uuid.uuid4(), MATCH_1_ID, sg_ids[1], 'GraphQL', 'course', 'Full-Stack GraphQL with React & Node.js', 'Frontend Masters', 'https://frontendmasters.com/graphql', 12, 3),
            (uuid.uuid4(), MATCH_2_ID, sg_ids[2], 'Kubernetes', 'course', 'Kubernetes for ML Engineers', 'Coursera', 'https://coursera.org/k8s-ml', 15, 1),
            (uuid.uuid4(), MATCH_4_ID, sg_ids[3], 'Motion Design', 'course', 'Motion Design with After Effects', 'Skillshare', 'https://skillshare.com/motion', 10, 1),
            (uuid.uuid4(), MATCH_4_ID, sg_ids[3], 'Motion Design', 'course', 'Advanced Framer Motion for React', 'Egghead.io', 'https://egghead.io/framer-motion', 6, 2),
            (uuid.uuid4(), MATCH_5_ID, sg_ids[4], 'Tableau', 'certification', 'Tableau Desktop Specialist', 'Tableau', 'https://tableau.com/cert', 30, 1),
            (uuid.uuid4(), MATCH_5_ID, sg_ids[5], 'Data Visualization', 'course', 'Data Visualization with D3.js', 'Observable', 'https://observablehq.com/d3', 15, 2),
        ]
        cur.executemany(
            """INSERT INTO learning_recommendations
            (id, match_result_id, skill_gap_id, skill_name, resource_type, resource_title, resource_provider, resource_url, estimated_hours, priority)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            recommendations,
        )

        # ─── Applications ────────────────────────────────────────────────
        print('Creating applications...')
        applications = [
            (uuid.uuid4(), STUDENT_1_ID, JOB_1_ID, RESUME_1_ID, MATCH_1_ID, 'shortlisted', None, 'Top candidate — strong full-stack skills, Google experience'),
            (uuid.uuid4(), STUDENT_1_ID, JOB_3_ID, RESUME_2_ID, MATCH_3_ID, 'interview', None, 'Overqualified but great culture fit'),
            (uuid.uuid4(), STUDENT_2_ID, JOB_2_ID, RESUME_3_ID, MATCH_2_ID, 'shortlisted', 'Excited to work on production NLP systems at scale.', 'Best candidate — published NLP researcher with Meta experience'),
            (uuid.uuid4(), STUDENT_2_ID, JOB_5_ID, RESUME_3_ID, MATCH_5_ID, 'applied', None, None),
            (uuid.uuid4(), STUDENT_3_ID, JOB_4_ID, RESUME_4_ID, MATCH_4_ID, 'interview', 'I bring a unique blend of design and engineering skills.', 'Strong portfolio, can code — rare combination'),
        ]
        cur.executemany(
            """INSERT INTO applications
            (id, applicant_id, job_id, resume_id, match_result_id, status, cover_letter, recruiter_notes)
            VALUES (%s, %s, %s, %s, %s, %s::application_status, %s, %s)""",
            applications,
        )

        conn.commit()
        print('\n✅ Seed data created successfully!')
        print(f'   - 6 Users (3 students, 2 recruiters, 1 university)')
        print(f'   - 5 Resumes with parsed data and skills')
        print(f'   - 6 Job Listings with required skills')
        print(f'   - 5 Match Results with explainable scores')
        print(f'   - 6 Skill Gaps with learning recommendations')
        print(f'   - 5 Applications in various stages')

    except Exception as e:
        conn.rollback()
        print(f'\n❌ Seed failed: {e}')
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == '__main__':
    seed()
