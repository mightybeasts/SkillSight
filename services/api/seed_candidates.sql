-- Create 5 test candidates for Junior Software Engineer job
-- Job ID: d8078541-fd89-45ce-9fc3-9d5b51666cd8
-- Job requires: Python, JavaScript, Java, SQL

-- ═══════════════════════════════════════════════════════════
-- Candidate 1: Priya Sharma — Strong full-stack match (should score ~85%)
-- Skills: Python, JavaScript, Java, SQL, React, Node.js
-- ═══════════════════════════════════════════════════════════

INSERT INTO users (id, supabase_id, email, full_name, role, is_active)
VALUES (
  'a1111111-1111-1111-1111-111111111111',
  'sub_priya_test_001',
  'priya.sharma@testmail.com',
  'Priya Sharma',
  'job_seeker',
  true
);

INSERT INTO user_profiles (id, user_id, headline, bio, location, linkedin_url, github_url)
VALUES (
  'b1111111-1111-1111-1111-111111111111',
  'a1111111-1111-1111-1111-111111111111',
  'Full Stack Developer | B.Tech CSE 2025',
  'Passionate full-stack developer with strong fundamentals in data structures, algorithms, and web development. Completed multiple internships building scalable applications. Looking for a challenging role to grow as a software engineer.',
  'Bangalore, India',
  'https://linkedin.com/in/priyasharma',
  'https://github.com/priyasharma-dev'
);

INSERT INTO resumes (id, owner_id, title, is_master, raw_text, file_name, processing_status, parsed_data)
VALUES (
  'c1111111-1111-1111-1111-111111111111',
  'a1111111-1111-1111-1111-111111111111',
  'Priya Resume',
  true,
  'Priya Sharma | priya.sharma@testmail.com | Bangalore, India

SUMMARY
Full-stack developer with hands-on experience in Python, JavaScript, Java, and SQL. Built multiple web applications using React and Node.js. Strong in data structures and algorithms with 500+ LeetCode problems solved. B.Tech in Computer Science from VIT University (2025 batch).

EDUCATION
B.Tech in Computer Science and Engineering — VIT University, Vellore (2021–2025) | CGPA: 8.9/10

EXPERIENCE
Software Engineering Intern — Infosys (Jun 2024 – Aug 2024)
- Developed REST APIs using Python Flask serving 10K+ daily requests
- Built responsive front-end dashboards with React and Tailwind CSS
- Wrote unit tests achieving 85% code coverage

Web Development Intern — Zoho Corp (Jan 2024 – Mar 2024)
- Created internal tools using JavaScript and Node.js
- Designed and optimized SQL queries for PostgreSQL database
- Collaborated with a team of 5 developers using Git and Agile

SKILLS
Python, JavaScript, Java, SQL, React, Node.js, Flask, PostgreSQL, Git, Docker, HTML/CSS, Data Structures, Algorithms, REST APIs',
  'priya_sharma_resume.pdf',
  'completed',
  '{
    "name": "Priya Sharma",
    "email": "priya.sharma@testmail.com",
    "phone": "+91 9876543210",
    "summary": "Full-stack developer with hands-on experience in Python, JavaScript, Java, and SQL. Built multiple web applications using React and Node.js. Strong in DSA with 500+ LeetCode problems solved.",
    "skills": ["Python", "JavaScript", "Java", "SQL", "React", "Node.js", "Flask", "PostgreSQL", "Git", "Docker", "HTML/CSS", "Data Structures", "Algorithms", "REST APIs"],
    "experience": [
      {"title": "Software Engineering Intern", "company": "Infosys", "duration": "Jun 2024 – Aug 2024", "description": "Developed REST APIs using Python Flask, built React dashboards, wrote unit tests with 85% coverage"},
      {"title": "Web Development Intern", "company": "Zoho Corp", "duration": "Jan 2024 – Mar 2024", "description": "Created internal tools with JavaScript/Node.js, optimized SQL queries for PostgreSQL"}
    ],
    "education": [
      {"degree": "B.Tech in Computer Science", "institution": "VIT University", "year": "2025", "gpa": "8.9/10"}
    ]
  }'
);

