/**
 * Demo authentication — allows quick login as any role without Supabase.
 * Stores demo user in localStorage and provides helpers.
 */

export interface DemoUser {
  id: string
  email: string
  full_name: string
  role: 'student' | 'recruiter' | 'university'
  avatar_url: string | null
  company_name?: string
}

const DEMO_USERS: Record<string, DemoUser> = {
  student: {
    id: 'a1000000-0000-0000-0000-000000000001',
    email: 'aisha.khan@example.com',
    full_name: 'Aisha Khan',
    role: 'student',
    avatar_url: null,
  },
  recruiter: {
    id: 'b2000000-0000-0000-0000-000000000001',
    email: 'sarah.johnson@techcorp.com',
    full_name: 'Sarah Johnson',
    role: 'recruiter',
    avatar_url: null,
    company_name: 'TechCorp Inc.',
  },
  university: {
    id: 'c3000000-0000-0000-0000-000000000001',
    email: 'placement@stanford.edu',
    full_name: 'Dr. Emily Watson',
    role: 'university',
    avatar_url: null,
    company_name: 'Stanford University',
  },
}

const STORAGE_KEY = 'skillsight_demo_user'

export function demoLogin(role: 'student' | 'recruiter' | 'university'): DemoUser {
  const user = DEMO_USERS[role]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  return user
}

export function getDemoUser(): DemoUser | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored) as DemoUser
  } catch {
    return null
  }
}

export function demoLogout(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function isDemoMode(): boolean {
  return getDemoUser() !== null
}

export function getDemoUserDashboard(role: string): string {
  switch (role) {
    case 'recruiter':
      return '/recruiter/dashboard'
    case 'university':
      return '/university/dashboard'
    default:
      return '/dashboard'
  }
}
