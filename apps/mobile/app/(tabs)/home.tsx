import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native'
import { useCallback, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Feather } from '@expo/vector-icons'
import api from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'expo-router'

const currentDate = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
})

export default function HomeScreen() {
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const name =
        data?.user?.user_metadata?.full_name ||
        data?.user?.email?.split('@')[0] ||
        ''
      setUserName(name)
    })
  }, [])

  // Fetch jobs for recommendations
  const { data: jobs, isLoading: jobsLoading, refetch: refetchJobs } = useQuery({
    queryKey: ['jobs-home'],
    queryFn: () => api.get('/jobs/?limit=5').then((r) => r.data).catch(() => []),
  })

  // Fetch applications to show status
  const { data: applications, refetch: refetchApps } = useQuery({
    queryKey: ['applications'],
    queryFn: () => api.get('/applications/me').then((r) => r.data).catch(() => []),
  })

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refetchJobs(), refetchApps()])
    setRefreshing(false)
  }, [refetchJobs, refetchApps])

  const appCount = applications?.length || 0
  const shortlistedCount = applications?.filter((a: any) => a.status === 'shortlisted').length || 0

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.flex}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.dateText}>{currentDate}</Text>
          <Text style={styles.welcomeTitle}>Welcome, {userName || 'Job Seeker'}.</Text>
        </View>

        {/* Priority Action Card (Blue Theme) */}
        <View style={styles.priorityCard}>
          <View style={styles.priorityHeaderRow}>
            <View style={styles.priorityIconBadge}>
              <Feather name="zap" size={16} color="#ffffff" />
            </View>
            <Text style={styles.priorityHeaderLabel}>Action Required</Text>
          </View>
          <Text style={styles.priorityTitle}>
            Complete your Skills Profile to unlock 80% more accurate job matches.
          </Text>
          <TouchableOpacity 
            style={styles.priorityButton}
            onPress={() => router.push('/(tabs)/profile')}  
            activeOpacity={0.8}
          >
            <Text style={styles.priorityButtonText}>Update Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Application Status */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Application Status</Text>
          <View style={styles.healthStatsRow}>
            <TouchableOpacity 
              style={styles.healthStatCard}
              onPress={() => router.push('/(tabs)/resumes')}
              activeOpacity={0.7}
            >
              <View style={[styles.healthIcon, { backgroundColor: '#eff6ff' }]}>
                <Feather name="file-text" size={20} color="#3b82f6" />
              </View>
              <Text style={styles.healthStatNumber}>{appCount}</Text>
              <Text style={styles.healthStatLabel}>Submitted</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.healthStatCard}
              onPress={() => router.push('/(tabs)/resumes')}
              activeOpacity={0.7}
            >
              <View style={[styles.healthIcon, { backgroundColor: '#ecfdf5' }]}>
                <Feather name="check-circle" size={20} color="#10b981" />
              </View>
              <Text style={styles.healthStatNumber}>{shortlistedCount}</Text>
              <Text style={styles.healthStatLabel}>Shortlisted</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recommended Jobs */}
        <View style={[styles.sectionContainer, { paddingBottom: 40 }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recommended For You</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/jobs')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.activityList}>
            {jobsLoading ? (
              <ActivityIndicator style={{ marginTop: 20 }} color="#2563eb" />
            ) : jobs && jobs.length > 0 ? (
              jobs.map((job: any) => (
                <TouchableOpacity 
                  key={job.id} 
                  style={styles.activityCard}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/job/${job.id}` as any)}
                >
                  <View style={styles.activityIconWrapper}>
                    <Feather name="briefcase" size={18} color="#2563eb" />
                  </View>
                  <View style={styles.activityTextContainer}>
                    <Text style={styles.activityTitle} numberOfLines={1}>
                      {job.title}
                    </Text>
                    <Text style={styles.activitySub}>
                      {job.company} · {job.location || 'Remote'}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={20} color="#d1d5db" />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyActivity}>
                <Text style={styles.emptyActivityText}>No recommended jobs found. Try completing your profile!</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  flex: {
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  dateText: {
    fontSize: 13,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
    marginBottom: 6,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  priorityCard: {
    marginHorizontal: 20,
    backgroundColor: '#2563eb', // Blue-600
    borderRadius: 24,
    padding: 24,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  priorityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  priorityIconBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 12,
  },
  priorityHeaderLabel: {
    color: '#ffffff',
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  priorityTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
  },
  priorityButton: {
    marginTop: 24,
    backgroundColor: '#ffffff',
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  priorityButtonText: {
    color: '#2563eb',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  healthStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  healthStatCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  healthIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthStatNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginTop: 16,
    letterSpacing: -0.5,
  },
  healthStatLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    fontWeight: '500',
  },
  activityList: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    overflow: 'hidden',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  activityIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  activityTextContainer: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  activitySub: {
    fontSize: 13,
    color: '#6b7280',
  },
  emptyActivity: {
    padding: 24,
    alignItems: 'center',
  },
  emptyActivityText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
})
