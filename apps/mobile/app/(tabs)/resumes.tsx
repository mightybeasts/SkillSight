import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'
import api from '@/lib/api'

export default function ResumesScreen() {
  const queryClient = useQueryClient()

  const { data: resumes, isLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => api.get('/resumes').then((r) => r.data),
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: DocumentPicker.DocumentPickerAsset) => {
      const formData = new FormData()
      formData.append('file', {
        uri: file.uri,
        type: file.mimeType || 'application/pdf',
        name: file.name,
      } as any)
      formData.append('title', file.name.replace('.pdf', ''))
      formData.append('is_master', 'false')
      return api.post('/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] })
      Alert.alert('Success', 'Resume uploaded and queued for processing!')
    },
    onError: () => Alert.alert('Error', 'Upload failed. Please try again.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/resumes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resumes'] }),
  })

  async function handleUpload() {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    })
    if (!result.canceled && result.assets[0]) {
      uploadMutation.mutate(result.assets[0])
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <View className="mb-5 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-gray-900">My Resumes</Text>
          <TouchableOpacity
            onPress={handleUpload}
            disabled={uploadMutation.isPending}
            className="rounded-xl bg-blue-700 px-4 py-2"
          >
            <Text className="text-sm font-medium text-white">
              {uploadMutation.isPending ? 'Uploading...' : '+ Upload PDF'}
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <Text className="text-gray-400">Loading...</Text>
        ) : !resumes?.length ? (
          <View className="items-center rounded-2xl border-2 border-dashed border-gray-200 p-12">
            <Text className="mb-3 text-5xl">📄</Text>
            <Text className="text-center text-gray-500">No resumes yet.</Text>
            <TouchableOpacity onPress={handleUpload} className="mt-4 rounded-xl bg-blue-700 px-6 py-3">
              <Text className="text-sm font-medium text-white">Upload PDF Resume</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="space-y-3 pb-8">
            {resumes.map((resume: any) => (
              <View key={resume.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900">{resume.title}</Text>
                    {resume.file_name && (
                      <Text className="mt-0.5 text-xs text-gray-400">{resume.file_name}</Text>
                    )}
                    <View className="mt-2 flex-row gap-2">
                      {resume.is_master && (
                        <View className="rounded-full bg-blue-100 px-2 py-0.5">
                          <Text className="text-xs text-blue-700">Master</Text>
                        </View>
                      )}
                      <View
                        className={`rounded-full px-2 py-0.5 ${
                          resume.processing_status === 'completed' ? 'bg-green-100' : 'bg-yellow-100'
                        }`}
                      >
                        <Text
                          className={`text-xs ${
                            resume.processing_status === 'completed'
                              ? 'text-green-700'
                              : 'text-yellow-700'
                          }`}
                        >
                          {resume.processing_status}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert('Delete', 'Delete this resume?', [
                        { text: 'Cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(resume.id) },
                      ])
                    }
                    className="rounded-lg p-2"
                  >
                    <Text className="text-red-400">✕</Text>
                  </TouchableOpacity>
                </View>

                {resume.parsed_data?.skills?.length > 0 && (
                  <View className="mt-3 flex-row flex-wrap gap-1.5">
                    {resume.parsed_data.skills.slice(0, 6).map((skill: string) => (
                      <View key={skill} className="rounded bg-gray-100 px-2 py-0.5">
                        <Text className="text-xs text-gray-600">{skill}</Text>
                      </View>
                    ))}
                    {resume.parsed_data.skills.length > 6 && (
                      <Text className="text-xs text-gray-400">
                        +{resume.parsed_data.skills.length - 6} more
                      </Text>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
