import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native'
import { useState } from 'react'
import * as WebBrowser from 'expo-web-browser'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'expo-router'

WebBrowser.maybeCompleteAuthSession()

export default function LoginScreen() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleGoogleLogin() {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'skillsight://auth/callback',
          skipBrowserRedirect: true,
        },
      })

      if (error) throw error

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          'skillsight://auth/callback',
        )

        if (result.type === 'success') {
          const url = result.url
          const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1])
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')

          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
            router.replace('/(tabs)/home')
          }
        }
      }
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-blue-900">
      <View className="flex-1 items-center justify-center px-6">
        {/* Logo */}
        <View className="mb-2 rounded-3xl bg-white/10 px-8 py-4">
          <Text className="text-5xl font-bold text-white">
            Skill<Text className="text-blue-300">Sight</Text>
          </Text>
        </View>
        <Text className="mb-2 text-lg text-blue-200">AI-Powered Job Matching</Text>
        <Text className="mb-12 text-center text-sm text-blue-300">
          Semantic matching · Skill gap analysis · Transparent scoring
        </Text>

        {/* Google login */}
        <TouchableOpacity
          onPress={handleGoogleLogin}
          disabled={loading}
          className="w-full flex-row items-center justify-center gap-3 rounded-2xl bg-white px-6 py-4"
        >
          {loading ? (
            <ActivityIndicator color="#1d4ed8" />
          ) : (
            <Text className="text-base font-semibold text-gray-800">
              Continue with Google
            </Text>
          )}
        </TouchableOpacity>

        <Text className="mt-6 text-center text-xs text-blue-400">
          By continuing, you agree to SkillSight&apos;s Terms & Privacy Policy.
        </Text>
      </View>
    </SafeAreaView>
  )
}
