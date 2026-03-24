import axios from 'axios'
import { supabase } from './supabase'

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL + '/v1',
  timeout: 30000,
})

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

export default api
