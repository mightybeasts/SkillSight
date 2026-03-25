'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Role = 'student' | 'recruiter' | 'university'

const roleConfig = {
  student: {
    title: 'Student / Job Seeker',
    description: 'Upload your resume, get AI-powered job matches, and close skill gaps.',
    gradient: 'from-student-600 to-student-500',
    bg: 'bg-student-50',
    border: 'border-student-500',
    text: 'text-student-700',
    button: 'bg-student-600 hover:bg-student-700',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
      </svg>
    ),
  },
  recruiter: {
    title: 'Recruiter / HR',
    description: 'Screen candidates with AI, rank applicants, and hire faster.',
    gradient: 'from-recruiter-600 to-recruiter-500',
    bg: 'bg-recruiter-50',
    border: 'border-recruiter-500',
    text: 'text-recruiter-700',
    button: 'bg-recruiter-600 hover:bg-recruiter-700',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
      </svg>
    ),
  },
  university: {
    title: 'University / Institution',
    description: 'Track placements, analyze skill demands, and bridge academia with industry.',
    gradient: 'from-university-600 to-university-500',
    bg: 'bg-university-50',
    border: 'border-university-500',
    text: 'text-university-700',
    button: 'bg-university-600 hover:bg-university-700',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
      </svg>
    ),
  },
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#f8f9fb]"><div className="text-gray-400">Loading...</div></div>}>
      <OnboardingContent />
    </Suspense>
  )
}

function OnboardingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialRole = searchParams.get('role') as Role
  const [role, setRole] = useState<Role>(
    initialRole && roleConfig[initialRole] ? initialRole : 'student',
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/login/student?error=auth_required')
      }
    })
  }, [router])

  async function handleContinue() {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ data: { role } })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    const dashboards: Record<string, string> = {
      student: '/dashboard',
      recruiter: '/recruiter/dashboard',
      university: '/university/dashboard',
    }
    router.push(dashboards[role] || '/dashboard')
  }

  const selectedConfig = roleConfig[role]

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9fb] p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${selectedConfig.gradient}`}>
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-gray-900">SkillSight</span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-glass">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Welcome to SkillSight</h1>
            <p className="mt-2 text-sm text-gray-500">
              Choose how you want to use the platform.
            </p>
          </div>

          <div className="grid gap-3">
            {(Object.keys(roleConfig) as Role[]).map((key) => {
              const config = roleConfig[key]
              const isSelected = role === key

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRole(key)}
                  className={`flex items-start gap-4 rounded-xl border-2 p-5 text-left transition ${
                    isSelected
                      ? `${config.border} ${config.bg}`
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      isSelected
                        ? `bg-gradient-to-br ${config.gradient} text-white`
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {config.icon}
                  </div>
                  <div>
                    <div className="text-base font-semibold text-gray-900">{config.title}</div>
                    <div className="mt-1 text-sm text-gray-500">{config.description}</div>
                  </div>
                </button>
              )
            })}
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
          )}

          <button
            onClick={handleContinue}
            disabled={loading}
            className={`mt-6 w-full rounded-xl px-6 py-3.5 text-base font-semibold text-white transition disabled:opacity-60 ${selectedConfig.button}`}
          >
            {loading ? 'Setting up...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
