'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useState } from 'react'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const role = searchParams.get('role') || 'job_seeker'
  const [loading, setLoading] = useState(false)

  async function handleGoogleLogin() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?role=${role}`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) {
      console.error('Login error:', error)
      setLoading(false)
    }
  }

  const isRecruiter = role === 'recruiter'

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-brand-700">SkillSight</h1>
          <p className="mt-2 text-gray-500">
            {isRecruiter ? 'Recruiter Portal' : 'Job Seeker Portal'}
          </p>
        </div>

        <div className="mb-6 rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
          {isRecruiter
            ? '👔 Post jobs, screen candidates with AI, and build your team faster.'
            : '🎯 Upload your resume, get matched to roles, and close skill gaps.'}
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-gray-200 bg-white px-6 py-4 text-base font-medium transition hover:bg-gray-50 disabled:opacity-60"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>

        <p className="mt-6 text-center text-xs text-gray-400">
          By continuing, you agree to SkillSight&apos;s Terms of Service and Privacy Policy.
        </p>

        <div className="mt-4 text-center">
          <button
            onClick={() => router.push(`/login?role=${isRecruiter ? 'job_seeker' : 'recruiter'}`)}
            className="text-sm text-brand-600 hover:underline"
          >
            {isRecruiter ? 'Looking for a job instead?' : 'Are you a recruiter?'}
          </button>
        </div>
      </div>
    </div>
  )
}
