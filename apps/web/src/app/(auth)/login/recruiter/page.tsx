'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { demoLogin } from '@/lib/demo-auth'

export default function RecruiterLoginPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleGoogleLogin() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?role=recruiter`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) {
      console.error('Login error:', error)
      setLoading(false)
    }
  }

  function handleDemoLogin() {
    demoLogin('recruiter')
    router.push('/recruiter/dashboard')
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="relative hidden w-1/2 overflow-hidden bg-recruiter-gradient lg:block">
        <div className="float-shape left-[10%] top-[20%] h-64 w-64 bg-white" />
        <div className="float-shape right-[10%] top-[45%] h-48 w-48 bg-purple-300" />
        <div className="float-shape left-[40%] bottom-[10%] h-32 w-32 bg-purple-200" />

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
              Hire smarter,<br />not harder
            </h2>
            <p className="text-lg text-purple-100/80">
              AI-powered candidate screening that understands skills semantically.
              Reduce hiring time by 70% with transparent, explainable matching.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {[
                { value: '70%', label: 'Faster Hiring' },
                { value: '5x', label: 'Better Shortlists' },
                { value: '0%', label: 'Keyword Bias' },
                { value: '24/7', label: 'AI Screening' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-purple-200">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-purple-200/50">
            &copy; {new Date().getFullYear()} SkillSight
          </p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex w-full flex-col justify-center bg-[#f8f9fb] px-6 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-recruiter-600">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900">SkillSight</span>
          </div>

          <div className="mb-2 inline-flex items-center rounded-full bg-recruiter-50 px-3 py-1 text-xs font-medium text-recruiter-700">
            Recruiter / HR
          </div>

          <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900">
            Recruiter Portal
          </h1>
          <p className="mb-8 text-gray-500">
            Sign in to screen candidates, manage jobs, and hire with AI precision.
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
            className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-recruiter-200 bg-recruiter-50 px-6 py-4 text-base font-medium text-recruiter-700 transition hover:border-recruiter-400 hover:bg-recruiter-100"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
            </svg>
            Demo Login as Sarah Johnson (Recruiter)
          </button>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">RECRUITER TOOLS</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Features */}
          <div className="space-y-3">
            {[
              { icon: '🤖', text: 'Automated AI resume screening & scoring' },
              { icon: '📈', text: 'Semantic candidate ranking & shortlisting' },
              { icon: '🔍', text: 'Explainable match scores — no black box' },
              { icon: '⚡', text: 'Reduce time-to-hire by 70%' },
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
                href="/login/university"
                className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-gray-600 transition hover:border-university-300 hover:text-university-700"
              >
                University
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
