import Link from 'next/link'

const roles = [
  {
    id: 'student',
    title: 'Student / Job Seeker',
    description: 'Upload your resume, get AI-powered job matches, identify skill gaps, and get personalized learning paths.',
    href: '/login/student',
    gradient: 'from-student-700 to-student-500',
    bgClass: 'bg-student-50',
    borderClass: 'border-student-200 hover:border-student-400',
    iconBg: 'bg-student-100',
    iconColor: 'text-student-600',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
      </svg>
    ),
    features: ['AI Resume Analysis', 'Job Match Scores', 'Skill Gap Detection', 'Learning Paths'],
  },
  {
    id: 'recruiter',
    title: 'Recruiter / HR',
    description: 'Post jobs, screen candidates with semantic AI matching, rank applicants, and reduce hiring time by 70%.',
    href: '/login/recruiter',
    gradient: 'from-recruiter-700 to-recruiter-500',
    bgClass: 'bg-recruiter-50',
    borderClass: 'border-recruiter-200 hover:border-recruiter-400',
    iconBg: 'bg-recruiter-100',
    iconColor: 'text-recruiter-600',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
      </svg>
    ),
    features: ['AI Candidate Screening', 'Semantic Ranking', 'Explainable Scores', 'Bias Reduction'],
  },
  {
    id: 'university',
    title: 'University / Institution',
    description: 'Track student placement rates, analyze industry skill demands, and bridge the gap between academia and industry.',
    href: '/login/university',
    gradient: 'from-university-700 to-university-500',
    bgClass: 'bg-university-50',
    borderClass: 'border-university-200 hover:border-university-400',
    iconBg: 'bg-university-100',
    iconColor: 'text-university-600',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
      </svg>
    ),
    features: ['Placement Analytics', 'Skill Demand Trends', 'Student Tracking', 'Industry Bridge'],
  },
]

const stats = [
  { value: '94%', label: 'Match Accuracy' },
  { value: '70%', label: 'Faster Hiring' },
  { value: '3x', label: 'More Interviews' },
  { value: '500+', label: 'Skills Tracked' },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      {/* ──── Navbar ──── */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-student-600 to-student-500">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Skill<span className="text-student-600">Sight</span>
            </span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-gray-600 transition hover:text-gray-900">Features</a>
            <a href="#roles" className="text-sm font-medium text-gray-600 transition hover:text-gray-900">Get Started</a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 transition hover:text-gray-900">How It Works</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login/student" className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100">
              Sign In
            </Link>
            <Link href="#roles" className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ──── Hero ──── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-student-900">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-24 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 backdrop-blur">
              <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              AI-Powered Recruitment Platform
            </div>

            <h1 className="mb-6 text-5xl font-bold tracking-tight text-white lg:text-7xl">
              Smarter hiring<br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
                starts here
              </span>
            </h1>

            <p className="mb-10 text-lg leading-relaxed text-gray-400 lg:text-xl">
              Beyond keyword filtering. SkillSight uses NLP and explainable AI to semantically
              match candidates to jobs — transparently scoring skills, identifying gaps,
              and recommending growth paths.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="#roles"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-gray-900 shadow-lg transition hover:bg-gray-100 hover:shadow-xl"
              >
                Get Started Free
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 5.25 7.5 7.5 7.5-7.5m-15 6 7.5 7.5 7.5-7.5" />
                </svg>
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur transition hover:bg-white/10"
              >
                See How It Works
              </a>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mx-auto mt-20 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="mt-1 text-xs text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── Role Selection ──── */}
      <section id="roles" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 lg:text-4xl">
              Choose your portal
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-500">
              SkillSight provides tailored experiences for every stakeholder in the recruitment process.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {roles.map((role) => (
              <Link
                key={role.id}
                href={role.href}
                className={`group relative overflow-hidden rounded-2xl border-2 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-glass-lg hover:-translate-y-1 ${role.borderClass}`}
              >
                {/* Icon */}
                <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl ${role.iconBg} ${role.iconColor}`}>
                  {role.icon}
                </div>

                <h3 className="mb-3 text-xl font-bold text-gray-900">{role.title}</h3>
                <p className="mb-6 text-sm leading-relaxed text-gray-500">{role.description}</p>

                {/* Feature pills */}
                <div className="mb-6 flex flex-wrap gap-2">
                  {role.features.map((feature) => (
                    <span
                      key={feature}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${role.bgClass} ${role.iconColor}`}
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <div className={`inline-flex items-center gap-2 text-sm font-semibold ${role.iconColor} transition group-hover:gap-3`}>
                  Get Started
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ──── How It Works ──── */}
      <section id="how-it-works" className="border-t border-gray-200 bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 lg:text-4xl">
              How SkillSight Works
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-500">
              Our AI pipeline goes beyond keywords to truly understand skills and experience.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: '01',
                title: 'Upload Resume',
                desc: 'Upload your PDF resume or paste text. Our NLP engine extracts skills, experience, and qualifications.',
                color: 'text-student-600',
                bg: 'bg-student-50',
              },
              {
                step: '02',
                title: 'Semantic Analysis',
                desc: 'Transformer-based models generate contextual embeddings — understanding meaning, not just keywords.',
                color: 'text-recruiter-600',
                bg: 'bg-recruiter-50',
              },
              {
                step: '03',
                title: 'Match & Score',
                desc: 'AI computes similarity scores between your profile and job requirements with full transparency.',
                color: 'text-university-600',
                bg: 'bg-university-50',
              },
              {
                step: '04',
                title: 'Grow & Apply',
                desc: 'See matched skills, gaps, and personalized learning recommendations to boost your match score.',
                color: 'text-student-600',
                bg: 'bg-student-50',
              },
            ].map((item) => (
              <div key={item.step} className="relative rounded-xl border border-gray-100 p-6">
                <span className={`mb-4 inline-block text-4xl font-bold ${item.color} opacity-20`}>
                  {item.step}
                </span>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── Features Grid ──── */}
      <section id="features" className="border-t border-gray-200 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 lg:text-4xl">
              Built for modern recruitment
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Explainable AI', desc: 'Every score comes with human-readable justifications. See exactly why a candidate matched.', icon: '🔍' },
              { title: 'Semantic Matching', desc: 'NLP embeddings understand "React" and "ReactJS" are the same. No more keyword mismatches.', icon: '🧠' },
              { title: 'Skill Gap Analysis', desc: 'Automatically detect missing competencies and rank them by importance to the role.', icon: '📊' },
              { title: 'Learning Paths', desc: 'Personalized course and certification recommendations to close skill gaps.', icon: '📚' },
              { title: 'Master Resume', desc: 'Maintain one resume. AI generates role-specific versions that highlight relevant experience.', icon: '📄' },
              { title: 'Bias Reduction', desc: 'Structured evaluation metrics minimize unconscious bias in screening decisions.', icon: '⚖️' },
            ].map((f) => (
              <div key={f.title} className="stat-card">
                <div className="mb-4 text-3xl">{f.icon}</div>
                <h3 className="mb-2 text-base font-semibold text-gray-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── Footer ──── */}
      <footer className="border-t border-gray-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-student-600 to-student-500">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-900">SkillSight</span>
            </div>
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} SkillSight. AI-powered recruitment for a better tomorrow.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
