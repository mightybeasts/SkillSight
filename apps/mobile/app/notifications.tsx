import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useCallback, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Stack, useRouter } from 'expo-router'
import { Feather } from '@expo/vector-icons'
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

const TYPE_ICON: Record<string, { icon: any; color: string; bg: string }> = {
  application_shortlisted: { icon: 'check-circle', color: '#10b981', bg: '#ecfdf5' },
  application_interview: { icon: 'calendar', color: '#6366f1', bg: '#eef2ff' },
  application_offer: { icon: 'award', color: '#0d9488', bg: '#ccfbf1' },
  application_rejected: { icon: 'x-circle', color: '#ef4444', bg: '#fef2f2' },
  new_job_match: { icon: 'briefcase', color: '#2563eb', bg: '#eff6ff' },
  application_received: { icon: 'user-plus', color: '#9333ea', bg: '#faf5ff' },
}

export default function NotificationsScreen() {
  const router = useRouter()
  const qc = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications/?limit=50').then((r) => r.data as Notification[]),
  })

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  const onTap = async (n: Notification) => {
    if (!n.is_read) {
      try {
        await api.post(`/notifications/${n.id}/read`)
        qc.setQueryData(['notifications'], (prev: Notification[] | undefined) =>
          (prev || []).map((x) => (x.id === n.id ? { ...x, is_read: true } : x)),
        )
        qc.invalidateQueries({ queryKey: ['notifications-unread'] })
      } catch {}
    }
    if (n.link_url) router.push(n.link_url as any)
  }

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all')
      qc.setQueryData(['notifications'], (prev: Notification[] | undefined) =>
        (prev || []).map((x) => ({ ...x, is_read: true })),
      )
      qc.invalidateQueries({ queryKey: ['notifications-unread'] })
    } catch {}
  }

  const hasUnread = (data || []).some((n) => !n.is_read)

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Notifications',
          headerTitleStyle: { fontWeight: '700', fontSize: 17 },
          headerStyle: { backgroundColor: '#ffffff' },
          headerRight: () =>
            hasUnread ? (
              <TouchableOpacity onPress={markAllRead} style={{ marginRight: 16 }}>
                <Text style={styles.markAll}>Mark all read</Text>
              </TouchableOpacity>
            ) : null,
        }}
      />
      <View style={styles.container}>
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#2563eb" />
        ) : !data || data.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Feather name="bell-off" size={28} color="#9ca3af" />
            </View>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySub}>
              You'll be notified about job matches and application updates.
            </Text>
          </View>
        ) : (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={{ paddingVertical: 8 }}
          >
            {data.map((n) => {
              const meta = TYPE_ICON[n.type] || { icon: 'bell', color: '#6b7280', bg: '#f3f4f6' }
              return (
                <TouchableOpacity
                  key={n.id}
                  onPress={() => onTap(n)}
                  activeOpacity={0.7}
                  style={[styles.row, !n.is_read && styles.rowUnread]}
                >
                  <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
                    <Feather name={meta.icon} size={18} color={meta.color} />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{n.title}</Text>
                    {n.body ? (
                      <Text style={styles.rowBody} numberOfLines={2}>
                        {n.body}
                      </Text>
                    ) : null}
                    <Text style={styles.rowTime}>{timeAgo(n.created_at)}</Text>
                  </View>
                  {!n.is_read && <View style={styles.dot} />}
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        )}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  markAll: { color: '#2563eb', fontWeight: '600', fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  rowUnread: { backgroundColor: '#eff6ff' },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  rowBody: { fontSize: 13, color: '#4b5563', marginTop: 2 },
  rowTime: { fontSize: 11, color: '#9ca3af', marginTop: 6, fontWeight: '500' },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
    marginTop: 6,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  emptySub: { fontSize: 13, color: '#6b7280', marginTop: 6, textAlign: 'center' },
})
