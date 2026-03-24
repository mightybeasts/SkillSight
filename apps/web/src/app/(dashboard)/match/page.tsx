'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatScore, getScoreColor } from '@/lib/utils'
import { toast } from 'sonner'

export default function MatchPage() {
  const [selectedResume, setSelectedResume] = useState('')
  const [selectedJob, setSelectedJob] = useState('')
  const [matchResult, setMatchResult] = useState<any>(null)

  const { data: resumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => api.get('/resumes').then((r) => r.data),
  })

  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.get('/jobs?limit=50').then((r) => r.data),
  })

  const analyzeMutation = useMutation({
    mutationFn: () =>
      api.post('/matches/analyze', { resume_id: selectedResume, job_id: selectedJob }),
    onSuccess: async (data) => {
      toast.info('Analysis queued — fetching results...')
      // Poll for result (simple approach — in production use WebSocket or SSE)
      await new Promise((r) => setTimeout(r, 4000))
      const result = await api.get(`/matches/${selectedResume}/${selectedJob}`)
      setMatchResult(result.data)
    },
    onError: () => toast.error('Analysis failed. Please try again.'),
  })

  const score = matchResult?.match_result?.overall_score

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Job Match Analyzer</h1>
        <p className="mt-1 text-gray-500">
          Select a resume and job to get your AI-powered match score with full explainability.
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Your Resume</label>
            <select
              value={selectedResume}
              onChange={(e) => setSelectedResume(e.target.value)}
              className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Select a resume...</option>
              {resumes?.map((r: any) => (
                <option key={r.id} value={r.id} disabled={r.processing_status !== 'completed'}>
                  {r.title} {r.processing_status !== 'completed' ? '(processing...)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Job Listing</label>
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Select a job...</option>
              {jobs?.map((j: any) => (
                <option key={j.id} value={j.id}>
                  {j.title} @ {j.company}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => analyzeMutation.mutate()}
          disabled={!selectedResume || !selectedJob || analyzeMutation.isPending}
          className="mt-4 w-full rounded-xl bg-brand-600 py-3 font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {analyzeMutation.isPending ? '⏳ Analyzing...' : '⚡ Analyze Match'}
        </button>
      </div>

      {/* Results */}
      {matchResult && (
        <div className="space-y-6">
          {/* Score card */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Overall Match Score</h2>
                <p className="text-sm text-gray-500">AI-powered semantic analysis</p>
              </div>
              <div className={`text-5xl font-bold ${getScoreColor(score)}`}>
                {formatScore(score)}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Skills', score: matchResult.match_result.skill_score },
                { label: 'Semantic', score: matchResult.match_result.semantic_score },
                { label: 'Experience', score: matchResult.match_result.experience_score },
                { label: 'Education', score: matchResult.match_result.education_score },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-gray-50 p-3 text-center">
                  <p className={`text-xl font-bold ${getScoreColor(s.score)}`}>
                    {formatScore(s.score)}
                  </p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>

            {matchResult.match_result.explanation && (
              <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-800 whitespace-pre-line">
                {matchResult.match_result.explanation}
              </div>
            )}
          </div>

          {/* Skill breakdown */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { title: '✅ Matched Skills', skills: matchResult.match_result.matched_skills, color: 'green' },
              { title: '⚡ Partial Matches', skills: matchResult.match_result.partial_skills, color: 'yellow' },
              { title: '❌ Missing Skills', skills: matchResult.match_result.missing_skills, color: 'red' },
            ].map((section) => (
              <div key={section.title} className="rounded-xl border bg-white p-4">
                <h3 className="mb-3 font-medium text-gray-700">{section.title}</h3>
                {section.skills?.length === 0 ? (
                  <p className="text-sm text-gray-400">None</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {section.skills?.map((s: any) => (
                      <span
                        key={s.skill_name}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          section.color === 'green'
                            ? 'bg-green-100 text-green-700'
                            : section.color === 'yellow'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {s.skill_name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Learning recommendations */}
          {matchResult.recommendations?.length > 0 && (
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">📚 Learning Recommendations</h2>
              <div className="space-y-3">
                {matchResult.recommendations.map((rec: any, i: number) => (
                  <div key={rec.id} className="flex items-start gap-4 rounded-lg bg-gray-50 p-4">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{rec.resource_title}</p>
                      <p className="text-sm text-gray-500">
                        {rec.resource_provider} · {rec.resource_type}
                        {rec.estimated_hours && ` · ~${rec.estimated_hours}h`}
                      </p>
                      <p className="mt-1 text-xs text-brand-600">Fills gap: {rec.skill_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