INSERT INTO resume_skills (id, resume_id, skill_name, skill_category, proficiency_level)
VALUES
  (gen_random_uuid(), 'c1111111-1111-1111-1111-111111111111', 'Python', 'programming', 'advanced'),
  (gen_random_uuid(), 'c1111111-1111-1111-1111-111111111111', 'JavaScript', 'programming', 'advanced'),
  (gen_random_uuid(), 'c1111111-1111-1111-1111-111111111111', 'Java', 'programming', 'intermediate'),
  (gen_random_uuid(), 'c1111111-1111-1111-1111-111111111111', 'SQL', 'database', 'intermediate'),
  (gen_random_uuid(), 'c1111111-1111-1111-1111-111111111111', 'React', 'framework', 'advanced'),
  (gen_random_uuid(), 'c1111111-1111-1111-1111-111111111111', 'Node.js', 'framework', 'intermediate');

INSERT INTO applications (id, applicant_id, job_id, resume_id, status, cover_letter, created_at, updated_at)
VALUES (
  'd1111111-1111-1111-1111-111111111111',
  'a1111111-1111-1111-1111-111111111111',
  'd8078541-fd89-45ce-9fc3-9d5b51666cd8',
  'c1111111-1111-1111-1111-111111111111',
  'applied',
  'I am excited to apply for the Junior Software Engineer position. With my strong foundation in Python, JavaScript, Java, and SQL, along with internship experience at Infosys and Zoho, I am confident I can contribute effectively to your team.',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
);


-- ═══════════════════════════════════════════════════════════
-- Candidate 2: Rahul Verma — Good match, ML focused (should score ~65%)
-- Skills: Python, SQL, Machine Learning, but weak on JavaScript/Java
-- ═══════════════════════════════════════════════════════════

INSERT INTO users (id, supabase_id, email, full_name, role, is_active)
VALUES (
  'a2222222-2222-2222-2222-222222222222',
  'sub_rahul_test_002',
  'rahul.verma@testmail.com',
  'Rahul Verma',
  'job_seeker',
  true
);

INSERT INTO user_profiles (id, user_id, headline, bio, location, linkedin_url, github_url)
VALUES (
  'b2222222-2222-2222-2222-222222222222',
  'a2222222-2222-2222-2222-222222222222',
  'ML Enthusiast | Python Developer | B.Tech IT 2025',
  'Machine learning enthusiast with a strong foundation in Python and data science. Built multiple ML projects including a sentiment analysis tool and a recommendation engine. Looking to transition into a software engineering role.',
  'Hyderabad, India',
  'https://linkedin.com/in/rahulverma-ml',
  'https://github.com/rahulverma-ml'
);

INSERT INTO resumes (id, owner_id, title, is_master, raw_text, file_name, processing_status, parsed_data)
VALUES (
  'c2222222-2222-2222-2222-222222222222',
  'a2222222-2222-2222-2222-222222222222',
  'Rahul Resume',
  true,
  'Rahul Verma | rahul.verma@testmail.com | Hyderabad, India

SUMMARY
Python developer specializing in machine learning and data analysis. Experience building ML models for sentiment analysis and recommendation systems. Solid understanding of SQL and database design. B.Tech in Information Technology from IIIT Hyderabad (2025 batch).

EDUCATION
B.Tech in Information Technology — IIIT Hyderabad (2021–2025) | CGPA: 8.2/10

EXPERIENCE
Data Science Intern — TCS Innovation Labs (May 2024 – Jul 2024)
- Built sentiment analysis pipeline using Python, scikit-learn, and NLP techniques
- Processed 100K+ data records using SQL and Pandas
- Deployed model as a REST API using FastAPI

Research Assistant — IIIT Hyderabad ML Lab (Aug 2023 – Dec 2023)
- Implemented recommendation engine using collaborative filtering
- Used Python, NumPy, and TensorFlow for model training
- Published results in internal research journal

SKILLS
Python, SQL, Machine Learning, scikit-learn, TensorFlow, Pandas, NumPy, FastAPI, NLP, Data Analysis, Git, Linux',
  'rahul_verma_resume.pdf',
  'completed',
  '{
    "name": "Rahul Verma",
    "email": "rahul.verma@testmail.com",
    "phone": "+91 9876543211",
    "summary": "Python developer specializing in machine learning and data analysis. Experience with ML models, SQL databases, and API development using FastAPI.",
    "skills": ["Python", "SQL", "Machine Learning", "scikit-learn", "TensorFlow", "Pandas", "NumPy", "FastAPI", "NLP", "Data Analysis", "Git", "Linux"],
    "experience": [
      {"title": "Data Science Intern", "company": "TCS Innovation Labs", "duration": "May 2024 – Jul 2024", "description": "Built sentiment analysis pipeline using Python and ML, processed data with SQL and Pandas, deployed with FastAPI"},
      {"title": "Research Assistant", "company": "IIIT Hyderabad ML Lab", "duration": "Aug 2023 – Dec 2023", "description": "Implemented recommendation engine with collaborative filtering using Python and TensorFlow"}
    ],
    "education": [
      {"degree": "B.Tech in Information Technology", "institution": "IIIT Hyderabad", "year": "2025", "gpa": "8.2/10"}
    ]
  }'
);

