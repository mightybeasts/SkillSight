'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import Link from 'next/link'
import { formatScore, getScoreColor } from '@/lib/utils'

export default function DashboardPage() {
  const { data: resumes, isLoading: resumesLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => api.get('/resumes').then((r) => r.data),
  })

  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.get('/jobs?limit=6').then((r) => r.data),
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back 👋</h1>
        <p className="mt-1 text-gray-500">Here&apos;s what&apos;s happening with your job search.</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/resumes/upload"
          className="flex items-center gap-4 rounded-xl border-2 border-dashed border-brand-300 p-5 transition hover:bg-brand-50"
        >
          <span className="text-3xl">📄</span>
          <div>
            <p className="font-semibold text-brand-700">Upload Resume</p>
            <p className="text-sm text-gray-500">Add or update your resume</p>
          </div>
        </Link>
        <Link
          href="/jobs"
          className="flex items-center gap-4 rounded-xl bg-brand-600 p-5 text-white transition hover:bg-brand-700"
        >
          <span className="text-3xl">🔍</span>
          <div>
            <p className="font-semibold">Browse Jobs</p>
            <p className="text-sm text-blue-200">Find your next role</p>
          </div>
        </Link>
        <Link
          href="/match"
          className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-purple-600 to-brand-600 p-5 text-white transition hover:opacity-90"
        >
          <span className="text-3xl">⚡</span>
          <div>
            <p className="font-semibold">Analyze Match</p>
            <p className="text-sm text-purple-200">Check your fit for a role</p>
          </div>
        </Link>
      </div>

      {/* Resumes */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your Resumes</h2>
          <Link href="/resumes" className="text-sm text-brand-600 hover:underline">
            View all →
          </Link>
        </div>
        {resumesLoading ? (
          <div className="text-gray-400">Loading...</div>
        ) : resumes?.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center text-gray-400">
            No resumes yet.{' '}
            <Link href="/resumes/upload" className="text-brand-600 hover:underline">
              Upload your first resume
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {resumes?.slice(0, 4).map((r: any) => (
              <div key={r.id} className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{r.title}</p>
                    {r.is_master && (
                      <span className="mt-1 inline-block rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-700">
                        Master Resume
                      </span>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      r.processing_status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : r.processing_status === 'processing'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {r.processing_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Latest jobs */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Latest Jobs</h2>
          <Link href="/jobs" className="text-sm text-brand-600 hover:underline">
            View all →
          </Link>
        </div>
        <div className="space-y-3">
          {jobs?.slice(0, 5).map((job: any) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm transition hover:border-brand-300"
            >
              <div>
                <p className="font-medium text-gray-900">{job.title}</p>
                <p className="text-sm text-gray-500">
                  {job.company} · {job.location || 'Remote'}
                </p>
              </div>
              <span className="rounded-lg bg-gray-100 px-3 py-1 text-sm text-gray-600">
                {job.job_type?.replace('_', ' ')}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
