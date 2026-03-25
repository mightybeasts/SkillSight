-- SkillSight Seed Data
-- Run: docker compose exec postgres psql -U skillsight -d skillsight -f /docker-entrypoint-initdb.d/seed.sql
-- Or: cat services/api/seed.sql | docker compose exec -T postgres psql -U skillsight -d skillsight

BEGIN;

-- ─── Clean existing seed data ──────────────────────────────────────────────
DELETE FROM learning_recommendations WHERE match_result_id IN (
  'f6000000-0000-0000-0000-000000000001', 'f6000000-0000-0000-0000-000000000002',
  'f6000000-0000-0000-0000-000000000003', 'f6000000-0000-0000-0000-000000000004',
  'f6000000-0000-0000-0000-000000000005'
);
DELETE FROM skill_gaps WHERE match_result_id IN (
  'f6000000-0000-0000-0000-000000000001', 'f6000000-0000-0000-0000-000000000002',
  'f6000000-0000-0000-0000-000000000003', 'f6000000-0000-0000-0000-000000000004',
  'f6000000-0000-0000-0000-000000000005'
);
DELETE FROM applications WHERE applicant_id IN (
  'a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000003'
);
DELETE FROM match_results WHERE id IN (
  'f6000000-0000-0000-0000-000000000001', 'f6000000-0000-0000-0000-000000000002',
  'f6000000-0000-0000-0000-000000000003', 'f6000000-0000-0000-0000-000000000004',
  'f6000000-0000-0000-0000-000000000005'
);
DELETE FROM job_skills WHERE job_id IN (
  'e5000000-0000-0000-0000-000000000001', 'e5000000-0000-0000-0000-000000000002',
  'e5000000-0000-0000-0000-000000000003', 'e5000000-0000-0000-0000-000000000004',
  'e5000000-0000-0000-0000-000000000005', 'e5000000-0000-0000-0000-000000000006'
);
DELETE FROM resume_skills WHERE resume_id IN (
  'd4000000-0000-0000-0000-000000000001', 'd4000000-0000-0000-0000-000000000002',
  'd4000000-0000-0000-0000-000000000003', 'd4000000-0000-0000-0000-000000000004',
  'd4000000-0000-0000-0000-000000000005'
);
DELETE FROM resumes WHERE id IN (
  'd4000000-0000-0000-0000-000000000001', 'd4000000-0000-0000-0000-000000000002',
  'd4000000-0000-0000-0000-000000000003', 'd4000000-0000-0000-0000-000000000004',
  'd4000000-0000-0000-0000-000000000005'
);
DELETE FROM job_listings WHERE id IN (
  'e5000000-0000-0000-0000-000000000001', 'e5000000-0000-0000-0000-000000000002',
  'e5000000-0000-0000-0000-000000000003', 'e5000000-0000-0000-0000-000000000004',
  'e5000000-0000-0000-0000-000000000005', 'e5000000-0000-0000-0000-000000000006'
);
DELETE FROM user_profiles WHERE user_id IN (
  'a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000001',
  'b2000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000001'
);
DELETE FROM users WHERE id IN (
  'a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000001',
  'b2000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000001'
);

-- ─── Users ────────────────────────────────────────────────────────────────────
INSERT INTO users (id, supabase_id, email, full_name, avatar_url, role) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'seed-student-1', 'aisha.khan@example.com', 'Aisha Khan', NULL, 'job_seeker'),
  ('a1000000-0000-0000-0000-000000000002', 'seed-student-2', 'james.chen@example.com', 'James Chen', NULL, 'job_seeker'),
  ('a1000000-0000-0000-0000-000000000003', 'seed-student-3', 'maria.garcia@example.com', 'Maria Garcia', NULL, 'job_seeker'),
  ('b2000000-0000-0000-0000-000000000001', 'seed-recruiter-1', 'sarah.johnson@techcorp.com', 'Sarah Johnson', NULL, 'recruiter'),
  ('b2000000-0000-0000-0000-000000000002', 'seed-recruiter-2', 'david.kim@innovate.io', 'David Kim', NULL, 'recruiter'),
  ('c3000000-0000-0000-0000-000000000001', 'seed-university-1', 'placement@stanford.edu', 'Dr. Emily Watson', NULL, 'admin');