INSERT INTO resume_skills (id, resume_id, skill_name, skill_category, proficiency_level)
VALUES
  (gen_random_uuid(), 'c2222222-2222-2222-2222-222222222222', 'Python', 'programming', 'advanced'),
  (gen_random_uuid(), 'c2222222-2222-2222-2222-222222222222', 'SQL', 'database', 'intermediate'),
  (gen_random_uuid(), 'c2222222-2222-2222-2222-222222222222', 'Machine Learning', 'data_science', 'advanced'),
  (gen_random_uuid(), 'c2222222-2222-2222-2222-222222222222', 'TensorFlow', 'framework', 'intermediate'),
  (gen_random_uuid(), 'c2222222-2222-2222-2222-222222222222', 'FastAPI', 'framework', 'intermediate');

INSERT INTO applications (id, applicant_id, job_id, resume_id, status, cover_letter, created_at, updated_at)
VALUES (
  'd2222222-2222-2222-2222-222222222222',
  'a2222222-2222-2222-2222-222222222222',
  'd8078541-fd89-45ce-9fc3-9d5b51666cd8',
  'c2222222-2222-2222-2222-222222222222',
  'applied',
  'As a Python developer with ML experience, I bring strong analytical skills and coding ability. I am eager to expand into full-stack development and contribute to your engineering team.',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days'
);


-- ═══════════════════════════════════════════════════════════
-- Candidate 3: Ananya Patel — Frontend focused (should score ~55%)
-- Skills: JavaScript, React, TypeScript, but missing Python/Java/SQL
-- ═══════════════════════════════════════════════════════════

INSERT INTO users (id, supabase_id, email, full_name, role, is_active)
VALUES (
  'a3333333-3333-3333-3333-333333333333',
  'sub_ananya_test_003',
  'ananya.patel@testmail.com',
  'Ananya Patel',
  'job_seeker',
  true
);

INSERT INTO user_profiles (id, user_id, headline, bio, location, linkedin_url, github_url)
VALUES (
  'b3333333-3333-3333-3333-333333333333',
  'a3333333-3333-3333-3333-333333333333',
  'Frontend Developer | React & TypeScript | B.Tech CSE 2025',
  'Creative frontend developer passionate about building beautiful, accessible user interfaces. Experienced with React, TypeScript, and modern CSS frameworks. Won 2nd place in a national hackathon for building a real-time collaborative whiteboard.',
  'Mumbai, India',
  'https://linkedin.com/in/ananyapatel-dev',
  'https://github.com/ananyapatel-ui'
);

