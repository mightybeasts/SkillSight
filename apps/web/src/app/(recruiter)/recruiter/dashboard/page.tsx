'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import Link from 'next/link'
import { formatScore, getScoreColor } from '@/lib/utils'

export default function RecruiterDashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ['recruiter-stats'],
    queryFn: () => api.get('/recruiter/dashboard/stats').then((r) => r.data),
  })

  const { data: jobs } = useQuery({
    queryKey: ['recruiter-jobs'],
    queryFn: () => api.get('/recruiter/jobs').then((r) => r.data),
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recruiter Dashboard</h1>
          <p className="mt-1 text-gray-500">AI-ranked candidates and hiring pipeline.</p>
        </div>
        <Link
          href="/recruiter/jobs/new"
          className="rounded-xl bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-700"
        >
          + Post New Job
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Active Jobs', value: stats?.total_jobs ?? '—', icon: '💼' },
          { label: 'Total Applications', value: stats?.total_applications ?? '—', icon: '📋' },
          { label: 'Shortlisted', value: stats?.total_shortlisted ?? '—', icon: '⭐' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{stat.icon}</span>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Jobs list */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Your Job Listings</h2>
        {!jobs?.length ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
            <p className="text-gray-400">No jobs posted yet.</p>
            <Link
              href="/recruiter/jobs/new"
              className="mt-3 inline-block text-sm text-brand-600 hover:underline"
            >
              Post your first job →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job: any) => (
              <Link
                key={job.id}
                href={`/recruiter/jobs/${job.id}/candidates`}
                className="flex items-center justify-between rounded-2xl border bg-white p-5 shadow-sm transition hover:border-brand-300"
              >
                <div>
                  <p className="font-semibold text-gray-900">{job.title}</p>
                  <p className="text-sm text-gray-500">
                    {job.company} · {job.location || 'Remote'} · {job.job_type?.replace('_', ' ')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      job.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {job.status}
                  </span>
                  <span className="text-gray-400">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