-- ─── User Profiles ────────────────────────────────────────────────────────────
INSERT INTO user_profiles (id, user_id, headline, bio, location, company_name, company_size, industry) VALUES
  (gen_random_uuid(), 'a1000000-0000-0000-0000-000000000001', 'Full Stack Developer | CS Graduate',
   'Passionate about building web applications with React and Python. Looking for full-time roles in software engineering.',
   'San Francisco, CA', NULL, NULL, NULL),
  (gen_random_uuid(), 'a1000000-0000-0000-0000-000000000002', 'Data Science Enthusiast | ML Engineer',
   'Masters student specializing in NLP and computer vision. Published researcher with industry experience.',
   'New York, NY', NULL, NULL, NULL),
  (gen_random_uuid(), 'a1000000-0000-0000-0000-000000000003', 'UX/UI Designer & Frontend Developer',
   'Creative designer with strong coding skills. 2 years experience in startup environments.',
   'Austin, TX', NULL, NULL, NULL),
  (gen_random_uuid(), 'b2000000-0000-0000-0000-000000000001', 'Senior Technical Recruiter',
   'Building world-class engineering teams at TechCorp for 8 years.',
   'San Francisco, CA', 'TechCorp Inc.', '1000-5000', 'Technology'),
  (gen_random_uuid(), 'b2000000-0000-0000-0000-000000000002', 'Head of Talent Acquisition',
   'Scaling engineering teams at fast-growing startups.',
   'Remote', 'Innovate.io', '50-200', 'SaaS'),
  (gen_random_uuid(), 'c3000000-0000-0000-0000-000000000001', 'Director of Career Services',
   'Helping students transition from academia to industry for over 15 years.',
   'Stanford, CA', 'Stanford University', '5000+', 'Education');

-- ─── Resumes ──────────────────────────────────────────────────────────────────
-- Aisha Khan - Master Resume (Full Stack)
INSERT INTO resumes (id, owner_id, title, is_master, raw_text, file_name, parsed_data, processing_status) VALUES
  ('d4000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
   'Master Resume - Full Stack', TRUE,
   'Aisha Khan — Full Stack Developer
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
GPA: 3.8/4.0 | Dean''s List | ACM Club President

SKILLS
Languages: Python, TypeScript, JavaScript, SQL, HTML/CSS, Java
Frontend: React, Next.js, Tailwind CSS, Redux, Figma
Backend: Node.js, Express, FastAPI, Flask, Django
Database: PostgreSQL, MongoDB, Redis, DynamoDB
Cloud/DevOps: AWS, Docker, Kubernetes, GitHub Actions, Terraform
Other: Git, REST APIs, GraphQL, Agile/Scrum, TDD',
   'Aisha_Khan_Resume.pdf',
   '{"name": "Aisha Khan", "email": "aisha.khan@example.com", "phone": "+1-415-555-0101", "location": "San Francisco, CA", "summary": "Full-stack developer with 2+ years experience building scalable web applications.", "experience": [{"title": "Software Engineer Intern", "company": "Google", "duration": "3 months", "location": "Mountain View, CA"}, {"title": "Full Stack Developer", "company": "StartupXYZ", "duration": "1.5 years", "location": "San Francisco, CA"}], "education": [{"degree": "B.S. Computer Science", "institution": "UC Berkeley", "gpa": "3.8/4.0"}], "skills": ["Python", "TypeScript", "React", "Next.js", "Node.js", "PostgreSQL", "AWS", "Docker", "FastAPI", "Redis"]}',
   'completed');

-- Aisha Khan - Frontend Focus
INSERT INTO resumes (id, owner_id, title, is_master, raw_text, file_name, parsed_data, processing_status) VALUES
  ('d4000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001',
   'Resume - Frontend Focus', FALSE,
   'Aisha Khan — Frontend Engineer. Specialized React/Next.js developer with experience at Google.',
   'Aisha_Khan_Frontend.pdf',
   '{"name": "Aisha Khan", "email": "aisha.khan@example.com", "summary": "Frontend engineer specializing in React and Next.js", "skills": ["React", "Next.js", "TypeScript", "Tailwind CSS", "Redux", "Figma", "Jest", "Cypress"]}',
   'completed');

