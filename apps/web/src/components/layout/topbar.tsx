'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function Topbar({ sidebarCollapsed }: { sidebarCollapsed: boolean }) {
  const [user, setUser] = useState<{ email?: string; full_name?: string; avatar_url?: string } | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
          avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture,
        })
      }
    })
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?'

  return (
    <header
      className={cn(
        'fixed right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-6 backdrop-blur-xl transition-all duration-300',
        sidebarCollapsed ? 'left-[68px]' : 'left-60',
      )}
    >
      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Search jobs, candidates..."
            className="h-10 w-80 rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 transition focus:border-gray-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-gray-50"
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-gray-100" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-recruiter-500 to-recruiter-700 text-xs font-bold text-white">
                {initials}
              </div>
            )}
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium text-gray-900">{user?.full_name || 'User'}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                  </svg>
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
