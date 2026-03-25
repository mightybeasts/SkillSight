'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import Link from 'next/link'

export default function JobsPage() {
  const [search, setSearch] = useState('')
  const [remoteOnly, setRemoteOnly] = useState(false)

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs', search, remoteOnly],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (remoteOnly) params.set('is_remote', 'true')
      params.set('limit', '50')
      return api.get(`/jobs/?${params}`).then((r) => r.data)
    },
  })

  function formatSalary(min?: number, max?: number, currency?: string) {
    if (!min && !max) return null
    const fmt = (n: number) => `${currency === 'USD' ? '$' : ''}${(n / 1000).toFixed(0)}K`
    if (min && max) return `${fmt(min)} - ${fmt(max)}`
    return min ? `From ${fmt(min)}` : `Up to ${fmt(max!)}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Browse Jobs</h1>
          <p className="mt-1 text-sm text-gray-500">{jobs?.length ?? 0} open positions</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, company, or skill..." className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <button onClick={() => setRemoteOnly(!remoteOnly)} className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${remoteOnly ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
          Remote Only
        </button>
      </div>

      {/* Job Cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 animate-pulse rounded-xl bg-gray-100" />)}
        </div>
      ) : !jobs?.length ? (
        <div className="flex flex-col items-center py-16 text-center">
          <svg className="mb-4 h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
          <p className="text-sm font-medium text-gray-900">No jobs found</p>
          <p className="mt-1 text-xs text-gray-500">Try different search terms or filters</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job: any) => (
            <Link key={job.id} href={`/jobs/${job.id}`} className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-blue-200 hover:shadow-md">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-sm font-bold text-gray-600">{job.company?.[0]}</div>
                <div className="flex gap-1.5">
                  {job.is_remote && <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">Remote</span>}
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">{job.experience_level}</span>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600">{job.title}</h3>
              <p className="mt-1 text-xs text-gray-500">{job.company} &middot; {job.location || 'Remote'}</p>
              <div className="mt-3 flex items-center justify-between">
                {formatSalary(job.salary_min, job.salary_max, job.salary_currency) ? (
                  <span className="text-xs font-medium text-gray-700">{formatSalary(job.salary_min, job.salary_max, job.salary_currency)}</span>
                ) : <span />}
                <span className="rounded bg-gray-50 px-2 py-1 text-[10px] font-medium text-gray-500">{job.job_type?.replace('_', ' ')}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
