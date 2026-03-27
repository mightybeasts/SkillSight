import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'

let storage: any = undefined

if (Platform.OS !== 'web') {
  const SecureStore = require('expo-secure-store')
  storage = {
    getItem: (key: string) => SecureStore.getItemAsync(key),
    setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
    removeItem: (key: string) => SecureStore.deleteItemAsync(key),
  }
}

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      ...(storage ? { storage } : {}),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  },
)