INSERT INTO resumes (id, owner_id, title, is_master, raw_text, file_name, processing_status, parsed_data)
VALUES (
  'c3333333-3333-3333-3333-333333333333',
  'a3333333-3333-3333-3333-333333333333',
  'Ananya Resume',
  true,
  'Ananya Patel | ananya.patel@testmail.com | Mumbai, India

SUMMARY
Frontend developer with expertise in React, TypeScript, and modern web technologies. Built responsive web applications and interactive UI components. Strong eye for design and user experience. B.Tech in Computer Science from DJ Sanghvi College, Mumbai (2025 batch).

EDUCATION
B.Tech in Computer Science — DJ Sanghvi College, Mumbai University (2021–2025) | CGPA: 8.5/10

EXPERIENCE
Frontend Developer Intern — Flipkart (Jun 2024 – Aug 2024)
- Built reusable React component library used across 3 product teams
- Implemented responsive designs with TypeScript and Tailwind CSS
- Improved page load time by 40% through code splitting and lazy loading

Freelance Web Developer (Jan 2024 – May 2024)
- Designed and developed 5+ client websites using React and Next.js
- Integrated REST APIs and managed state with React Query
- Created custom animations and micro-interactions

SKILLS
JavaScript, TypeScript, React, Next.js, HTML5, CSS3, Tailwind CSS, Redux, React Query, Figma, Git, Responsive Design, Web Performance',
  'ananya_patel_resume.pdf',
  'completed',
  '{
    "name": "Ananya Patel",
    "email": "ananya.patel@testmail.com",
    "phone": "+91 9876543212",
    "summary": "Frontend developer with expertise in React, TypeScript, and modern web technologies. Built responsive web applications at Flipkart and as a freelancer.",
    "skills": ["JavaScript", "TypeScript", "React", "Next.js", "HTML5", "CSS3", "Tailwind CSS", "Redux", "React Query", "Figma", "Git", "Responsive Design"],
    "experience": [
      {"title": "Frontend Developer Intern", "company": "Flipkart", "duration": "Jun 2024 – Aug 2024", "description": "Built React component library, improved page load by 40%, used TypeScript and Tailwind CSS"},
      {"title": "Freelance Web Developer", "company": "Self-employed", "duration": "Jan 2024 – May 2024", "description": "Developed 5+ client websites using React and Next.js, integrated REST APIs"}
    ],
    "education": [
      {"degree": "B.Tech in Computer Science", "institution": "DJ Sanghvi College, Mumbai University", "year": "2025", "gpa": "8.5/10"}
    ]
  }'
);

INSERT INTO resume_skills (id, resume_id, skill_name, skill_category, proficiency_level)
VALUES
  (gen_random_uuid(), 'c3333333-3333-3333-3333-333333333333', 'JavaScript', 'programming', 'advanced'),
  (gen_random_uuid(), 'c3333333-3333-3333-3333-333333333333', 'TypeScript', 'programming', 'advanced'),
  (gen_random_uuid(), 'c3333333-3333-3333-3333-333333333333', 'React', 'framework', 'advanced'),
  (gen_random_uuid(), 'c3333333-3333-3333-3333-333333333333', 'Next.js', 'framework', 'intermediate'),
  (gen_random_uuid(), 'c3333333-3333-3333-3333-333333333333', 'Tailwind CSS', 'framework', 'advanced');

INSERT INTO applications (id, applicant_id, job_id, resume_id, status, cover_letter, created_at, updated_at)
VALUES (
  'd3333333-3333-3333-3333-333333333333',
  'a3333333-3333-3333-3333-333333333333',
  'd8078541-fd89-45ce-9fc3-9d5b51666cd8',
  'c3333333-3333-3333-3333-333333333333',
  'applied',
  'I am a frontend-focused developer eager to grow into a full-stack role. My JavaScript expertise and experience at Flipkart make me a strong addition to your team.',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
);


-- ═══════════════════════════════════════════════════════════
-- Candidate 4: Arjun Reddy — Backend + DevOps (should score ~70%)
-- Skills: Java, Python, SQL, Docker, Kubernetes — but weak on JS
-- ═══════════════════════════════════════════════════════════

INSERT INTO users (id, supabase_id, email, full_name, role, is_active)
VALUES (
  'a4444444-4444-4444-4444-444444444444',
  'sub_arjun_test_004',
  'arjun.reddy@testmail.com',
  'Arjun Reddy',
  'job_seeker',
  true
);

INSERT INTO user_profiles (id, user_id, headline, bio, location, linkedin_url, github_url)
VALUES (
  'b4444444-4444-4444-4444-444444444444',
  'a4444444-4444-4444-4444-444444444444',
  'Backend Developer | Java & Python | Cloud Enthusiast',
  'Backend-focused developer with strong Java and Python skills. Experience with microservices architecture, Docker, and Kubernetes. AWS Certified Cloud Practitioner. Looking for a role where I can build reliable, scalable backend systems.',
  'Chennai, India',
  'https://linkedin.com/in/arjunreddy-backend',
  'https://github.com/arjunreddy-dev'
);

