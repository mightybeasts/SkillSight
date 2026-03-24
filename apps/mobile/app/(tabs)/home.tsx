import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useRouter } from 'expo-router'

function ScoreBar({ score, label }: { score: number; label: string }) {
  const pct = Math.round(score * 100)
  const color = score >= 0.8 ? '#16a34a' : score >= 0.6 ? '#ca8a04' : '#dc2626'
  return (
    <View className="mb-2">
      <View className="mb-1 flex-row justify-between">
        <Text className="text-xs text-gray-500">{label}</Text>
        <Text className="text-xs font-semibold" style={{ color }}>
          {pct}%
        </Text>
      </View>
      <View className="h-2 rounded-full bg-gray-100">
        <View
          className="h-2 rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </View>
    </View>
  )
}

export default function HomeScreen() {
  const router = useRouter()

  const { data: resumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => api.get('/resumes').then((r) => r.data),
  })

  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.get('/jobs?limit=5').then((r) => r.data),
  })

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-blue-800 px-5 pb-8 pt-4">
          <Text className="text-xl font-bold text-white">Welcome back 👋</Text>
          <Text className="mt-1 text-sm text-blue-200">
            Your AI-powered job search assistant
          </Text>
        </View>

        <View className="px-4 pt-4 space-y-5">
          {/* Quick actions */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/resumes')}
              className="flex-1 rounded-2xl bg-white p-4 shadow-sm items-center"
            >
              <Text className="text-3xl">📄</Text>
              <Text className="mt-2 text-center text-sm font-medium text-gray-700">
                My Resumes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/match')}
              className="flex-1 rounded-2xl bg-blue-700 p-4 shadow-sm items-center"
            >
              <Text className="text-3xl">⚡</Text>
              <Text className="mt-2 text-center text-sm font-medium text-white">
                Analyze Match
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/jobs')}
              className="flex-1 rounded-2xl bg-white p-4 shadow-sm items-center"
            >
              <Text className="text-3xl">🔍</Text>
              <Text className="mt-2 text-center text-sm font-medium text-gray-700">
                Browse Jobs
              </Text>
            </TouchableOpacity>
          </View>

          {/* Resume status */}
          {resumes?.length > 0 && (
            <View className="rounded-2xl bg-white p-4 shadow-sm">
              <Text className="mb-3 font-semibold text-gray-900">Latest Resume</Text>
              {resumes.slice(0, 1).map((r: any) => (
                <View key={r.id}>
                  <Text className="font-medium">{r.title}</Text>
                  <View className="mt-1 flex-row items-center gap-2">
                    <View
                      className={`rounded-full px-2 py-0.5 ${
                        r.processing_status === 'completed'
                          ? 'bg-green-100'
                          : 'bg-yellow-100'
                      }`}
                    >
                      <Text
                        className={`text-xs ${
                          r.processing_status === 'completed'
                            ? 'text-green-700'
                            : 'text-yellow-700'
                        }`}
                      >
                        {r.processing_status}
                      </Text>
                    </View>
                  </View>
                  {r.parsed_data?.skills?.length > 0 && (
                    <View className="mt-3 flex-row flex-wrap gap-1.5">
                      {r.parsed_data.skills.slice(0, 6).map((skill: string) => (
                        <View key={skill} className="rounded bg-gray-100 px-2 py-0.5">
                          <Text className="text-xs text-gray-600">{skill}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Latest jobs */}
          <View>
            <Text className="mb-3 font-semibold text-gray-900">Latest Jobs</Text>
            <View className="space-y-2">
              {jobs?.map((job: any) => (
                <TouchableOpacity
                  key={job.id}
                  onPress={() => router.push(`/jobs/${job.id}`)}
                  className="rounded-2xl bg-white p-4 shadow-sm"
                >
                  <Text className="font-semibold text-gray-900">{job.title}</Text>
                  <Text className="mt-0.5 text-sm text-gray-500">
                    {job.company} · {job.location || 'Remote'}
                  </Text>
                  <View className="mt-2 flex-row items-center justify-between">
                    <View className="rounded-full bg-blue-100 px-2.5 py-1">
                      <Text className="text-xs text-blue-700">
                        {job.job_type?.replace('_', ' ')}
                      </Text>
                    </View>
                    {job.is_remote && (
                      <Text className="text-xs text-green-600">🌐 Remote</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