-- James Chen - Master Resume (Data Science)
INSERT INTO resumes (id, owner_id, title, is_master, raw_text, file_name, parsed_data, processing_status) VALUES
  ('d4000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002',
   'Master Resume - Data Science', TRUE,
   'James Chen — Data Scientist & ML Engineer
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
Other: Docker, Git, A/B Testing, Statistical Analysis',
   'James_Chen_Resume.pdf',
   '{"name": "James Chen", "email": "james.chen@example.com", "summary": "Data scientist with expertise in NLP, computer vision, and deep learning.", "experience": [{"title": "ML Engineer Intern", "company": "Meta AI", "duration": "4 months"}, {"title": "Research Assistant", "company": "NYU Center for Data Science", "duration": "2 years"}], "education": [{"degree": "M.S. Data Science", "institution": "NYU", "gpa": "3.9/4.0"}, {"degree": "B.S. Mathematics", "institution": "MIT", "gpa": "3.7/4.0"}], "skills": ["Python", "PyTorch", "TensorFlow", "NLP", "Computer Vision", "Spark", "SQL", "Docker", "AWS SageMaker", "Hugging Face"]}',
   'completed');

-- Maria Garcia - Master Resume (UX/Frontend)
INSERT INTO resumes (id, owner_id, title, is_master, raw_text, file_name, parsed_data, processing_status) VALUES
  ('d4000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000003',
   'Master Resume - UX/Frontend', TRUE,
   'Maria Garcia — UX/UI Designer & Frontend Developer
Contact: maria.garcia@example.com | Austin, TX

SUMMARY
Creative designer and frontend developer with 2 years of startup experience. Expertise in user research, prototyping, and building accessible interfaces.

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
Other: HTML/CSS, JavaScript, Git, Responsive Design, Accessibility, User Research',
   'Maria_Garcia_Resume.pdf',
   '{"name": "Maria Garcia", "email": "maria.garcia@example.com", "summary": "UX/UI designer and frontend developer with startup experience.", "experience": [{"title": "UX Engineer", "company": "DesignStudio", "duration": "1+ years"}, {"title": "Frontend Developer", "company": "Freelance", "duration": "1 year"}], "education": [{"degree": "B.F.A. Digital Design", "institution": "UT Austin"}], "skills": ["Figma", "React", "Next.js", "TypeScript", "Tailwind CSS", "User Research", "Design Systems", "Framer Motion", "Accessibility"]}',
   'completed');

-- Maria Garcia - Design Lead resume
INSERT INTO resumes (id, owner_id, title, is_master, raw_text, file_name, parsed_data, processing_status) VALUES
  ('d4000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000003',
   'Resume - Design Lead', FALSE,
   'Maria Garcia — Design-focused resume for lead roles.',
   'Maria_Garcia_Design.pdf',
   '{"name": "Maria Garcia", "skills": ["Figma", "Design Systems", "User Research", "Prototyping", "Team Leadership"]}',
   'completed');

-- ─── Resume Skills ────────────────────────────────────────────────────────────
-- Aisha skills
INSERT INTO resume_skills (id, resume_id, skill_name, skill_category, years_of_experience, proficiency_level) VALUES
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000001', 'Python', 'technical', 2.0, 'advanced'),
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000001', 'TypeScript', 'technical', 2.0, 'advanced'),
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000001', 'React', 'technical', 2.0, 'advanced'),
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000001', 'Next.js', 'technical', 1.5, 'advanced'),
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000001', 'Node.js', 'technical', 2.0, 'intermediate'),
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000001', 'PostgreSQL', 'technical', 1.5, 'intermediate'),
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000001', 'AWS', 'technical', 1.0, 'intermediate'),
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000001', 'Docker', 'technical', 1.0, 'intermediate'),
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000001', 'FastAPI', 'technical', 1.0, 'intermediate'),
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000001', 'Redis', 'technical', 1.0, 'intermediate'),
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000001', 'Git', 'technical', 2.0, 'advanced'),
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000001', 'REST APIs', 'technical', 2.0, 'advanced'),
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000001', 'Agile/Scrum', 'soft', 2.0, 'advanced'),
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000001', 'Problem Solving', 'soft', NULL, 'advanced');

