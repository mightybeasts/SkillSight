'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatScore, getScoreColor } from '@/lib/utils'
import { toast } from 'sonner'
import { use } from 'react'

export default function CandidatesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = use(params)
  const queryClient = useQueryClient()

  const { data: candidates, isLoading } = useQuery({
    queryKey: ['candidates', jobId],
    queryFn: () =>
      api.get(`/recruiter/jobs/${jobId}/candidates`).then((r) => r.data),
  })

  const shortlistMutation = useMutation({
    mutationFn: ({ matchId, value }: { matchId: string; value: boolean }) =>
      api.patch(`/recruiter/matches/${matchId}/shortlist`, { is_shortlisted: value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates', jobId] })
      toast.success('Shortlist updated')
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Candidate Rankings</h1>
        <p className="mt-1 text-gray-500">
          AI-ranked candidates sorted by semantic match score.
        </p>
      </div>

      {isLoading ? (
        <div className="text-gray-400">Loading candidates...</div>
      ) : !candidates?.length ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center text-gray-400">
          No candidates analyzed yet.
        </div>
      ) : (
        <div className="space-y-4">
          {candidates.map((candidate: any, index: number) => (
            <div
              key={candidate.match_id}
              className="rounded-2xl border bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Rank badge */}
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                    #{index + 1}
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900">
                      {candidate.candidate_name || 'Unknown Candidate'}
                    </p>
                    <p className="text-sm text-gray-500">{candidate.candidate_email}</p>

                    {/* Skill badges */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {candidate.matched_skills?.slice(0, 6).map((s: any) => (
                        <span
                          key={s.skill_name}
                          className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
                        >
                          ✓ {s.skill_name}
                        </span>
                      ))}
                      {candidate.missing_skills?.slice(0, 3).map((s: any) => (
                        <span
                          key={s.skill_name}
                          className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600"
                        >
                          ✗ {s.skill_name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Scores */}
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-3xl font-bold ${getScoreColor(candidate.overall_score)}`}>
                    {formatScore(candidate.overall_score)}
                  </span>
                  <div className="flex gap-2 text-xs text-gray-400">
                    <span>Skills: {formatScore(candidate.skill_score)}</span>
                    <span>·</span>
                    <span>Semantic: {formatScore(candidate.semantic_score)}</span>
                  </div>

                  <button
                    onClick={() =>
                      shortlistMutation.mutate({
                        matchId: candidate.match_id,
                        value: !candidate.is_shortlisted,
                      })
                    }
                    className={`mt-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      candidate.is_shortlisted
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {candidate.is_shortlisted ? '⭐ Shortlisted' : '☆ Shortlist'}
                  </button>
                </div>
              </div>

              {/* Explanation */}
              {candidate.explanation && (
                <div className="mt-4 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
                  {candidate.explanation.split('\n')[0]}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
