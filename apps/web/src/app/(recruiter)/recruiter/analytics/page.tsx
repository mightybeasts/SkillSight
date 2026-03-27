'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface DashboardStats {
  active_jobs: number
  total_applications: number
  shortlisted: number
  avg_match_score: number
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/recruiter/dashboard/stats/')
      .then((res) => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hiring Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">Overview of your hiring pipeline performance and trends.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-gray-200 bg-white" />
          ))}
        </div>
      </div>
    )
  }

  const summaryCards = [
    {
      label: 'Active Jobs',
      value: stats?.active_jobs ?? 0,
      icon: (
        <svg className="h-6 w-6 text-recruiter-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
        </svg>
      ),
      iconBg: 'bg-recruiter-50',
    },
    {
      label: 'Total Applications',
      value: stats?.total_applications ?? 0,
      icon: (
        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
        </svg>
      ),
      iconBg: 'bg-blue-50',
    },
    {
      label: 'Shortlisted',
      value: stats?.shortlisted ?? 0,
      icon: (
        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
      iconBg: 'bg-green-50',
    },
    {
      label: 'Avg Match Score',
      value: stats?.avg_match_score ? `${Math.round(stats.avg_match_score * 100)}%` : '—',
      icon: (
        <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
        </svg>
      ),
      iconBg: 'bg-orange-50',
    },
  ]

  const hasData = (stats?.active_jobs ?? 0) > 0 || (stats?.total_applications ?? 0) > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hiring Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">Overview of your hiring pipeline performance and trends.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.iconBg}`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!hasData && (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
          <h3 className="mt-4 text-sm font-semibold text-gray-900">No analytics data yet</h3>
          <p className="mt-1 text-sm text-gray-500">Post jobs and receive applications to see your hiring analytics here.</p>
        </div>
      )}
    </div>
  )
}
