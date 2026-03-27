import Link from 'next/link'

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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-recruiter-600 to-recruiter-500">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Skill<span className="text-recruiter-600">Sight</span>
            </span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-gray-600 transition hover:text-gray-900">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 transition hover:text-gray-900">How It Works</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100">
              Sign In
            </Link>
            <Link href="/login" className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ──── Hero ──── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-recruiter-900">
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
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
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
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-gray-900 shadow-lg transition hover:bg-gray-100 hover:shadow-xl"
              >
                Get Started Free
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
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

      {/* ──── How It Works ──── */}
      <section id="how-it-works" className="py-24">
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
                title: 'Post a Job',
                desc: 'Create a job listing with required skills, experience levels, and role details.',
                color: 'text-recruiter-600',
                bg: 'bg-recruiter-50',
              },
              {
                step: '02',
                title: 'Candidates Apply',
                desc: 'Job seekers upload resumes via our mobile app. Our NLP engine extracts and embeds their skills.',
                color: 'text-recruiter-600',
                bg: 'bg-recruiter-50',
              },
              {
                step: '03',
                title: 'AI Matching',
                desc: 'Transformer-based models compute semantic similarity scores between candidates and your job requirements.',
                color: 'text-recruiter-600',
                bg: 'bg-recruiter-50',
              },
              {
                step: '04',
                title: 'Hire with Confidence',
                desc: 'Review ranked candidates with explainable match scores, skill breakdowns, and gap analysis.',
                color: 'text-recruiter-600',
                bg: 'bg-recruiter-50',
              },
            ].map((item) => (
              <div key={item.step} className="relative rounded-xl border border-gray-100 bg-white p-6">
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
      <section id="features" className="border-t border-gray-200 bg-white py-24">
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
              { title: 'AI Candidate Screening', desc: 'Automated resume screening and scoring powered by transformer models.', icon: '🤖' },
              { title: 'Bias Reduction', desc: 'Structured evaluation metrics minimize unconscious bias in screening decisions.', icon: '⚖️' },
              { title: 'Semantic Ranking', desc: 'Rank candidates by true skill relevance, not just keyword frequency.', icon: '📈' },
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
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-recruiter-600 to-recruiter-500">
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
