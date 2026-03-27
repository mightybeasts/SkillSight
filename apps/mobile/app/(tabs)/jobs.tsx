import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native'
import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useRouter } from 'expo-router'

const JOB_TYPE_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Full Time', value: 'full_time' },
  { label: 'Part Time', value: 'part_time' },
  { label: 'Internship', value: 'internship' },
  { label: 'Contract', value: 'contract' },
  { label: 'Freelance', value: 'freelance' },
]

function getScoreColor(score: number) {
  if (score >= 0.7) return '#059669'
  if (score >= 0.4) return '#d97706'
  return '#dc2626'
}

function getScoreBg(score: number) {
  if (score >= 0.7) return '#ecfdf5'
  if (score >= 0.4) return '#fffbeb'
  return '#fef2f2'
}

function getStatusBadge(status: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    applied: { bg: '#eff6ff', text: '#1d4ed8', label: 'Applied' },
    screening: { bg: '#fffbeb', text: '#d97706', label: 'Screening' },
    shortlisted: { bg: '#ecfdf5', text: '#059669', label: 'Shortlisted' },
    interview: { bg: '#f3e8ff', text: '#7c3aed', label: 'Interview' },
    offer: { bg: '#ecfdf5', text: '#059669', label: 'Offer' },
    rejected: { bg: '#fef2f2', text: '#dc2626', label: 'Rejected' },
    withdrawn: { bg: '#f1f5f9', text: '#6b7280', label: 'Withdrawn' },
  }
  return map[status] || null
}