INSERT INTO resumes (id, owner_id, title, is_master, raw_text, file_name, processing_status, parsed_data)
VALUES (
  'c4444444-4444-4444-4444-444444444444',
  'a4444444-4444-4444-4444-444444444444',
  'Arjun Resume',
  true,
  'Arjun Reddy | arjun.reddy@testmail.com | Chennai, India

SUMMARY
Backend developer with expertise in Java, Python, and SQL. Built microservices and REST APIs at scale. Experience with Docker, Kubernetes, and AWS cloud services. AWS Certified Cloud Practitioner. B.Tech in Computer Science from SRM University (2025 batch).

EDUCATION
B.Tech in Computer Science — SRM University, Chennai (2021–2025) | CGPA: 8.7/10

CERTIFICATIONS
AWS Certified Cloud Practitioner (2024)

EXPERIENCE
Backend Engineering Intern — Amazon India (May 2024 – Aug 2024)
- Developed Java Spring Boot microservices handling 50K+ requests/day
- Wrote complex SQL queries and optimized database performance by 30%
- Deployed services using Docker and AWS ECS

Open Source Contributor — Apache Projects (2023 – Present)
- Contributed bug fixes to Apache Kafka Java client library
- Built Python automation scripts for CI/CD pipeline testing
- 15+ merged pull requests across 3 repositories

SKILLS
Java, Python, SQL, Spring Boot, Docker, Kubernetes, AWS, PostgreSQL, Redis, Git, Linux, Microservices, REST APIs, CI/CD',
  'arjun_reddy_resume.pdf',
  'completed',
  '{
    "name": "Arjun Reddy",
    "email": "arjun.reddy@testmail.com",
    "phone": "+91 9876543213",
    "summary": "Backend developer with expertise in Java, Python, and SQL. Built microservices at Amazon India. AWS Certified Cloud Practitioner with open source contributions.",
    "skills": ["Java", "Python", "SQL", "Spring Boot", "Docker", "Kubernetes", "AWS", "PostgreSQL", "Redis", "Git", "Linux", "Microservices", "REST APIs", "CI/CD"],
    "experience": [
      {"title": "Backend Engineering Intern", "company": "Amazon India", "duration": "May 2024 – Aug 2024", "description": "Developed Java Spring Boot microservices, optimized SQL queries, deployed with Docker and AWS ECS"},
      {"title": "Open Source Contributor", "company": "Apache Projects", "duration": "2023 – Present", "description": "Contributed to Apache Kafka, built Python automation scripts, 15+ merged PRs"}
    ],
    "education": [
      {"degree": "B.Tech in Computer Science", "institution": "SRM University, Chennai", "year": "2025", "gpa": "8.7/10"}
    ]
  }'
);

INSERT INTO resume_skills (id, resume_id, skill_name, skill_category, proficiency_level)
VALUES
  (gen_random_uuid(), 'c4444444-4444-4444-4444-444444444444', 'Java', 'programming', 'advanced'),
  (gen_random_uuid(), 'c4444444-4444-4444-4444-444444444444', 'Python', 'programming', 'intermediate'),
  (gen_random_uuid(), 'c4444444-4444-4444-4444-444444444444', 'SQL', 'database', 'advanced'),
  (gen_random_uuid(), 'c4444444-4444-4444-4444-444444444444', 'Docker', 'devops', 'intermediate'),
  (gen_random_uuid(), 'c4444444-4444-4444-4444-444444444444', 'Spring Boot', 'framework', 'advanced'),
  (gen_random_uuid(), 'c4444444-4444-4444-4444-444444444444', 'AWS', 'cloud', 'intermediate');

INSERT INTO applications (id, applicant_id, job_id, resume_id, status, cover_letter, created_at, updated_at)
VALUES (
  'd4444444-4444-4444-4444-444444444444',
  'a4444444-4444-4444-4444-444444444444',
  'd8078541-fd89-45ce-9fc3-9d5b51666cd8',
  'c4444444-4444-4444-4444-444444444444',
  'applied',
  'With my backend experience at Amazon and strong Java/Python skills, I am well-prepared for this role. My AWS certification and DevOps knowledge add extra value.',
  NOW() - INTERVAL '4 days',
  NOW() - INTERVAL '4 days'
);


-- ═══════════════════════════════════════════════════════════
-- Candidate 5: Sneha Gupta — Career switcher, minimal match (should score ~35%)
-- Skills: C++, MATLAB, Mechanical Eng background, some Python basics
-- ═══════════════════════════════════════════════════════════

INSERT INTO users (id, supabase_id, email, full_name, role, is_active)
VALUES (
  'a5555555-5555-5555-5555-555555555555',
  'sub_sneha_test_005',
  'sneha.gupta@testmail.com',
  'Sneha Gupta',
  'job_seeker',
  true
);

