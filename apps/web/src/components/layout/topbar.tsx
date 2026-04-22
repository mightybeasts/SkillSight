'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

type Notification = {
  id: string
  type: string
  title: string
  body: string | null
  link_url: string | null
  is_read: boolean
  created_at: string
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export default function Topbar({ sidebarCollapsed }: { sidebarCollapsed: boolean }) {
  const [user, setUser] = useState<{ email?: string; full_name?: string; avatar_url?: string } | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
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

  const refreshUnread = () => {
    api.get('/notifications/unread-count')
      .then((r) => setUnreadCount(r.data?.count ?? 0))
      .catch(() => {})
  }

  useEffect(() => {
    refreshUnread()
    const id = setInterval(refreshUnread, 30000)
    return () => clearInterval(id)
  }, [])

  const openNotifications = async () => {
    const next = !notifOpen
    setNotifOpen(next)
    if (next) {
      try {
        const r = await api.get('/notifications/?limit=15')
        setNotifications(r.data || [])
      } catch {
        setNotifications([])
      }
    }
  }

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all')
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch {}
  }

  const onNotifClick = async (n: Notification) => {
    setNotifOpen(false)
    if (!n.is_read) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
      setUnreadCount((c) => Math.max(0, c - 1))
      try {
        await api.post(`/notifications/${n.id}/read`)
      } catch {}
    }
    if (n.link_url) router.push(n.link_url)
  }

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
        'fixed right-0 top-0 z-30 flex h-16 items-center justify-end border-b border-gray-200 bg-white/80 px-6 backdrop-blur-xl transition-all duration-300',
        sidebarCollapsed ? 'left-[68px]' : 'left-60',
      )}
    >
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={openNotifications}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100"
            aria-label="Notifications"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 z-50 mt-2 w-96 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">Notifications</p>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs font-medium text-recruiter-600 hover:text-recruiter-700"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm text-gray-500">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => onNotifClick(n)}
                        className={cn(
                          'flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3 text-left transition hover:bg-gray-50 last:border-0',
                          !n.is_read && 'bg-recruiter-50/40',
                        )}
                      >
                        <div className={cn(
                          'mt-1 h-2 w-2 shrink-0 rounded-full',
                          n.is_read ? 'bg-transparent' : 'bg-recruiter-500',
                        )} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">{n.title}</p>
                          {n.body && <p className="mt-0.5 truncate text-xs text-gray-600">{n.body}</p>}
                          <p className="mt-1 text-[10px] uppercase tracking-wide text-gray-400">{timeAgo(n.created_at)}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

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