-- James skills
INSERT INTO resume_skills (id, resume_id, skill_name, skill_category, years_of_experience, proficiency_level) VALUES
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000003', 'Python', 'technical', 4.0, 'expert'),
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000003', 'PyTorch', 'technical', 3.0, 'advanced'),
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000003', 'TensorFlow', 'technical', 2.0, 'advanced'),
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000003', 'NLP', 'technical', 3.0, 'advanced'),
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000003', 'Computer Vision', 'technical', 2.0, 'intermediate'),
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000003', 'SQL', 'technical', 3.0, 'advanced'),
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000003', 'Apache Spark', 'technical', 1.0, 'intermediate'),
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000003', 'Docker', 'technical', 1.0, 'intermediate'),
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000003', 'AWS SageMaker', 'technical', 1.0, 'intermediate'),
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000003', 'Hugging Face', 'technical', 2.0, 'advanced'),
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000003', 'Research', 'soft', NULL, 'expert'),
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000003', 'Statistical Analysis', 'technical', 3.0, 'advanced');

-- Maria skills
INSERT INTO resume_skills (id, resume_id, skill_name, skill_category, years_of_experience, proficiency_level) VALUES
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000004', 'Figma', 'technical', 3.0, 'expert'),
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000004', 'React', 'technical', 2.0, 'advanced'),
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000004', 'Next.js', 'technical', 1.5, 'intermediate'),
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000004', 'TypeScript', 'technical', 2.0, 'intermediate'),
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000004', 'Tailwind CSS', 'technical', 2.0, 'advanced'),
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000004', 'User Research', 'soft', 2.0, 'advanced'),
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000004', 'Design Systems', 'technical', 2.0, 'advanced'),
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000004', 'Framer Motion', 'technical', 1.0, 'intermediate'),
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000004', 'Accessibility', 'technical', 1.5, 'advanced'),
  (gen_random_uuid(), 'd4000000-0000-0000-0000-000000000004', 'Storybook', 'technical', 1.0, 'intermediate');

-- ─── Job Listings ─────────────────────────────────────────────────────────────
INSERT INTO job_listings (id, recruiter_id, title, company, location, is_remote, job_type, experience_level, salary_min, salary_max, salary_currency, description, requirements, responsibilities, benefits, parsed_requirements, status) VALUES
  ('e5000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001',
   'Senior Full Stack Engineer', 'TechCorp Inc.', 'San Francisco, CA', FALSE,
   'full_time', 'senior', 130000, 180000, 'USD',
   'We are looking for a Senior Full Stack Engineer to join our product team. You will build and scale our core platform serving millions of users.',
   'Requirements: 4+ years full-stack experience, React/Next.js + TypeScript, Python or Node.js backend, PostgreSQL, AWS, CI/CD, strong communication',
   'Design and implement features end-to-end, write clean tested code, mentor juniors, architecture decisions',
   'Competitive salary + equity, health/dental/vision, 401k match, unlimited PTO, $5K learning budget',
   '{"required": ["React", "TypeScript", "Python", "PostgreSQL", "AWS"], "nice_to_have": ["Docker", "Kubernetes", "GraphQL"]}',
   'active'),

  ('e5000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000001',
   'Machine Learning Engineer', 'TechCorp Inc.', 'New York, NY', TRUE,
   'full_time', 'mid', 140000, 190000, 'USD',
   'Join our AI team to build production ML systems that power our recommendation engine and content understanding pipeline.',
   'Requirements: 3+ years ML engineering, Python + PyTorch/TensorFlow, NLP or CV experience, production ML pipelines, MS/PhD preferred',
   'Design and train ML models, build ML pipelines, run A/B tests, collaborate with product and data teams',
   'Top-of-market compensation, research publication support, GPU budget, conference attendance',
   '{"required": ["Python", "PyTorch", "NLP", "ML Pipelines", "SQL"], "nice_to_have": ["Spark", "Kubernetes", "MLflow"]}',
   'active'),

  ('e5000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000001',
   'Junior Frontend Developer', 'TechCorp Inc.', 'Remote', TRUE,
   'full_time', 'entry', 80000, 110000, 'USD',
   'Great opportunity for early-career developers! Join our frontend team to build beautiful, accessible user interfaces.',
   'Requirements: 0-2 years frontend experience, React + TypeScript, HTML/CSS expertise, responsive design, eagerness to learn',
   'Build UI components with React, implement Figma designs, write unit tests, participate in code reviews',
   'Mentorship program, learning stipend, flexible hours, remote-first',
   '{"required": ["React", "TypeScript", "HTML", "CSS"], "nice_to_have": ["Next.js", "Tailwind CSS", "Testing"]}',
   'active'),

  ('e5000000-0000-0000-0000-000000000004', 'b2000000-0000-0000-0000-000000000002',
   'UX Designer', 'Innovate.io', 'Austin, TX', FALSE,
   'full_time', 'mid', 95000, 130000, 'USD',
   'We need a talented UX Designer to lead the design of our B2B SaaS platform.',
   'Requirements: 3+ years UX design, expert Figma, user research + usability testing, design system experience, portfolio required',
   'Conduct user research, create wireframes and prototypes, build design system, collaborate with engineering',
   'Creative freedom, design tool budget, conference attendance, 4-day work week option',
   '{"required": ["Figma", "User Research", "Design Systems", "Prototyping"], "nice_to_have": ["React", "Accessibility", "Motion Design"]}',
   'active'),

  ('e5000000-0000-0000-0000-000000000005', 'b2000000-0000-0000-0000-000000000002',
   'Data Analyst', 'Innovate.io', 'Remote', TRUE,
   'full_time', 'entry', 70000, 95000, 'USD',
   'Looking for a Data Analyst to help us make data-driven decisions.',
   'Requirements: 1+ years data analysis, SQL, Python (Pandas, NumPy), data visualization, statistical knowledge',
   'Build dashboards, analyze user behavior, present findings, support A/B tests',
   'Fully remote, flexible schedule, learning budget',
   '{"required": ["SQL", "Python", "Data Visualization", "Statistics"], "nice_to_have": ["Tableau", "dbt", "Airflow"]}',
   'active'),

  ('e5000000-0000-0000-0000-000000000006', 'b2000000-0000-0000-0000-000000000002',
   'DevOps Engineer', 'Innovate.io', 'San Francisco, CA', TRUE,
   'contract', 'senior', 150000, 200000, 'USD',
   'Contract role for an experienced DevOps engineer to help migrate from monolith to microservices on Kubernetes.',
   'Requirements: 5+ years DevOps/SRE, Kubernetes + Docker expert, AWS/GCP, Terraform/Pulumi IaC, CI/CD, monitoring',
   'Design microservices architecture, set up K8s clusters, implement CI/CD, establish monitoring',
   'Premium contract rate, flexible hours, potential full-time conversion',
   '{"required": ["Kubernetes", "Docker", "AWS", "Terraform", "CI/CD"], "nice_to_have": ["GCP", "Prometheus", "ArgoCD"]}',
   'active');

