'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { demoLogin } from '@/lib/demo-auth'

export default function UniversityLoginPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleGoogleLogin() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?role=university`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) {
      console.error('Login error:', error)
      setLoading(false)
    }
  }

  function handleDemoLogin() {
    demoLogin('university')
    router.push('/university/dashboard')
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="relative hidden w-1/2 overflow-hidden bg-university-gradient lg:block">
        <div className="float-shape left-[15%] top-[15%] h-64 w-64 bg-white" />
        <div className="float-shape right-[10%] top-[50%] h-48 w-48 bg-green-300" />
        <div className="float-shape left-[35%] bottom-[10%] h-32 w-32 bg-green-200" />

        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">SkillSight</span>
            </Link>
          </div>

          <div className="max-w-md">
            <h2 className="mb-4 text-4xl font-bold leading-tight text-white">
              Bridge academia<br />and industry
            </h2>
            <p className="text-lg text-green-100/80">
              Track student placement rates, analyze industry skill demands, and prepare graduates
              for the real-world job market with data-driven insights.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {[
                { value: '360°', label: 'Placement View' },
                { value: 'Real-time', label: 'Skill Demand' },
                { value: '50+', label: 'Industry Sectors' },
                { value: '↑ 40%', label: 'Placement Rate' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-green-200">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-green-200/50">
            &copy; {new Date().getFullYear()} SkillSight
          </p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex w-full flex-col justify-center bg-[#f8f9fb] px-6 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-university-600">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900">SkillSight</span>
          </div>

          <div className="mb-2 inline-flex items-center rounded-full bg-university-50 px-3 py-1 text-xs font-medium text-university-700">
            University / Institution
          </div>

          <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900">
            Institution Portal
          </h1>
          <p className="mb-8 text-gray-500">
            Sign in to track placements, analyze skill trends, and support student careers.
          </p>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-gray-200 bg-white px-6 py-4 text-base font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 hover:shadow-md disabled:opacity-60"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>

          {/* Demo Login */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">OR</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <button
            onClick={handleDemoLogin}
            className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-university-200 bg-university-50 px-6 py-4 text-base font-medium text-university-700 transition hover:border-university-400 hover:bg-university-100"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
            </svg>
            Demo Login as Dr. Emily Watson (University)
          </button>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">INSTITUTION TOOLS</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Features */}
          <div className="space-y-3">
            {[
              { icon: '📊', text: 'Student placement rate analytics dashboard' },
              { icon: '🌐', text: 'Industry skill demand trend analysis' },
              { icon: '🎓', text: 'Track student career progress & outcomes' },
              { icon: '🔗', text: 'Connect students directly with recruiters' },
            ].map((feature) => (
              <div key={feature.text} className="flex items-center gap-3 rounded-lg bg-white p-3 text-sm text-gray-600">
                <span className="text-lg">{feature.icon}</span>
                {feature.text}
              </div>
            ))}
          </div>

          {/* Other portals */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <p className="mb-3 text-xs font-medium text-gray-400">OTHER PORTALS</p>
            <div className="flex gap-3">
              <Link
                href="/login/student"
                className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-gray-600 transition hover:border-student-300 hover:text-student-700"
              >
                Job Seeker
              </Link>
              <Link
                href="/login/recruiter"
                className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-gray-600 transition hover:border-recruiter-300 hover:text-recruiter-700"
              >
                Recruiter
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            By continuing, you agree to SkillSight&apos;s Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}
