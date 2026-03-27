'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import Link from 'next/link'

interface Job {
  id: string
  title: string
  company: string
  status: string
}

interface Applicant {
  application_id: string
  candidate_name: string
  candidate_email: string
  status: string
  applied_at: string
  match: {
    overall_score: number
    skill_score: number
    semantic_score: number
    matched_skills: any[]
    missing_skills: any[]
    explanation: string
    is_shortlisted: boolean
  } | null
  resume: {
    summary: string
    skills: any[]
  } | null
  job_id: string
  job_title: string
}

export default function CandidatesPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [allApplicants, setAllApplicants] = useState<Applicant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [minMatch, setMinMatch] = useState(0)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    api.get('/recruiter/jobs')
      .then(async (res) => {
        const jobList: Job[] = Array.isArray(res.data) ? res.data : []
        setJobs(jobList)

        const applicants: Applicant[] = []
        for (const job of jobList) {
          try {
            const r = await api.get(`/recruiter/jobs/${job.id}/applicants`)
            const data = r.data?.applicants || []
            applicants.push(...data.map((a: any) => ({ ...a, job_id: job.id, job_title: job.title })))
          } catch { /* no applicants */ }
        }
        setAllApplicants(applicants)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = allApplicants
    .sort((a, b) => (b.match?.overall_score || 0) - (a.match?.overall_score || 0))
    .filter((a) => {
      if (search) {
        const q = search.toLowerCase()
        if (!a.candidate_name?.toLowerCase().includes(q) && !a.candidate_email?.toLowerCase().includes(q)) return false
      }
      if (minMatch > 0 && (a.match?.overall_score || 0) * 100 < minMatch) return false
      if (statusFilter !== 'all' && a.status !== statusFilter) return false
      return true
    })

  const totalShortlisted = allApplicants.filter(a => a.status === 'shortlisted').length
  const totalRejected = allApplicants.filter(a => a.status === 'rejected').length
  const avgScore = allApplicants.length > 0
    ? Math.round((allApplicants.reduce((sum, a) => sum + (a.match?.overall_score || 0), 0) / allApplicants.length) * 100)
    : 0

  function getScoreColor(score: number) {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  function getBarColor(score: number) {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    if (score >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  function getStatusBadge(status: string) {
    const map: Record<string, string> = {
      applied: 'bg-blue-50 text-blue-700',
      shortlisted: 'bg-green-50 text-green-700',
      rejected: 'bg-red-50 text-red-600',
      screening: 'bg-yellow-50 text-yellow-700',
      interview: 'bg-purple-50 text-purple-700',
      withdrawn: 'bg-gray-50 text-gray-500',
    }
    return map[status] || 'bg-gray-50 text-gray-500'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Candidates</h1>
        <p className="mt-1 text-sm text-gray-500">AI-ranked candidates across all your job listings.</p>
      </div>

      {/* Stats */}
      {!loading && allApplicants.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total Candidates', value: allApplicants.length, color: 'text-gray-900' },
            { label: 'Avg Match', value: `${avgScore}%`, color: avgScore >= 70 ? 'text-green-600' : 'text-yellow-600' },
            { label: 'Shortlisted', value: totalShortlisted, color: 'text-green-600' },
            { label: 'Rejected', value: totalRejected, color: 'text-red-600' },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">Search</label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">Min Match: {minMatch}%</label>
            <input
              type="range"
              min={0}
              max={100}
              value={minMatch}
              onChange={(e) => setMinMatch(Number(e.target.value))}
              className="mt-2 w-full accent-purple-600"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="all">All Statuses</option>
              <option value="applied">Applied</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
              <option value="screening">Screening</option>
              <option value="interview">Interview</option>
            </select>
          </div>
        </div>
      </div>

      {/* Candidate List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <h3 className="text-sm font-semibold text-gray-900">No candidates found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {allApplicants.length === 0 ? 'No one has applied to your jobs yet.' : 'Try adjusting your filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((applicant, index) => {
            const score = applicant.match ? Math.round(applicant.match.overall_score * 100) : null

            return (
              <div key={applicant.application_id} className="rounded-xl border border-gray-200 bg-white p-5 transition hover:shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Rank */}
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-600' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-purple-50 text-purple-600'
                    }`}>
                      #{index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900">{applicant.candidate_name || 'Unknown'}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadge(applicant.status)}`}>
                          {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{applicant.candidate_email}</p>

                      <div className="mt-1 flex items-center gap-2">
                        <Link
                          href={`/recruiter/jobs/${applicant.job_id}/candidates`}
                          className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                        >
                          {applicant.job_title}
                        </Link>
                        <span className="text-xs text-gray-400">&middot; {new Date(applicant.applied_at).toLocaleDateString()}</span>
                      </div>

                      {/* Skills */}
                      {applicant.match && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {applicant.match.matched_skills?.slice(0, 4).map((s: any, idx: number) => {
                            const name = typeof s === 'string' ? s : s?.skill_name || `s-${idx}`
                            return <span key={`m-${idx}`} className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">{name}</span>
                          })}
                          {applicant.match.missing_skills?.slice(0, 2).map((s: any, idx: number) => {
                            const name = typeof s === 'string' ? s : s?.skill_name || `x-${idx}`
                            return <span key={`x-${idx}`} className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">{name}</span>
                          })}
                        </div>
                      )}

                      {/* AI Insight snippet */}
                      {applicant.match?.explanation && (
                        <p className="mt-2 text-xs text-blue-700 bg-blue-50 rounded-md px-2 py-1 inline-block">
                          {applicant.match.explanation.split('\n').filter(Boolean)[1] || applicant.match.explanation.split('\n')[0]}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    {score !== null && (
                      <div className="w-28">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-400">Match</span>
                          <span className={`text-sm font-bold ${getScoreColor(score)}`}>{score}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                          <div className={`h-full rounded-full ${getBarColor(score)}`} style={{ width: `${score}%` }} />
                        </div>
                      </div>
                    )}
                    <Link
                      href={`/recruiter/jobs/${applicant.job_id}/candidates`}
                      className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