-- ─── Job Skills ───────────────────────────────────────────────────────────────
-- Job 1 - Senior Full Stack
INSERT INTO job_skills (id, job_id, skill_name, skill_category, is_required, importance_weight) VALUES
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000001', 'React', 'technical', TRUE, 1.0),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000001', 'TypeScript', 'technical', TRUE, 1.0),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000001', 'Python', 'technical', TRUE, 1.0),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000001', 'PostgreSQL', 'technical', TRUE, 1.0),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000001', 'AWS', 'technical', TRUE, 1.0),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000001', 'Node.js', 'technical', TRUE, 1.0),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000001', 'CI/CD', 'technical', TRUE, 1.0),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000001', 'Docker', 'technical', FALSE, 0.5),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000001', 'Kubernetes', 'technical', FALSE, 0.5),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000001', 'GraphQL', 'technical', FALSE, 0.5);

-- Job 2 - ML Engineer
INSERT INTO job_skills (id, job_id, skill_name, skill_category, is_required, importance_weight) VALUES
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000002', 'Python', 'technical', TRUE, 1.0),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000002', 'PyTorch', 'technical', TRUE, 1.0),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000002', 'NLP', 'technical', TRUE, 1.0),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000002', 'ML Pipelines', 'technical', TRUE, 1.0),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000002', 'SQL', 'technical', TRUE, 1.0),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000002', 'Statistics', 'technical', TRUE, 1.0),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000002', 'TensorFlow', 'technical', FALSE, 0.5),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000002', 'Spark', 'technical', FALSE, 0.5),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000002', 'Kubernetes', 'technical', FALSE, 0.5);

-- Job 3 - Junior Frontend
INSERT INTO job_skills (id, job_id, skill_name, skill_category, is_required, importance_weight) VALUES
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000003', 'React', 'technical', TRUE, 1.0),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000003', 'TypeScript', 'technical', TRUE, 1.0),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000003', 'HTML', 'technical', TRUE, 1.0),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000003', 'CSS', 'technical', TRUE, 1.0),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000003', 'Next.js', 'technical', FALSE, 0.5),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000003', 'Tailwind CSS', 'technical', FALSE, 0.5),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000003', 'Jest', 'technical', FALSE, 0.5);

