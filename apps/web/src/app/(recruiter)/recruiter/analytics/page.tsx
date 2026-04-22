'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'

interface Analytics {
  summary: {
    active_jobs: number
    total_applications: number
    total_shortlisted: number
    avg_match_score: number | null
  }
  pipeline: Record<string, number>
  score_distribution: { bucket: string; count: number }[]
  top_missing_skills: { skill: string; count: number }[]
  per_job: {
    job_id: string
    title: string
    status: string
    applications: number
    avg_match_score: number | null
    shortlisted: number
    rejected: number
  }[]
}

const PIPELINE_STEPS: { key: string; label: string; color: string }[] = [
  { key: 'applied', label: 'Applied', color: 'bg-blue-500' },
  { key: 'screening', label: 'Screening', color: 'bg-indigo-500' },
  { key: 'shortlisted', label: 'Shortlisted', color: 'bg-green-500' },
  { key: 'interview', label: 'Interview', color: 'bg-purple-500' },
  { key: 'offer', label: 'Offer', color: 'bg-teal-500' },
  { key: 'rejected', label: 'Rejected', color: 'bg-red-400' },
  { key: 'withdrawn', label: 'Withdrawn', color: 'bg-gray-400' },
]

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get('/recruiter/analytics')
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load analytics.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Header />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-gray-200 bg-white" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-white" />
      </div>
    )
  }

  if (!data || error) {
    return (
      <div className="space-y-6">
        <Header />
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-600">{error || 'No analytics data yet.'}</p>
        </div>
      </div>
    )
  }

  const { summary, pipeline, score_distribution, top_missing_skills, per_job } = data
  const pipelineMax = Math.max(...PIPELINE_STEPS.map((s) => pipeline[s.key] || 0), 1)
  const scoreMax = Math.max(...score_distribution.map((s) => s.count), 1)
  const missingMax = Math.max(...top_missing_skills.map((s) => s.count), 1)

  const hasData = summary.total_applications > 0 || summary.active_jobs > 0

  return (
    <div className="space-y-6">
      <Header />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard label="Active Jobs" value={summary.active_jobs} tone="purple" />
        <SummaryCard label="Total Applications" value={summary.total_applications} tone="blue" />
        <SummaryCard label="Shortlisted" value={summary.total_shortlisted} tone="green" />
        <SummaryCard
          label="Avg Match Score"
          value={summary.avg_match_score != null ? `${Math.round(summary.avg_match_score * 100)}%` : '—'}
          tone="orange"
        />
      </div>

      {!hasData ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <h3 className="text-sm font-semibold text-gray-900">No analytics data yet</h3>
          <p className="mt-1 text-sm text-gray-500">Post jobs and receive applications to see insights here.</p>
        </div>
      ) : (
        <>
          {/* Pipeline funnel */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Hiring Pipeline</h2>
                <p className="mt-0.5 text-xs text-gray-500">Where your candidates are in the funnel.</p>
              </div>
              <span className="text-xs text-gray-400">{summary.total_applications} total</span>
            </div>
            <div className="space-y-2.5">
              {PIPELINE_STEPS.map((step) => {
                const count = pipeline[step.key] || 0
                const pct = summary.total_applications > 0 ? (count / summary.total_applications) * 100 : 0
                const width = (count / pipelineMax) * 100
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div className="w-24 shrink-0 text-xs font-medium text-gray-600">{step.label}</div>
                    <div className="relative h-6 flex-1 rounded-md bg-gray-100">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-md ${step.color} transition-all`}
                        style={{ width: `${Math.max(width, count > 0 ? 2 : 0)}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-medium">
                        <span className={count > 0 ? 'text-white' : 'text-gray-400'}>{count}</span>
                        <span className="text-gray-500">{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Score distribution + Top missing skills (side by side on lg) */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Score distribution */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-gray-900">Candidate Quality Distribution</h2>
              <p className="mt-0.5 text-xs text-gray-500">AI match-score buckets across all your applicants.</p>
              <div className="mt-5 flex items-end gap-3" style={{ height: '180px' }}>
                {score_distribution.map((b) => {
                  const h = (b.count / scoreMax) * 100
                  const tone = b.bucket === '85-100%' ? 'bg-green-500' : b.bucket === '70-84%' ? 'bg-yellow-400' : b.bucket === '50-69%' ? 'bg-orange-400' : 'bg-red-400'
                  return (
                    <div key={b.bucket} className="flex flex-1 flex-col items-center gap-2">
                      <div className="flex h-full w-full items-end">
                        <div
                          className={`w-full rounded-t-md ${tone} transition-all`}
                          style={{ height: `${Math.max(h, b.count > 0 ? 6 : 0)}%` }}
                          title={`${b.count} candidates`}
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-gray-900">{b.count}</p>
                        <p className="text-[10px] font-medium text-gray-500">{b.bucket}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Top missing skills */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-gray-900">Top Missing Skills</h2>
              <p className="mt-0.5 text-xs text-gray-500">Skills most often absent from applicants — consider tweaking your postings.</p>
              {top_missing_skills.length === 0 ? (
                <p className="mt-6 text-center text-sm text-gray-500">No skill gaps detected yet.</p>
              ) : (
                <div className="mt-4 space-y-2">
                  {top_missing_skills.map((s) => {
                    const w = (s.count / missingMax) * 100
                    return (
                      <div key={s.skill} className="flex items-center gap-3">
                        <span className="w-32 shrink-0 truncate text-xs font-medium text-gray-700" title={s.skill}>{s.skill}</span>
                        <div className="relative h-5 flex-1 rounded-md bg-gray-100">
                          <div className="absolute inset-y-0 left-0 rounded-md bg-red-400" style={{ width: `${w}%` }} />
                        </div>
                        <span className="w-8 shrink-0 text-right text-xs font-semibold text-gray-700">{s.count}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Per-job breakdown */}
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-900">Per-Job Performance</h2>
              <p className="mt-0.5 text-xs text-gray-500">Ranked by applications received.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-3">Job</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Applications</th>
                    <th className="px-5 py-3 text-right">Avg Match</th>
                    <th className="px-5 py-3 text-right">Shortlisted</th>
                    <th className="px-5 py-3 text-right">Rejected</th>
                    <th className="px-5 py-3 text-right">Shortlist Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {per_job.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-sm text-gray-500">No jobs posted yet.</td>
                    </tr>
                  ) : (
                    per_job.map((j) => {
                      const rate = j.applications > 0 ? (j.shortlisted / j.applications) * 100 : 0
                      const avg = j.avg_match_score != null ? `${Math.round(j.avg_match_score * 100)}%` : '—'
                      return (
                        <tr key={j.job_id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                          <td className="px-5 py-3">
                            <Link href={`/recruiter/jobs/${j.job_id}`} className="font-medium text-gray-900 hover:text-purple-600">{j.title}</Link>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${j.status === 'active' ? 'bg-green-50 text-green-700' : j.status === 'draft' ? 'bg-gray-100 text-gray-500' : 'bg-red-50 text-red-600'}`}>{j.status}</span>
                          </td>
                          <td className="px-5 py-3 text-right text-gray-900">{j.applications}</td>
                          <td className="px-5 py-3 text-right text-gray-900">{avg}</td>
                          <td className="px-5 py-3 text-right text-green-700">{j.shortlisted}</td>
                          <td className="px-5 py-3 text-right text-red-600">{j.rejected}</td>
                          <td className="px-5 py-3 text-right text-gray-700">{rate.toFixed(0)}%</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Header() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Hiring Analytics</h1>
      <p className="mt-1 text-sm text-gray-500">Pipeline, candidate quality, skill gaps, and per-job performance.</p>
    </div>
  )
}

function SummaryCard({ label, value, tone }: { label: string; value: number | string; tone: 'purple' | 'blue' | 'green' | 'orange' }) {
  const bg = {
    purple: 'bg-purple-50 text-purple-700',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    orange: 'bg-orange-50 text-orange-700',
  }[tone]
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      <span className={`mt-3 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${bg}`}>{tone === 'orange' ? 'quality' : tone === 'green' ? 'outcome' : tone === 'blue' ? 'volume' : 'supply'}</span>
    </div>
  )
}
