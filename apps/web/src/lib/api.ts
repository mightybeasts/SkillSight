import axios from 'axios'
import { createClient } from '@/lib/supabase'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL + '/v1',
  timeout: 30000,
})

// Attach Supabase JWT to every request
api.interceptors.request.use(async (config) => {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default api