-- Job 4 - UX Designer
INSERT INTO job_skills (id, job_id, skill_name, skill_category, is_required, importance_weight) VALUES
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000004', 'Figma', 'technical', TRUE, 1.0),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000004', 'User Research', 'soft', TRUE, 1.0),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000004', 'Design Systems', 'technical', TRUE, 1.0),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000004', 'Prototyping', 'technical', TRUE, 1.0),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000004', 'React', 'technical', FALSE, 0.5),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000004', 'Accessibility', 'technical', FALSE, 0.5),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000004', 'Motion Design', 'technical', FALSE, 0.5);

-- Job 5 - Data Analyst
INSERT INTO job_skills (id, job_id, skill_name, skill_category, is_required, importance_weight) VALUES
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000005', 'SQL', 'technical', TRUE, 1.0),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000005', 'Python', 'technical', TRUE, 1.0),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000005', 'Data Visualization', 'technical', TRUE, 1.0),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000005', 'Statistics', 'technical', TRUE, 1.0),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000005', 'Tableau', 'technical', FALSE, 0.5),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000005', 'dbt', 'technical', FALSE, 0.5);

-- Job 6 - DevOps
INSERT INTO job_skills (id, job_id, skill_name, skill_category, is_required, importance_weight) VALUES
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000006', 'Kubernetes', 'technical', TRUE, 1.0),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000006', 'Docker', 'technical', TRUE, 1.0),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000006', 'AWS', 'technical', TRUE, 1.0),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000006', 'Terraform', 'technical', TRUE, 1.0),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000006', 'CI/CD', 'technical', TRUE, 1.0),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000006', 'GCP', 'technical', FALSE, 0.5),
  (gen_random_uuid(), 'e5000000-0000-0000-0000-000000000006', 'Prometheus', 'technical', FALSE, 0.5);

-- ─── Match Results ────────────────────────────────────────────────────────────
-- Aisha vs Senior Full Stack (87% — great match)
INSERT INTO match_results (id, resume_id, job_id, overall_score, semantic_score, skill_score, experience_score, education_score, matched_skills, partial_skills, missing_skills, explanation, recruiter_rank, is_shortlisted) VALUES
  ('f6000000-0000-0000-0000-000000000001',
   'd4000000-0000-0000-0000-000000000001', 'e5000000-0000-0000-0000-000000000001',
   0.87, 0.91, 0.85, 0.80, 0.90,
   '[{"name": "React", "score": 1.0}, {"name": "TypeScript", "score": 1.0}, {"name": "Python", "score": 1.0}, {"name": "PostgreSQL", "score": 1.0}, {"name": "AWS", "score": 0.9}]',
   '[{"name": "Docker", "score": 0.7}, {"name": "CI/CD", "score": 0.8}]',
   '[{"name": "Kubernetes", "score": 0.0}, {"name": "GraphQL", "score": 0.0}]',
   'Strong match! Aisha has direct experience with all core required technologies (React, TypeScript, Python, PostgreSQL, AWS). Her Google internship and StartupXYZ experience demonstrate production-level skills. Minor gaps in Kubernetes and GraphQL, which are nice-to-haves.',
   1, TRUE);

-- James vs ML Engineer (93% — excellent match)
INSERT INTO match_results (id, resume_id, job_id, overall_score, semantic_score, skill_score, experience_score, education_score, matched_skills, partial_skills, missing_skills, explanation, recruiter_rank, is_shortlisted) VALUES
  ('f6000000-0000-0000-0000-000000000002',
   'd4000000-0000-0000-0000-000000000003', 'e5000000-0000-0000-0000-000000000002',
   0.93, 0.95, 0.92, 0.90, 0.95,
   '[{"name": "Python", "score": 1.0}, {"name": "PyTorch", "score": 1.0}, {"name": "NLP", "score": 1.0}, {"name": "SQL", "score": 1.0}, {"name": "Statistics", "score": 0.95}]',
   '[{"name": "ML Pipelines", "score": 0.85}]',
   '[{"name": "Kubernetes", "score": 0.0}]',
   'Excellent match! James has published NLP research at ACL 2025 and production ML experience at Meta AI. His combination of academic rigor and industry experience is ideal.',
   1, TRUE);

