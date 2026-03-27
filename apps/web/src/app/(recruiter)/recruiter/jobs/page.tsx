'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import Link from 'next/link'

export default function RecruiterJobsPage() {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['recruiter-jobs'],
    queryFn: () => api.get('/recruiter/jobs/').then((r) => r.data),
    retry: false,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Job Listings</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your posted jobs and review candidates.</p>
        </div>
        <Link href="/recruiter/jobs/new" className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-purple-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Post New Job
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />)}
        </div>
      ) : !jobs?.length ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38" /></svg>
          </div>
          <p className="text-sm font-medium text-gray-900">No jobs posted yet</p>
          <Link href="/recruiter/jobs/new" className="mt-4 inline-flex items-center gap-1 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">Post Your First Job</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job: any) => (
            <div key={job.id} className="rounded-xl border border-gray-200 bg-white p-5 transition hover:shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-sm font-bold text-purple-600">{job.title?.[0]}</div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{job.title}</h3>
                    <p className="text-xs text-gray-500">{job.company} &middot; {job.location || 'Remote'} &middot; {job.experience_level} &middot; {job.job_type?.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${job.status === 'active' ? 'bg-green-50 text-green-700' : job.status === 'draft' ? 'bg-gray-100 text-gray-500' : 'bg-red-50 text-red-600'}`}>{job.status}</span>
                  <Link href={`/recruiter/jobs/${job.id}/candidates`} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50">
                    View Candidates
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                  </Link>
                </div>
              </div>
              {job.salary_min && job.salary_max && (
                <p className="mt-2 text-xs text-gray-500">Salary: ${(job.salary_min/1000).toFixed(0)}K - ${(job.salary_max/1000).toFixed(0)}K {job.salary_currency}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
