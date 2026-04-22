import { Tabs, useRouter } from 'expo-router'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Feather, Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

function TabIcon({ name, color, active }: { name: any; color: string; active?: boolean }) {
  return (
    <View style={[styles.iconContainer, active && { backgroundColor: '#eef2ff' }]}>
      <Feather name={name} size={18} color={color} />
    </View>
  )
}

function HeaderLogo() {
  return (
    <View style={styles.headerLeft}>
      <View style={styles.logoIconBg}>
        <Ionicons name="eye" size={16} color="#ffffff" />
      </View>
      <Text style={styles.headerTitleText}>
        <Text style={{ color: '#111827' }}>Skill</Text>
        <Text style={{ color: '#2563eb' }}>Sight</Text>
      </Text>
    </View>
  )
}

function HeaderRight() {
  const router = useRouter()
  const { data } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () =>
      api.get('/notifications/unread-count').then((r) => r.data?.count ?? 0).catch(() => 0),
    refetchInterval: 30_000,
  })
  const count: number = data ?? 0
  return (
    <TouchableOpacity
      style={styles.headerRight}
      onPress={() => router.push('/notifications')}
      activeOpacity={0.7}
    >
      <Feather name="bell" size={20} color="#4b5563" />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 9 ? '9+' : String(count)}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
        headerStyle: styles.header,
        headerShadowVisible: true,
        headerTitle: '',
        headerLeft: () => <HeaderLogo />,
        headerRight: () => <HeaderRight />,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <TabIcon name="home" color={color} active={focused} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Job Profiles',
          tabBarIcon: ({ color, focused }) => <TabIcon name="briefcase" color={color} active={focused} />,
        }}
      />
      <Tabs.Screen
        name="resumes"
        options={{
          title: 'Resume',
          tabBarIcon: ({ color, focused }) => <TabIcon name="file-text" color={color} active={focused} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'AI Analyse',
          tabBarIcon: ({ color, focused }) => <TabIcon name="cpu" color={color} active={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'More',
          tabBarIcon: ({ color, focused }) => <TabIcon name="grid" color={color} active={focused} />,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingBottom: 6,
    paddingTop: 6,
    height: 60,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    height: 60,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  logoIconBg: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitleText: {
    fontWeight: '800',
    fontSize: 19,
    letterSpacing: -0.4,
  },
  headerRight: {
    marginRight: 16,
    paddingHorizontal: 6,
    paddingVertical: 6,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 2,
  },
})