-- Aisha vs Junior Frontend (82% — overqualified)
INSERT INTO match_results (id, resume_id, job_id, overall_score, semantic_score, skill_score, experience_score, education_score, matched_skills, partial_skills, missing_skills, explanation, recruiter_rank, is_shortlisted) VALUES
  ('f6000000-0000-0000-0000-000000000003',
   'd4000000-0000-0000-0000-000000000001', 'e5000000-0000-0000-0000-000000000003',
   0.82, 0.85, 0.90, 0.95, 0.88,
   '[{"name": "React", "score": 1.0}, {"name": "TypeScript", "score": 1.0}, {"name": "HTML", "score": 1.0}, {"name": "CSS", "score": 1.0}]',
   '[{"name": "Next.js", "score": 0.95}, {"name": "Tailwind CSS", "score": 0.9}]',
   '[]',
   'Aisha exceeds all requirements for this junior role. She has direct experience with all required and nice-to-have skills. Note: She may be overqualified given her Google internship and 2+ years of experience.',
   2, TRUE);

-- Maria vs UX Designer (89% — strong match)
INSERT INTO match_results (id, resume_id, job_id, overall_score, semantic_score, skill_score, experience_score, education_score, matched_skills, partial_skills, missing_skills, explanation, recruiter_rank, is_shortlisted) VALUES
  ('f6000000-0000-0000-0000-000000000004',
   'd4000000-0000-0000-0000-000000000004', 'e5000000-0000-0000-0000-000000000004',
   0.89, 0.88, 0.92, 0.85, 0.80,
   '[{"name": "Figma", "score": 1.0}, {"name": "User Research", "score": 1.0}, {"name": "Design Systems", "score": 1.0}, {"name": "Prototyping", "score": 0.95}]',
   '[{"name": "React", "score": 0.85}, {"name": "Accessibility", "score": 0.9}]',
   '[{"name": "Motion Design", "score": 0.3}]',
   'Maria is an excellent fit for this UX Designer role. Expert-level Figma skills, strong user research background, and design system experience at DesignStudio. Bonus: she can code in React.',
   1, TRUE);

-- James vs Data Analyst (72% — overqualified, partial match)
INSERT INTO match_results (id, resume_id, job_id, overall_score, semantic_score, skill_score, experience_score, education_score, matched_skills, partial_skills, missing_skills, explanation, recruiter_rank, is_shortlisted) VALUES
  ('f6000000-0000-0000-0000-000000000005',
   'd4000000-0000-0000-0000-000000000003', 'e5000000-0000-0000-0000-000000000005',
   0.72, 0.70, 0.75, 0.95, 0.90,
   '[{"name": "SQL", "score": 1.0}, {"name": "Python", "score": 1.0}, {"name": "Statistics", "score": 1.0}]',
   '[{"name": "Data Visualization", "score": 0.6}]',
   '[{"name": "Tableau", "score": 0.0}]',
   'James has the technical skills but is significantly overqualified as an ML engineer. Good SQL/Python but limited data visualization tool experience. Better suited for ML Engineer roles.',
   3, FALSE);

-- ─── Skill Gaps ───────────────────────────────────────────────────────────────
INSERT INTO skill_gaps (id, match_result_id, skill_name, skill_category, importance, gap_type) VALUES
  ('aa000000-0000-0000-0000-000000000001', 'f6000000-0000-0000-0000-000000000001', 'Kubernetes', 'technical', 'medium', 'missing'),
  ('aa000000-0000-0000-0000-000000000002', 'f6000000-0000-0000-0000-000000000001', 'GraphQL', 'technical', 'low', 'missing'),
  ('aa000000-0000-0000-0000-000000000003', 'f6000000-0000-0000-0000-000000000002', 'Kubernetes', 'technical', 'low', 'missing'),
  ('aa000000-0000-0000-0000-000000000004', 'f6000000-0000-0000-0000-000000000004', 'Motion Design', 'technical', 'low', 'missing'),
  ('aa000000-0000-0000-0000-000000000005', 'f6000000-0000-0000-0000-000000000005', 'Tableau', 'technical', 'high', 'missing'),
  ('aa000000-0000-0000-0000-000000000006', 'f6000000-0000-0000-0000-000000000005', 'Data Visualization', 'technical', 'high', 'insufficient');