INSERT INTO user_profiles (id, user_id, headline, bio, location, linkedin_url, github_url)
VALUES (
  'b5555555-5555-5555-5555-555555555555',
  'a5555555-5555-5555-5555-555555555555',
  'Aspiring Software Developer | Mechanical Eng → Tech',
  'Mechanical engineering graduate transitioning to software development. Self-taught programmer with basic Python and C++ skills. Completed online courses in web development. Highly motivated to break into the tech industry.',
  'Delhi, India',
  'https://linkedin.com/in/snehagupta-switch',
  NULL
);

INSERT INTO resumes (id, owner_id, title, is_master, raw_text, file_name, processing_status, parsed_data)
VALUES (
  'c5555555-5555-5555-5555-555555555555',
  'a5555555-5555-5555-5555-555555555555',
  'Sneha Resume',
  true,
  'Sneha Gupta | sneha.gupta@testmail.com | Delhi, India

SUMMARY
Mechanical engineering graduate transitioning to software development. Self-taught in Python and C++ through online courses. Built basic projects including a calculator app and a simple blog. Eager to learn and grow in a software engineering role.

EDUCATION
B.Tech in Mechanical Engineering — DTU Delhi (2021–2025) | CGPA: 7.5/10
Online Certifications: Python for Beginners (Coursera), Web Development Bootcamp (Udemy)

EXPERIENCE
Mechanical Engineering Intern — Tata Motors (Jun 2024 – Aug 2024)
- Worked on CAD modeling and simulation using MATLAB and SolidWorks
- Wrote automation scripts in Python for data processing
- Analyzed manufacturing data using Excel and basic SQL queries

Personal Projects
- Built a simple blog using HTML, CSS, and basic JavaScript
- Created a calculator application using Python Tkinter
- Completed 100+ problems on HackerRank in C++

SKILLS
C++, Python (Basic), MATLAB, HTML, CSS, Basic JavaScript, Excel, AutoCAD, SolidWorks, Basic SQL',
  'sneha_gupta_resume.pdf',
  'completed',
  '{
    "name": "Sneha Gupta",
    "email": "sneha.gupta@testmail.com",
    "phone": "+91 9876543214",
    "summary": "Mechanical engineering graduate transitioning to software development. Self-taught in Python and C++ through online courses. Built basic projects.",
    "skills": ["C++", "Python", "MATLAB", "HTML", "CSS", "JavaScript", "Excel", "AutoCAD", "SolidWorks", "SQL"],
    "experience": [
      {"title": "Mechanical Engineering Intern", "company": "Tata Motors", "duration": "Jun 2024 – Aug 2024", "description": "CAD modeling with MATLAB/SolidWorks, Python automation scripts, basic data analysis"},
      {"title": "Personal Projects", "company": "Self", "duration": "2023 – 2024", "description": "Built a blog (HTML/CSS/JS), calculator app (Python), 100+ HackerRank problems in C++"}
    ],
    "education": [
      {"degree": "B.Tech in Mechanical Engineering", "institution": "DTU Delhi", "year": "2025", "gpa": "7.5/10"}
    ]
  }'
);

INSERT INTO resume_skills (id, resume_id, skill_name, skill_category, proficiency_level)
VALUES
  (gen_random_uuid(), 'c5555555-5555-5555-5555-555555555555', 'C++', 'programming', 'intermediate'),
  (gen_random_uuid(), 'c5555555-5555-5555-5555-555555555555', 'Python', 'programming', 'beginner'),
  (gen_random_uuid(), 'c5555555-5555-5555-5555-555555555555', 'MATLAB', 'tools', 'intermediate'),
  (gen_random_uuid(), 'c5555555-5555-5555-5555-555555555555', 'HTML', 'web', 'beginner'),
  (gen_random_uuid(), 'c5555555-5555-5555-5555-555555555555', 'SQL', 'database', 'beginner');

INSERT INTO applications (id, applicant_id, job_id, resume_id, status, cover_letter, created_at, updated_at)
VALUES (
  'd5555555-5555-5555-5555-555555555555',
  'a5555555-5555-5555-5555-555555555555',
  'd8078541-fd89-45ce-9fc3-9d5b51666cd8',
  'c5555555-5555-5555-5555-555555555555',
  'applied',
  'Although my background is in mechanical engineering, I have been actively learning software development and am eager to transition into tech. I am a fast learner and dedicated to growing my skills.',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
);
