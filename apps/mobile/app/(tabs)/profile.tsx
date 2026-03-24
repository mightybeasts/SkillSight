import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'expo-router'

export default function ProfileScreen() {
  const router = useRouter()

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/users/me').then((r) => r.data),
  })

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut()
          router.replace('/(auth)/login')
        },
      },
    ])
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View className="mb-6 items-center">
          <View className="mb-3 h-20 w-20 rounded-full bg-blue-700 items-center justify-center">
            <Text className="text-3xl text-white">
              {user?.full_name?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text className="text-xl font-bold text-gray-900">
            {user?.full_name || 'User'}
          </Text>
          <Text className="text-sm text-gray-500">{user?.email}</Text>
          <View className="mt-2 rounded-full bg-blue-100 px-3 py-1">
            <Text className="text-xs font-medium text-blue-700 capitalize">
              {user?.role?.replace('_', ' ')}
            </Text>
          </View>
        </View>

        {/* Menu items */}
        <View className="rounded-2xl bg-white shadow-sm overflow-hidden mb-4">
          {[
            { label: '📄 My Resumes', onPress: () => router.push('/(tabs)/resumes') },
            { label: '💼 Browse Jobs', onPress: () => router.push('/(tabs)/jobs') },
            { label: '⚡ Match Analyzer', onPress: () => router.push('/(tabs)/match') },
          ].map((item, i) => (
            <TouchableOpacity
              key={item.label}
              onPress={item.onPress}
              className={`flex-row items-center justify-between px-4 py-4 ${
                i < 2 ? 'border-b border-gray-100' : ''
              }`}
            >
              <Text className="text-gray-800">{item.label}</Text>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleSignOut}
          className="rounded-2xl bg-red-50 py-4 items-center"
        >
          <Text className="font-medium text-red-600">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}
