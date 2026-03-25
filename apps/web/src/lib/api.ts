import axios from 'axios'
import { createClient } from '@/lib/supabase'
import { getDemoUser } from '@/lib/demo-auth'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL + '/v1',
  timeout: 30000,
})

// Attach auth to every request (Supabase JWT or demo user header)
api.interceptors.request.use(async (config) => {
  // Check demo mode first
  const demoUser = getDemoUser()
  if (demoUser) {
    config.headers['X-Demo-User-Id'] = demoUser.id
    config.headers['X-Demo-User-Role'] = demoUser.role
    return config
  }

  // Real auth via Supabase
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
      const demoUser = getDemoUser()
      if (!demoUser) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default api
