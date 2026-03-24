import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 text-white">
      <div className="container mx-auto max-w-4xl px-6 text-center">
        <div className="mb-6 inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur">
          ✨ AI-Powered Recruitment Platform
        </div>

        <h1 className="mb-6 text-6xl font-bold tracking-tight">
          Skill<span className="text-blue-300">Sight</span>
        </h1>

        <p className="mb-4 text-2xl font-light text-blue-100">
          Semantic job matching. Transparent AI scoring.
        </p>
        <p className="mb-12 max-w-2xl mx-auto text-lg text-blue-200">
          Beyond keyword filtering — SkillSight understands your skills, identifies gaps,
          and matches you to the right opportunities with full explainability.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login?role=job_seeker"
            className="rounded-xl bg-white px-8 py-4 text-lg font-semibold text-brand-700 shadow-lg transition hover:bg-blue-50"
          >
            Find Jobs →
          </Link>
          <Link
            href="/login?role=recruiter"
            className="rounded-xl border-2 border-white/40 bg-white/10 px-8 py-4 text-lg font-semibold backdrop-blur transition hover:bg-white/20"
          >
            Post Jobs & Hire
          </Link>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {[
            { icon: '🎯', title: 'Semantic Matching', desc: 'NLP embeddings go beyond keywords' },
            { icon: '📊', title: 'Transparent Scores', desc: 'Explainable AI — see why you matched' },
            { icon: '📚', title: 'Skill Gap Guidance', desc: 'Personalized learning recommendations' },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl bg-white/10 p-6 backdrop-blur">
              <div className="mb-3 text-4xl">{f.icon}</div>
              <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
              <p className="text-sm text-blue-200">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
