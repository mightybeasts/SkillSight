import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
} from 'react-native'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useRouter } from 'expo-router'

export default function JobsScreen() {
  const [search, setSearch] = useState('')
  const router = useRouter()

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs', search],
    queryFn: () =>
      api.get(`/jobs?limit=30${search ? `&search=${search}` : ''}`).then((r) => r.data),
  })

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-blue-800 px-4 pb-4 pt-2">
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search jobs, companies..."
          placeholderTextColor="#93c5fd"
          className="rounded-xl bg-blue-700 px-4 py-3 text-white"
        />
      </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <Text className="text-gray-400">Loading...</Text>
        ) : !jobs?.length ? (
          <Text className="text-center text-gray-400 mt-10">No jobs found.</Text>
        ) : (
          <View className="space-y-3 pb-8">
            {jobs.map((job: any) => (
              <TouchableOpacity
                key={job.id}
                onPress={() => router.push(`/jobs/${job.id}`)}
                className="rounded-2xl bg-white p-4 shadow-sm"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="font-semibold text-gray-900">{job.title}</Text>
                    <Text className="mt-0.5 text-sm text-gray-500">
                      {job.company}
                    </Text>
                  </View>
                  {job.is_remote && (
                    <View className="rounded-full bg-green-100 px-2.5 py-1">
                      <Text className="text-xs text-green-700">Remote</Text>
                    </View>
                  )}
                </View>

                <View className="mt-3 flex-row items-center gap-2">
                  <View className="rounded-full bg-blue-100 px-2.5 py-1">
                    <Text className="text-xs text-blue-700">
                      {job.job_type?.replace('_', ' ')}
                    </Text>
                  </View>
                  {job.location && (
                    <Text className="text-xs text-gray-400">📍 {job.location}</Text>
                  )}
                  {job.salary_min && (
                    <Text className="text-xs text-gray-400">
                      💰 {job.salary_currency} {job.salary_min?.toLocaleString()}
                      {job.salary_max ? `–${job.salary_max?.toLocaleString()}` : '+'}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => router.push(`/(tabs)/match?job=${job.id}`)}
                  className="mt-3 rounded-lg bg-blue-50 py-2 items-center"
                >
                  <Text className="text-xs font-medium text-blue-700">Check My Match ⚡</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