-- ─── Learning Recommendations ─────────────────────────────────────────────────
INSERT INTO learning_recommendations (id, match_result_id, skill_gap_id, skill_name, resource_type, resource_title, resource_provider, resource_url, estimated_hours, priority) VALUES
  (gen_random_uuid(), 'f6000000-0000-0000-0000-000000000001', 'aa000000-0000-0000-0000-000000000001', 'Kubernetes', 'course', 'Kubernetes for Developers', 'Udemy', 'https://udemy.com/kubernetes', 20, 1),
  (gen_random_uuid(), 'f6000000-0000-0000-0000-000000000001', 'aa000000-0000-0000-0000-000000000001', 'Kubernetes', 'certification', 'CKA - Certified Kubernetes Administrator', 'CNCF', 'https://cncf.io/cka', 40, 2),
  (gen_random_uuid(), 'f6000000-0000-0000-0000-000000000001', 'aa000000-0000-0000-0000-000000000002', 'GraphQL', 'course', 'Full-Stack GraphQL with React & Node.js', 'Frontend Masters', 'https://frontendmasters.com/graphql', 12, 3),
  (gen_random_uuid(), 'f6000000-0000-0000-0000-000000000002', 'aa000000-0000-0000-0000-000000000003', 'Kubernetes', 'course', 'Kubernetes for ML Engineers', 'Coursera', 'https://coursera.org/k8s-ml', 15, 1),
  (gen_random_uuid(), 'f6000000-0000-0000-0000-000000000004', 'aa000000-0000-0000-0000-000000000004', 'Motion Design', 'course', 'Motion Design with After Effects', 'Skillshare', 'https://skillshare.com/motion', 10, 1),
  (gen_random_uuid(), 'f6000000-0000-0000-0000-000000000004', 'aa000000-0000-0000-0000-000000000004', 'Motion Design', 'course', 'Advanced Framer Motion for React', 'Egghead.io', 'https://egghead.io/framer-motion', 6, 2),
  (gen_random_uuid(), 'f6000000-0000-0000-0000-000000000005', 'aa000000-0000-0000-0000-000000000005', 'Tableau', 'certification', 'Tableau Desktop Specialist', 'Tableau', 'https://tableau.com/cert', 30, 1),
  (gen_random_uuid(), 'f6000000-0000-0000-0000-000000000005', 'aa000000-0000-0000-0000-000000000006', 'Data Visualization', 'course', 'Data Visualization with D3.js', 'Observable', 'https://observablehq.com/d3', 15, 2);

-- ─── Applications ─────────────────────────────────────────────────────────────
INSERT INTO applications (id, applicant_id, job_id, resume_id, match_result_id, status, cover_letter, recruiter_notes) VALUES
  (gen_random_uuid(), 'a1000000-0000-0000-0000-000000000001', 'e5000000-0000-0000-0000-000000000001', 'd4000000-0000-0000-0000-000000000001', 'f6000000-0000-0000-0000-000000000001', 'shortlisted', NULL, 'Top candidate — strong full-stack skills, Google experience'),
  (gen_random_uuid(), 'a1000000-0000-0000-0000-000000000001', 'e5000000-0000-0000-0000-000000000003', 'd4000000-0000-0000-0000-000000000002', 'f6000000-0000-0000-0000-000000000003', 'interview', NULL, 'Overqualified but great culture fit'),
  (gen_random_uuid(), 'a1000000-0000-0000-0000-000000000002', 'e5000000-0000-0000-0000-000000000002', 'd4000000-0000-0000-0000-000000000003', 'f6000000-0000-0000-0000-000000000002', 'shortlisted', 'Excited to work on production NLP systems at scale.', 'Best candidate — published NLP researcher with Meta experience'),
  (gen_random_uuid(), 'a1000000-0000-0000-0000-000000000002', 'e5000000-0000-0000-0000-000000000005', 'd4000000-0000-0000-0000-000000000003', 'f6000000-0000-0000-0000-000000000005', 'applied', NULL, NULL),
  (gen_random_uuid(), 'a1000000-0000-0000-0000-000000000003', 'e5000000-0000-0000-0000-000000000004', 'd4000000-0000-0000-0000-000000000004', 'f6000000-0000-0000-0000-000000000004', 'interview', 'I bring a unique blend of design and engineering skills.', 'Strong portfolio, can code — rare combination');

COMMIT;
