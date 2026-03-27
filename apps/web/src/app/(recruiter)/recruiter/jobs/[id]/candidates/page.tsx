'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatScore } from '@/lib/utils'
import { toast } from 'sonner'
import { use, useState } from 'react'

export default function CandidatesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = use(params)
  const queryClient = useQueryClient()
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [minMatch, setMinMatch] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['applicants', jobId],
    queryFn: () => api.get(`/recruiter/jobs/${jobId}/applicants`).then((r) => r.data),
  })

  const statusMutation = useMutation({
    mutationFn: ({ applicationId, status, rejection_reason }: { applicationId: string; status: string; rejection_reason?: string }) =>
      api.patch(`/recruiter/applications/${applicationId}/status`, { status, rejection_reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants', jobId] })
      toast.success('Status updated')
      setRejectingId(null)
      setRejectReason('')
    },
    onError: () => toast.error('Failed to update status'),
  })

  const jobInfo = data?.job
  const sorted = [...(data?.applicants || [])]
    .sort((a: any, b: any) => (b.match?.overall_score || 0) - (a.match?.overall_score || 0))
    .filter((a: any) => {
      if (search) {
        const q = search.toLowerCase()
        if (!a.candidate_name?.toLowerCase().includes(q) && !a.candidate_email?.toLowerCase().includes(q)) return false
      }
      if (minMatch > 0 && (a.match?.overall_score || 0) * 100 < minMatch) return false
      if (statusFilter !== 'all' && a.status !== statusFilter) return false
      return true
    })

  const all = data?.applicants || []
  const totalShortlisted = all.filter((a: any) => a.status === 'shortlisted').length
  const totalRejected = all.filter((a: any) => a.status === 'rejected').length
  const avgScore = all.length > 0
    ? Math.round((all.reduce((s: number, a: any) => s + (a.match?.overall_score || 0), 0) / all.length) * 100)
    : 0

  function scoreColor(score: number) {
    if (score >= 80) return { text: 'text-green-600', bg: 'bg-green-500', ring: 'ring-green-200' }
    if (score >= 60) return { text: 'text-yellow-600', bg: 'bg-yellow-500', ring: 'ring-yellow-200' }
    if (score >= 40) return { text: 'text-orange-500', bg: 'bg-orange-500', ring: 'ring-orange-200' }
    return { text: 'text-red-500', bg: 'bg-red-500', ring: 'ring-red-200' }
  }

  const statusStyles: Record<string, string> = {
    applied: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    screening: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    shortlisted: 'bg-green-50 text-green-700 ring-1 ring-green-200',
    interview: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
    offer: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    rejected: 'bg-red-50 text-red-600 ring-1 ring-red-200',
    withdrawn: 'bg-gray-50 text-gray-500 ring-1 ring-gray-200',
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {jobInfo ? jobInfo.title : 'Applicants'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {all.length} applicant{all.length !== 1 ? 's' : ''} — ranked by AI match score
        </p>
      </div>

      {/* Stats */}
      {!isLoading && all.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Applicants', value: all.length, color: 'text-gray-900', icon: '👥' },
            { label: 'Avg Match', value: `${avgScore}%`, color: avgScore >= 70 ? 'text-green-600' : 'text-yellow-600', icon: '📊' },
            { label: 'Shortlisted', value: totalShortlisted, color: 'text-green-600', icon: '✓' },
            { label: 'Rejected', value: totalRejected, color: 'text-red-500', icon: '✗' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-gray-100 bg-white p-5">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-1 font-medium uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-xs font-semibold text-gray-400 uppercase tracking-wide">Search</label>
            <input
              type="text"
              placeholder="Name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold text-gray-400 uppercase tracking-wide">Min Match: {minMatch}%</label>
            <input type="range" min={0} max={100} value={minMatch} onChange={(e) => setMinMatch(Number(e.target.value))}
              className="mt-3 w-full accent-purple-600" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100">
              <option value="all">All</option>
              <option value="applied">Applied</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
              <option value="screening">Screening</option>
              <option value="interview">Interview</option>
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-48 animate-pulse rounded-2xl bg-gray-50" />)}
        </div>
      ) : !sorted.length ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
          <p className="text-gray-400 text-sm">{all.length === 0 ? 'No applicants yet.' : 'No matches for current filters.'}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {sorted.map((applicant: any, index: number) => {
            const isExpanded = expandedId === applicant.application_id
            const isRejecting = rejectingId === applicant.application_id
            const resume = applicant.resume
            const match = applicant.match
            const profile = applicant.profile
            const score = match ? Math.round(match.overall_score * 100) : null
            const sc = score !== null ? scoreColor(score) : null

            return (
              <div key={applicant.application_id} className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
                {/* ── Main Card ── */}
                <div className="p-6">
                  <div className="flex gap-5">
                    {/* Rank */}
                    <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                      index === 0 ? 'bg-yellow-50 text-yellow-600 ring-2 ring-yellow-200' :
                      index === 1 ? 'bg-gray-50 text-gray-500 ring-2 ring-gray-200' :
                      index === 2 ? 'bg-orange-50 text-orange-500 ring-2 ring-orange-200' :
                      'bg-purple-50 text-purple-500'
                    }`}>
                      #{index + 1}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-base font-semibold text-gray-900">{applicant.candidate_name || 'Unknown'}</h3>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusStyles[applicant.status] || statusStyles.applied}`}>
                          {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                        </span>
                      </div>

                      <p className="text-sm text-gray-500 mt-0.5">{applicant.candidate_email}</p>

                      {/* Profile Info */}
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-gray-400">
                        {profile?.headline && <span className="text-gray-600 font-medium">{profile.headline}</span>}
                        {profile?.location && <span>{profile.location}</span>}
                        <span>Applied {new Date(applicant.applied_at).toLocaleDateString()}</span>
                        {profile?.linkedin_url && (
                          <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">LinkedIn</a>
                        )}
                        {profile?.github_url && (
                          <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-800">GitHub</a>
                        )}
                      </div>

                      {/* Bio */}
                      {profile?.bio && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{profile.bio}</p>
                      )}
                      {!profile?.bio && resume?.summary && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{resume.summary}</p>
                      )}

                      {/* Skills */}
                      {match && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {match.matched_skills?.slice(0, 6).map((s: any, i: number) => {
                            const name = typeof s === 'string' ? s : s?.skill_name || `s-${i}`
                            return <span key={`m-${i}`} className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">{name}</span>
                          })}
                          {match.missing_skills?.slice(0, 3).map((s: any, i: number) => {
                            const name = typeof s === 'string' ? s : s?.skill_name || `x-${i}`
                            return <span key={`x-${i}`} className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-500">{name}</span>
                          })}
                        </div>
                      )}
                    </div>

                    {/* Score Column */}
                    <div className="flex flex-col items-end gap-3 flex-shrink-0 min-w-[120px]">
                      {score !== null && sc ? (
                        <div className="text-right">
                          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-opacity-10 ring-2 ${sc.ring}`}
                            style={{ backgroundColor: score >= 80 ? '#f0fdf4' : score >= 60 ? '#fefce8' : score >= 40 ? '#fff7ed' : '#fef2f2' }}>
                            <span className={`text-2xl font-bold ${sc.text}`}>{score}%</span>
                          </div>
                          <div className="mt-1.5 space-y-0.5 text-right">
                            <p className="text-[10px] text-gray-400">Skill {formatScore(match.skill_score)} &middot; Sem {formatScore(match.semantic_score)}</p>
                            <div className="h-1 w-20 ml-auto overflow-hidden rounded-full bg-gray-100">
                              <div className={`h-full rounded-full ${sc.bg}`} style={{ width: `${score}%` }} />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300 italic">No score</span>
                      )}
                    </div>
                  </div>

                  {/* AI Insight */}
                  {match?.explanation && (
                    <div className="mt-5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4">
                      <p className="text-xs font-semibold text-blue-900 mb-1.5">AI Insight</p>
                      <p className="text-sm text-blue-800 leading-relaxed">
                        {match.explanation.split('\n').filter(Boolean).slice(1, 4).join(' ')}
                      </p>
                    </div>
                  )}

                  {/* Rejection reason */}
                  {applicant.status === 'rejected' && applicant.rejection_reason && (
                    <div className="mt-4 rounded-xl bg-red-50 px-5 py-3">
                      <p className="text-xs text-red-700"><span className="font-semibold">Rejection reason:</span> {applicant.rejection_reason}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-5 flex items-center gap-3 border-t border-gray-50 pt-4">
                    {applicant.status !== 'shortlisted' && applicant.status !== 'rejected' && applicant.status !== 'withdrawn' && (
                      <button
                        onClick={() => statusMutation.mutate({ applicationId: applicant.application_id, status: 'shortlisted' })}
                        disabled={statusMutation.isPending}
                        className="rounded-xl bg-green-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                      >
                        Shortlist
                      </button>
                    )}
                    {applicant.status === 'shortlisted' && (
                      <span className="rounded-xl bg-green-50 px-5 py-2 text-xs font-semibold text-green-700 ring-1 ring-green-200">
                        Shortlisted
                      </span>
                    )}
                    {applicant.status !== 'rejected' && applicant.status !== 'withdrawn' && (
                      <button
                        onClick={() => { setRejectingId(applicant.application_id); setRejectReason('') }}
                        className="rounded-xl bg-white px-5 py-2 text-xs font-semibold text-red-500 ring-1 ring-red-200 transition hover:bg-red-50"
                      >
                        Reject
                      </button>
                    )}
                    {applicant.status === 'rejected' && (
                      <span className="rounded-xl bg-red-50 px-5 py-2 text-xs font-semibold text-red-500 ring-1 ring-red-200">
                        Rejected
                      </span>
                    )}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : applicant.application_id)}
                      className="rounded-xl bg-white px-5 py-2 text-xs font-semibold text-gray-500 ring-1 ring-gray-200 transition hover:bg-gray-50 ml-auto"
                    >
                      {isExpanded ? 'Hide Details' : 'View Details'}
                    </button>
                  </div>

                  {/* Reject form */}
                  {isRejecting && (
                    <div className="mt-5 rounded-xl border border-red-100 bg-red-50/50 p-5">
                      <p className="text-sm font-semibold text-red-800 mb-3">Rejection Reason</p>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Why is this candidate being rejected?"
                        className="w-full rounded-xl border border-red-200 bg-white p-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200"
                        rows={3}
                      />
                      <div className="mt-3 flex gap-3">
                        <button
                          onClick={() => {
                            if (!rejectReason.trim()) { toast.error('Please provide a reason'); return }
                            statusMutation.mutate({ applicationId: applicant.application_id, status: 'rejected', rejection_reason: rejectReason.trim() })
                          }}
                          disabled={statusMutation.isPending}
                          className="rounded-xl bg-red-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                        >
                          {statusMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
                        </button>
                        <button onClick={() => { setRejectingId(null); setRejectReason('') }}
                          className="rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-gray-500 ring-1 ring-gray-200 hover:bg-gray-50">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Expanded Details Panel ── */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Left: Resume */}
                      {resume && (
                        <div className="space-y-5">
                          <h4 className="text-sm font-bold text-gray-900">Resume</h4>

                          {resume.summary && (
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Summary</p>
                              <p className="text-sm text-gray-700 leading-relaxed">{resume.summary}</p>
                            </div>
                          )}

                          {resume.experience?.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Experience</p>
                              <div className="space-y-2">
                                {resume.experience.slice(0, 3).map((exp: any, i: number) => (
                                  <div key={i} className="rounded-lg bg-white p-3 border border-gray-100">
                                    <p className="text-sm font-semibold text-gray-800">{exp.title || exp.position}</p>
                                    {exp.company && <p className="text-xs text-gray-500">{exp.company}</p>}
                                    {exp.duration && <p className="text-xs text-gray-400">{exp.duration}</p>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {resume.education?.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Education</p>
                              {resume.education.slice(0, 2).map((edu: any, i: number) => (
                                <p key={i} className="text-sm text-gray-700 mb-1">
                                  {edu.degree || edu.field} {edu.institution ? `— ${edu.institution}` : ''}
                                </p>
                              ))}
                            </div>
                          )}

                          {resume.skills?.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">All Skills</p>
                              <div className="flex flex-wrap gap-1.5">
                                {resume.skills.map((skill: any, i: number) => {
                                  const name = typeof skill === 'string' ? skill : skill?.name || skill?.skill_name || ''
                                  return name ? <span key={i} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700 font-medium">{name}</span> : null
                                })}
                              </div>
                            </div>
                          )}

                          {resume.file_url && (
                            <a href={resume.file_url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-xl bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700 hover:bg-purple-100 transition">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                              </svg>
                              Download Resume
                            </a>
                          )}
                        </div>
                      )}

                      {/* Right: Match Analysis */}
                      {match && (
                        <div className="space-y-5">
                          <h4 className="text-sm font-bold text-gray-900">Match Analysis</h4>

                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { label: 'Overall', value: match.overall_score },
                              { label: 'Skills', value: match.skill_score },
                              { label: 'Semantic', value: match.semantic_score },
                              { label: 'Experience', value: match.experience_score },
                              { label: 'Education', value: match.education_score },
                            ].map((item) => {
                              const pct = Math.round(item.value * 100)
                              const c = scoreColor(pct)
                              return (
                                <div key={item.label} className="rounded-xl bg-white p-4 border border-gray-100 text-center">
                                  <p className={`text-xl font-bold ${c.text}`}>{pct}%</p>
                                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-1">{item.label}</p>
                                </div>
                              )
                            })}
                          </div>

                          {match.explanation && (
                            <div className="rounded-xl bg-blue-50 p-4">
                              <p className="text-xs font-bold text-blue-900 mb-2">Full AI Analysis</p>
                              <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-line">{match.explanation}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {applicant.cover_letter && (
                      <div className="mt-6">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Cover Letter</p>
                        <p className="text-sm text-gray-700 bg-white rounded-xl p-4 border border-gray-100 leading-relaxed">{applicant.cover_letter}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
