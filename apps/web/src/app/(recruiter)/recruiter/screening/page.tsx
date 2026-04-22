'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface Job {
  id: string
  title: string
}

type Action = 'shortlisted' | 'rejected' | 'skipped'

interface ScreenResult {
  application_id: string
  candidate_name: string
  overall_score: number | null
  action: Action
  reason: string
}

interface PreviewResponse {
  job_id: string
  job_title: string
  screened_count: number
  shortlisted_count: number
  rejected_count: number
  skipped_count: number
  results: ScreenResult[]
  applied: boolean
}

interface Defaults {
  suggested_mandatory_skills: string[]
  default_min_match_score: number
}

export default function ScreeningPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState('')
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [applySuccess, setApplySuccess] = useState<string | null>(null)

  // Criteria form state
  const [minMatch, setMinMatch] = useState(70)
  const [mandatorySkills, setMandatorySkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [enforceBacklogs, setEnforceBacklogs] = useState(false)
  const [maxBacklogs, setMaxBacklogs] = useState(0)
  const [enforceAcademic, setEnforceAcademic] = useState(false)
  const [minAcademic, setMinAcademic] = useState(60)
  const [onlyUnreviewed, setOnlyUnreviewed] = useState(true)

  // Preview state
  const [preview, setPreview] = useState<PreviewResponse | null>(null)
  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const [view, setView] = useState<'shortlisted' | 'rejected' | 'skipped'>('shortlisted')

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
    setPreview(null)
    setExcluded(new Set())
    setApplySuccess(null)
    api.get(`/recruiter/jobs/${selectedJob}/screening-defaults`)
      .then((res) => {
        const d: Defaults = res.data
        setMandatorySkills(d.suggested_mandatory_skills || [])
        setMinMatch(Math.round((d.default_min_match_score ?? 0.7) * 100))
      })
      .catch(() => setMandatorySkills([]))
  }, [selectedJob])

  const addSkill = () => {
    const v = skillInput.trim()
    if (!v) return
    if (!mandatorySkills.some((s) => s.toLowerCase() === v.toLowerCase())) {
      setMandatorySkills([...mandatorySkills, v])
    }
    setSkillInput('')
  }

  const removeSkill = (s: string) => {
    setMandatorySkills(mandatorySkills.filter((x) => x !== s))
  }

  const runPreview = async () => {
    if (!selectedJob) return
    setRunning(true)
    setError(null)
    setApplySuccess(null)
    setPreview(null)
    setExcluded(new Set())
    try {
      const body = {
        min_match_score: minMatch / 100,
        mandatory_skills: mandatorySkills,
        max_backlogs: enforceBacklogs ? maxBacklogs : null,
        min_academic_percentage: enforceAcademic ? minAcademic : null,
        only_unreviewed: onlyUnreviewed,
      }
      const res = await api.post(`/recruiter/jobs/${selectedJob}/ai-screen`, body)
      setPreview(res.data)
      setView('shortlisted')
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Screening failed. Please try again.')
    } finally {
      setRunning(false)
    }
  }

  const toggleExclude = (id: string) => {
    setExcluded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const proceed = async () => {
    if (!preview || !selectedJob) return
    const decisions = preview.results
      .filter((r) => r.action !== 'skipped' && !excluded.has(r.application_id))
      .map((r) => ({
        application_id: r.application_id,
        action: r.action,
        reason: r.reason,
      }))

    if (decisions.length === 0) {
      setError('No decisions to apply. Unexclude some candidates or re-run the preview.')
      return
    }

    if (!confirm(`Apply decisions for ${decisions.length} candidate(s)? This will update their application status.`)) return

    setApplying(true)
    setError(null)
    try {
      const res = await api.post(`/recruiter/jobs/${selectedJob}/ai-screen/apply`, { decisions })
      setApplySuccess(
        `Applied ${res.data.applied_count} decision(s): ${res.data.shortlisted_count} shortlisted, ${res.data.rejected_count} rejected.`
      )
      setPreview(null)
      setExcluded(new Set())
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to apply decisions.')
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Screening</h1>
          <p className="mt-1 text-sm text-gray-500">Preview AI recommendations, then proceed to apply them.</p>
        </div>
        <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-white" />
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Screening</h1>
          <p className="mt-1 text-sm text-gray-500">Preview AI recommendations, then proceed to apply them.</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <h3 className="text-sm font-semibold text-gray-900">No jobs to screen</h3>
          <p className="mt-1 text-sm text-gray-500">Post a job first, then you can set screening criteria here.</p>
        </div>
      </div>
    )
  }

  const shortlistResults = preview?.results.filter((r) => r.action === 'shortlisted') ?? []
  const rejectResults = preview?.results.filter((r) => r.action === 'rejected') ?? []
  const skippedResults = preview?.results.filter((r) => r.action === 'skipped') ?? []
  const visible = view === 'shortlisted' ? shortlistResults : view === 'rejected' ? rejectResults : skippedResults
  const pendingShortlist = shortlistResults.filter((r) => !excluded.has(r.application_id)).length
  const pendingReject = rejectResults.filter((r) => !excluded.has(r.application_id)).length
  const pendingTotal = pendingShortlist + pendingReject

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Screening</h1>
        <p className="mt-1 text-sm text-gray-500">
          Run AI screening to get a recommended shortlist and reject list with reasons. Review, remove any you disagree with, then click Proceed to apply.
        </p>
      </div>

      {applySuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{applySuccess}</div>
      )}

      {/* Criteria panel */}
      <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500">Select Job</label>
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="w-full max-w-md rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-recruiter-500 focus:outline-none focus:ring-1 focus:ring-recruiter-500"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
        </div>

        <div className="h-px bg-gray-100" />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Minimum match score</label>
            <span className="text-sm font-semibold text-recruiter-600">{minMatch}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={minMatch}
            onChange={(e) => setMinMatch(Number(e.target.value))}
            className="w-full accent-recruiter-600"
          />
          <p className="mt-1 text-xs text-gray-500">Candidates below this overall score will land in the reject list.</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Mandatory skills</label>
          <div className="flex flex-wrap gap-1.5">
            {mandatorySkills.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 rounded-full border border-recruiter-200 bg-recruiter-50 px-2.5 py-0.5 text-xs font-medium text-recruiter-700">
                {s}
                <button
                  type="button"
                  onClick={() => removeSkill(s)}
                  className="text-recruiter-500 hover:text-recruiter-700"
                  aria-label={`Remove ${s}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addSkill()
                }
              }}
              placeholder="Type a skill and press Enter"
              className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-recruiter-500 focus:outline-none focus:ring-1 focus:ring-recruiter-500"
            />
            <button
              type="button"
              onClick={addSkill}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Add
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">Any candidate missing one of these will land in the reject list.</p>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={enforceBacklogs}
              onChange={(e) => setEnforceBacklogs(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-recruiter-600 focus:ring-recruiter-500"
            />
            Enforce backlog limit
          </label>
          {enforceBacklogs && (
            <div className="ml-6 flex items-center gap-2">
              <span className="text-xs text-gray-500">Max backlogs allowed:</span>
              <input
                type="number"
                min={0}
                value={maxBacklogs}
                onChange={(e) => setMaxBacklogs(Number(e.target.value))}
                className="w-20 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-recruiter-500 focus:outline-none focus:ring-1 focus:ring-recruiter-500"
              />
              <span className="text-xs text-gray-400">(0 = no backlogs allowed)</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={enforceAcademic}
              onChange={(e) => setEnforceAcademic(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-recruiter-600 focus:ring-recruiter-500"
            />
            Enforce minimum academic percentage
          </label>
          {enforceAcademic && (
            <div className="ml-6 flex items-center gap-2">
              <span className="text-xs text-gray-500">Minimum %:</span>
              <input
                type="number"
                min={0}
                max={100}
                value={minAcademic}
                onChange={(e) => setMinAcademic(Number(e.target.value))}
                className="w-20 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-recruiter-500 focus:outline-none focus:ring-1 focus:ring-recruiter-500"
              />
            </div>
          )}
        </div>

        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={onlyUnreviewed}
            onChange={(e) => setOnlyUnreviewed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-recruiter-600 focus:ring-recruiter-500"
          />
          <span>
            <span className="font-medium">Skip already-reviewed candidates</span>
            <span className="mt-0.5 block text-xs text-gray-500">Protects manual decisions you made on the Candidates page.</span>
          </span>
        </label>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
          {error && <span className="text-xs text-red-600">{error}</span>}
          <button
            type="button"
            onClick={runPreview}
            disabled={running}
            className="rounded-lg bg-recruiter-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-recruiter-700 disabled:opacity-50"
          >
            {running ? 'Screening…' : 'Run AI Screening'}
          </button>
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">AI Recommendations (Preview)</h2>
              <p className="mt-0.5 text-xs text-gray-500">Nothing has been saved yet. Remove any candidate you disagree with, then click Proceed.</p>
            </div>
            <div className="shrink-0 rounded-lg bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700">
              Preview only
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryStat label="Screened" value={preview.screened_count} />
            <SummaryStat label="Will Shortlist" value={pendingShortlist} tone="success" />
            <SummaryStat label="Will Reject" value={pendingReject} tone="danger" />
            <SummaryStat label="Skipped" value={preview.skipped_count} tone="muted" />
          </div>

          <div className="flex border-b border-gray-200">
            <TabButton active={view === 'shortlisted'} onClick={() => setView('shortlisted')}>
              Shortlist ({shortlistResults.length})
            </TabButton>
            <TabButton active={view === 'rejected'} onClick={() => setView('rejected')}>
              Reject ({rejectResults.length})
            </TabButton>
            <TabButton active={view === 'skipped'} onClick={() => setView('skipped')}>
              Skipped ({skippedResults.length})
            </TabButton>
          </div>

          {visible.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No candidates in this group.</p>
          ) : (
            <div className="space-y-2">
              {visible.map((r) => {
                const score = r.overall_score != null ? Math.round(r.overall_score * 100) : null
                const isExcluded = excluded.has(r.application_id)
                const tone = r.action === 'shortlisted'
                  ? (isExcluded ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-green-200 bg-green-50')
                  : r.action === 'rejected'
                    ? (isExcluded ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-red-200 bg-red-50')
                    : 'border-gray-200 bg-gray-50'
                return (
                  <div key={r.application_id} className={`rounded-lg border p-3 transition ${tone}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{r.candidate_name}</p>
                        <p className="mt-0.5 text-xs text-gray-600">{r.reason}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {score != null && (
                          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-gray-700 ring-1 ring-inset ring-gray-200">
                            {score}%
                          </span>
                        )}
                        {r.action !== 'skipped' && (
                          <button
                            type="button"
                            onClick={() => toggleExclude(r.application_id)}
                            className={`rounded-md px-2 py-1 text-xs font-medium transition ${
                              isExcluded
                                ? 'bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-100'
                                : 'bg-white/70 text-gray-500 hover:bg-white hover:text-gray-800'
                            }`}
                            title={isExcluded ? 'Include in proceed' : 'Exclude from proceed'}
                          >
                            {isExcluded ? 'Include' : 'Exclude'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-500">
              {pendingTotal} decision(s) ready to apply ({pendingShortlist} shortlist, {pendingReject} reject).
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setPreview(null); setExcluded(new Set()) }}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={proceed}
                disabled={applying || pendingTotal === 0}
                className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
              >
                {applying ? 'Applying…' : `Proceed & Apply (${pendingTotal})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryStat({ label, value, tone }: { label: string; value: number; tone?: 'success' | 'danger' | 'muted' }) {
  const color = tone === 'success' ? 'text-green-700' : tone === 'danger' ? 'text-red-700' : tone === 'muted' ? 'text-gray-500' : 'text-gray-900'
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
        active ? 'border-recruiter-600 text-recruiter-600' : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  )
}
