import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native'
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/api'

function ScoreRing({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color = score >= 0.8 ? '#16a34a' : score >= 0.6 ? '#ca8a04' : '#dc2626'
  return (
    <View className="items-center">
      <Text className="text-5xl font-bold" style={{ color }}>
        {pct}%
      </Text>
      <Text className="mt-1 text-sm text-gray-500">Overall Match</Text>
    </View>
  )
}

export default function MatchScreen() {
  const [selectedResume, setSelectedResume] = useState('')
  const [selectedJob, setSelectedJob] = useState('')
  const [matchResult, setMatchResult] = useState<any>(null)
  const [showResumePicker, setShowResumePicker] = useState(false)
  const [showJobPicker, setShowJobPicker] = useState(false)

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
    onSuccess: async () => {
      await new Promise((r) => setTimeout(r, 4000))
      const result = await api.get(`/matches/${selectedResume}/${selectedJob}`)
      setMatchResult(result.data)
    },
  })

  const selectedResumeName = resumes?.find((r: any) => r.id === selectedResume)?.title
  const selectedJobName = jobs?.find((j: any) => j.id === selectedJob)?.title

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="mb-1 text-2xl font-bold text-gray-900">Match Analyzer</Text>
        <Text className="mb-5 text-gray-500">
          Get your AI-powered match score with full explainability.
        </Text>

        <View className="rounded-2xl bg-white p-4 shadow-sm space-y-3 mb-4">
          {/* Resume selector */}
          <TouchableOpacity
            onPress={() => setShowResumePicker(!showResumePicker)}
            className="rounded-xl border border-gray-200 p-3"
          >
            <Text className="text-xs text-gray-400">Resume</Text>
            <Text className="mt-0.5 font-medium text-gray-800">
              {selectedResumeName || 'Select a resume...'}
            </Text>
          </TouchableOpacity>
          {showResumePicker &&
            resumes?.map((r: any) => (
              <TouchableOpacity
                key={r.id}
                onPress={() => {
                  setSelectedResume(r.id)
                  setShowResumePicker(false)
                }}
                className="rounded-lg bg-gray-50 px-4 py-2.5"
              >
                <Text className="text-sm">{r.title}</Text>
              </TouchableOpacity>
            ))}

          {/* Job selector */}
          <TouchableOpacity
            onPress={() => setShowJobPicker(!showJobPicker)}
            className="rounded-xl border border-gray-200 p-3"
          >
            <Text className="text-xs text-gray-400">Job</Text>
            <Text className="mt-0.5 font-medium text-gray-800">
              {selectedJobName || 'Select a job...'}
            </Text>
          </TouchableOpacity>
          {showJobPicker &&
            jobs?.map((j: any) => (
              <TouchableOpacity
                key={j.id}
                onPress={() => {
                  setSelectedJob(j.id)
                  setShowJobPicker(false)
                }}
                className="rounded-lg bg-gray-50 px-4 py-2.5"
              >
                <Text className="text-sm">
                  {j.title} @ {j.company}
                </Text>
              </TouchableOpacity>
            ))}

          <TouchableOpacity
            onPress={() => analyzeMutation.mutate()}
            disabled={!selectedResume || !selectedJob || analyzeMutation.isPending}
            className="mt-1 rounded-xl bg-blue-700 py-4 items-center disabled:opacity-50"
          >
            {analyzeMutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="font-semibold text-white">⚡ Analyze Match</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Results */}
        {matchResult && (
          <View className="space-y-4 pb-8">
            {/* Score card */}
            <View className="rounded-2xl bg-white p-5 shadow-sm items-center">
              <ScoreRing score={matchResult.match_result.overall_score} />
              <View className="mt-4 w-full flex-row justify-around">
                {[
                  { label: 'Skills', v: matchResult.match_result.skill_score },
                  { label: 'Semantic', v: matchResult.match_result.semantic_score },
                  { label: 'Experience', v: matchResult.match_result.experience_score },
                ].map((s) => (
                  <View key={s.label} className="items-center">
                    <Text className="text-lg font-bold text-gray-800">
                      {Math.round(s.v * 100)}%
                    </Text>
                    <Text className="text-xs text-gray-400">{s.label}</Text>
                  </View>
                ))}
              </View>
              {matchResult.match_result.explanation && (
                <View className="mt-4 w-full rounded-xl bg-blue-50 p-3">
                  <Text className="text-xs text-blue-700">
                    {matchResult.match_result.explanation.split('\n')[0]}
                  </Text>
                </View>
              )}
            </View>

            {/* Matched skills */}
            {matchResult.match_result.matched_skills?.length > 0 && (
              <View className="rounded-2xl bg-white p-4 shadow-sm">
                <Text className="mb-3 font-semibold text-gray-900">✅ Matched Skills</Text>
                <View className="flex-row flex-wrap gap-2">
                  {matchResult.match_result.matched_skills.map((s: any) => (
                    <View key={s.skill_name} className="rounded-full bg-green-100 px-3 py-1">
                      <Text className="text-xs text-green-700">{s.skill_name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Missing skills */}
            {matchResult.match_result.missing_skills?.length > 0 && (
              <View className="rounded-2xl bg-white p-4 shadow-sm">
                <Text className="mb-3 font-semibold text-gray-900">❌ Missing Skills</Text>
                <View className="flex-row flex-wrap gap-2">
                  {matchResult.match_result.missing_skills.map((s: any) => (
                    <View key={s.skill_name} className="rounded-full bg-red-100 px-3 py-1">
                      <Text className="text-xs text-red-600">{s.skill_name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Learning recommendations */}
            {matchResult.recommendations?.length > 0 && (
              <View className="rounded-2xl bg-white p-4 shadow-sm">
                <Text className="mb-3 font-semibold text-gray-900">📚 Learn These Skills</Text>
                {matchResult.recommendations.map((rec: any, i: number) => (
                  <View
                    key={rec.id}
                    className="mb-3 rounded-xl bg-gray-50 p-3"
                  >
                    <Text className="font-medium text-gray-800">{rec.resource_title}</Text>
                    <Text className="mt-0.5 text-xs text-gray-500">
                      {rec.resource_provider} · {rec.resource_type}
                      {rec.estimated_hours ? ` · ~${rec.estimated_hours}h` : ''}
                    </Text>
                    <Text className="mt-1 text-xs text-blue-600">Fills: {rec.skill_name}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