export default function JobsScreen() {
  const [search, setSearch] = useState('')
  const [jobType, setJobType] = useState('')
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  const queryParams = [
    'limit=50',
    search ? `search=${encodeURIComponent(search)}` : '',
    jobType ? `job_type=${jobType}` : '',
    remoteOnly ? 'is_remote=true' : '',
  ]
    .filter(Boolean)
    .join('&')

  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ['jobs', search, jobType, remoteOnly],
    queryFn: () =>
      api.get(`/jobs/?${queryParams}`).then((r) => r.data),
  })

  const { data: matchScores, refetch: refetchScores } = useQuery({
    queryKey: ['my-match-scores'],
    queryFn: () =>
      api.get('/matches/my-scores').then((r) => r.data).catch(() => null),
  })

  // Fetch user's applications to show status on job cards
  const { data: myApplications, refetch: refetchApps } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () =>
      api.get('/applications/me').then((r) => r.data).catch(() => []),
  })

  const scoreMap = useMemo(() => {
    const map = new Map<string, number>()
    if (matchScores?.scores) {
      for (const s of matchScores.scores) {
        map.set(s.job_id, s.overall_score)
      }
    }
    return map
  }, [matchScores])

  // Auto-trigger batch matching when jobs load but scores are missing
  const batchTriggered = useRef(false)

  useEffect(() => {
    if (batchTriggered.current) return
    if (!jobs || jobs.length === 0) return

    const hasAllScores = matchScores?.scores?.length >= jobs.length
    if (hasAllScores) return

    batchTriggered.current = true
    api.post('/matches/compute-all')
      .then(() => {
        // Poll for scores as worker computes them
        setTimeout(() => refetchScores(), 10000)
        setTimeout(() => refetchScores(), 20000)
        setTimeout(() => refetchScores(), 35000)
      })
      .catch(() => {})
  }, [jobs, matchScores])

  // Map job_id -> application status
  const applicationMap = useMemo(() => {
    const map = new Map<string, string>()
    if (myApplications) {
      for (const app of myApplications) {
        map.set(app.job_id, app.status)
      }
    }
    return map
  }, [myApplications])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refetch(), refetchScores(), refetchApps()])
    setRefreshing(false)
  }, [refetch, refetchScores, refetchApps])

  function formatSalary(min: number, max: number, currency: string) {
    const c = currency || 'USD'
    const fmt = (n: number) => {
      if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
      return n.toString()
    }
    if (min && max) return `${c} ${fmt(min)} - ${fmt(max)}`
    if (min) return `${c} ${fmt(min)}+`
    return ''
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by title, company..."
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
            returnKeyType="search"
          />
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {JOB_TYPE_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.value}
              onPress={() => setJobType(f.value)}
              style={[
                styles.filterChip,
                jobType === f.value && styles.filterChipActive,
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  jobType === f.value && styles.filterChipTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => setRemoteOnly(!remoteOnly)}
            style={[
              styles.filterChip,
              remoteOnly && styles.filterChipRemote,
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                remoteOnly && styles.filterChipTextRemote,
              ]}
            >
              Remote Only
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1d4ed8" />
        }
      >
        {/* Results count */}
        {!isLoading && jobs?.length > 0 && (
          <Text style={styles.resultsCount}>
            {jobs.length} position{jobs.length !== 1 ? 's' : ''} found
          </Text>
        )}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1d4ed8" />
            <Text style={styles.loadingText}>Finding jobs...</Text>
          </View>
        ) : !jobs?.length ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No jobs found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search or filters
            </Text>
          </View>
        ) : (
          <View style={styles.jobsList}>
            {jobs.map((job: any) => {
              const score = scoreMap.get(job.id)
              const appStatus = applicationMap.get(job.id)
              const jobClosed = job.status === 'closed'
              const statusInfo = appStatus ? getStatusBadge(appStatus) : null

              return (
                <TouchableOpacity
                  key={job.id}
                  onPress={() => router.push(`/job/${job.id}` as any)}
                  style={styles.jobCard}
                  activeOpacity={0.7}
                >
                  <View style={styles.jobCardHeader}>
                    <View style={styles.companyAvatar}>
                      <Text style={styles.companyAvatarText}>
                        {(job.company || 'C')[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.jobHeaderInfo}>
                      <Text style={styles.jobTitle} numberOfLines={2}>
                        {job.title}
                      </Text>
                      <Text style={styles.jobCompany} numberOfLines={1}>
                        {job.company}
                      </Text>
                    </View>
                    {score !== undefined && (
                      <View style={[styles.scoreBadge, { backgroundColor: getScoreBg(score) }]}>
                        <Text style={[styles.scoreBadgeText, { color: getScoreColor(score) }]}>
                          {Math.round(score * 100)}%
                        </Text>
                        <Text style={[styles.scoreBadgeLabel, { color: getScoreColor(score) }]}>
                          Match
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Meta row */}
                  <View style={styles.metaRow}>
                    {job.location && (
                      <Text style={styles.metaText}>{job.location}</Text>
                    )}
                    {job.job_type && (
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>
                          {job.job_type.replace('_', ' ')}
                        </Text>
                      </View>
                    )}
                    {job.is_remote && (
                      <View style={styles.remoteBadge}>
                        <Text style={styles.remoteBadgeText}>Remote</Text>
                      </View>
                    )}
                  </View>

                  {/* Bottom Row - Salary + Status */}
                  <View style={styles.bottomRow}>
                    {job.salary_min ? (
                      <Text style={styles.salaryText}>
                        {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                      </Text>
                    ) : (
                      <View />
                    )}

                    {/* Application Status Badge */}
                    {jobClosed ? (
                      <View style={[styles.statusBadge, { backgroundColor: '#f1f5f9' }]}>
                        <Text style={[styles.statusBadgeText, { color: '#6b7280' }]}>Closed</Text>
                      </View>
                    ) : statusInfo ? (
                      <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: statusInfo.text }]}>
                          {statusInfo.label}
                        </Text>
                      </View>
                    ) : (
                      <View style={[styles.statusBadge, { backgroundColor: '#eff6ff' }]}>
                        <Text style={[styles.statusBadgeText, { color: '#1d4ed8' }]}>To Apply</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  flex: {
    flex: 1,
  },
  searchSection: {
    backgroundColor: '#ffffff',
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchRow: {
    paddingHorizontal: 16,
  },
  searchInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#0f172a',
  },
  filtersRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  filterChipRemote: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  filterChipTextRemote: {
    color: '#059669',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  resultsCount: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  jobsList: {
    gap: 10,
  },
  jobCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  jobCardHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  companyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#475569',
  },
  jobHeaderInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 22,
  },
  jobCompany: {
    marginTop: 2,
    fontSize: 14,
    color: '#6b7280',
  },
  scoreBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 52,
  },
  scoreBadgeText: {
    fontSize: 16,
    fontWeight: '800',
  },
  scoreBadgeLabel: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
    marginLeft: 56,
  },
  metaText: {
    fontSize: 13,
    color: '#6b7280',
  },
  typeBadge: {
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeBadgeText: {
    fontSize: 12,
    color: '#1d4ed8',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  remoteBadge: {
    backgroundColor: '#ecfdf5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  remoteBadgeText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginLeft: 56,
  },
  salaryText: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '700',
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
})
