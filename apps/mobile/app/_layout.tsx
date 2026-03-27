import { Stack } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { View } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'expo-router'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
})

export default function RootLayout() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.replace('/(tabs)/home')
      } else {
        router.replace('/(auth)/login')
      }
    })
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <View style={{ flex: 1 }}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </QueryClientProvider>
  )
}
