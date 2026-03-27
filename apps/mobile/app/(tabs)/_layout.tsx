import { Tabs } from 'expo-router'
import { View, Text, StyleSheet } from 'react-native'
import { Feather, Ionicons } from '@expo/vector-icons'

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
  return (
    <View style={styles.headerRight}>
      <Feather name="bell" size={20} color="#4b5563" />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>6</Text>
      </View>
    </View>
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
    marginRight: 20,
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
