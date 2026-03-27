'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface Job {
  id: string
  title: string
}

interface SkillMatch {
  name: string
  status: 'matched' | 'partial' | 'missing'
}

interface ScreeningResult {
  id: string
  name: string
  overall_score: number
  skills: SkillMatch[]
  experience_years: number
  experience_required: number
  education_match: boolean
  degree: string
}

const statusColor: Record<string, string> = {
  matched: 'bg-green-50 text-green-700 border-green-200',
  partial: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  missing: 'bg-red-50 text-red-700 border-red-200',
}

const statusDot: Record<string, string> = {
  matched: 'bg-green-500',
  partial: 'bg-yellow-500',
  missing: 'bg-red-500',
}

export default function ScreeningPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState('')
  const [candidates, setCandidates] = useState<ScreeningResult[]>([])
  const [loading, setLoading] = useState(true)
  const [screeningLoading, setScreeningLoading] = useState(false)
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set())

  useEffect(() => {
    api.get('/recruiter/jobs/')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.jobs || []
        setJobs(data)
        if (data.length > 0) setSelectedJob(data[0].id)
      })
      .catch(() => setJobs([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedJob) return
    setScreeningLoading(true)
    api.get(`/recruiter/jobs/${selectedJob}/candidates/`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.candidates || []
        setCandidates(data)
      })
      .catch(() => setCandidates([]))
      .finally(() => setScreeningLoading(false))
  }, [selectedJob])

  const toggleShortlist = (id: string) => {
    setShortlisted((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Screening</h1>
          <p className="mt-1 text-sm text-gray-500">AI-ranked candidates with detailed skill and experience analysis.</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-gray-200 bg-white" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Screening</h1>
        <p className="mt-1 text-sm text-gray-500">AI-ranked candidates with detailed skill and experience analysis.</p>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
          </svg>
          <h3 className="mt-4 text-sm font-semibold text-gray-900">No jobs to screen</h3>
          <p className="mt-1 text-sm text-gray-500">Post a job first, then candidates will be screened automatically.</p>
        </div>
      ) : (
        <>
          {/* Job selector */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <label className="mb-1.5 block text-xs font-medium text-gray-500">Select Job</label>
            <select
              value={selectedJob}
              onChange={(e) => {
                setSelectedJob(e.target.value)
                setShortlisted(new Set())
              }}
              className="w-full max-w-md rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-recruiter-500 focus:outline-none focus:ring-1 focus:ring-recruiter-500"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="font-medium">Skill status:</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-green-500" /> Matched</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-yellow-500" /> Partial</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-red-500" /> Missing</span>
          </div>

          {/* Results */}
          {screeningLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-xl border border-gray-200 bg-white" />
              ))}
            </div>
          ) : candidates.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white py-12 text-center">
              <p className="text-sm text-gray-500">No candidates have applied to this job yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {candidates.map((candidate, idx) => {
                const score = Math.round((candidate.overall_score || 0) * 100)
                return (
                  <div key={candidate.id} className="rounded-xl border border-gray-200 bg-white p-5 transition hover:shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-recruiter-50 text-sm font-bold text-recruiter-600">
                          #{idx + 1}
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{candidate.name}</p>
                            {candidate.degree && <p className="text-xs text-gray-500">{candidate.degree}</p>}
                          </div>
                          {candidate.skills && candidate.skills.length > 0 && (
                            <div>
                              <p className="mb-1.5 text-xs font-medium text-gray-500">Skill Breakdown</p>
                              <div className="flex flex-wrap gap-1.5">
                                {candidate.skills.map((skill) => (
                                  <span key={skill.name} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColor[skill.status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusDot[skill.status] || 'bg-gray-400'}`} />
                                    {skill.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-3">
                        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                          <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                            <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                            <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={score >= 90 ? '#22c55e' : score >= 80 ? '#eab308' : '#f97316'} strokeWidth="3" strokeDasharray={`${score}, 100`} strokeLinecap="round" />
                          </svg>
                          <span className="absolute text-sm font-bold text-gray-900">{score}%</span>
                        </div>
                        <button
                          onClick={() => toggleShortlist(candidate.id)}
                          className={`rounded-lg px-4 py-1.5 text-xs font-medium transition ${
                            shortlisted.has(candidate.id)
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'border border-recruiter-200 bg-recruiter-50 text-recruiter-700 hover:bg-recruiter-100'
                          }`}
                        >
                          {shortlisted.has(candidate.id) ? 'Shortlisted' : 'Shortlist'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
