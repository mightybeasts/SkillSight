import { Tabs } from 'expo-router'
import { Text } from 'react-native'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        headerStyle: { backgroundColor: '#1d4ed8' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>🏠</Text>,
          headerTitle: 'SkillSight',
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>💼</Text>,
        }}
      />
      <Tabs.Screen
        name="resumes"
        options={{
          title: 'Resumes',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>📄</Text>,
        }}
      />
      <Tabs.Screen
        name="match"
        options={{
          title: 'Match',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>⚡</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>👤</Text>,
        }}
      />
    </Tabs>
  )
}
