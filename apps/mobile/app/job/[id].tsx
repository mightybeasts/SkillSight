import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Alert,
  Modal,
  Pressable,
} from 'react-native'
import { useState, useEffect } from 'react'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Feather } from '@expo/vector-icons'
import api from '@/lib/api'

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [optimizedResume, setOptimizedResume] = useState<any>(null)
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => api.get(`/jobs/${id}`).then((r) => r.data),
    enabled: !!id,
  })

  const { data: resumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => api.get('/resumes').then((r) => r.data).catch(() => []),
  })

  // Check application status for this job
  const { data: appStatus, refetch: refetchAppStatus } = useQuery({
    queryKey: ['app-status', id],
    queryFn: () =>
      api.get(`/applications/job/${id}/status`).then((r) => r.data).catch(() => ({ applied: false })),
    enabled: !!id,
  })

  const completedResumes = resumes?.filter(
    (r: any) => r.processing_status === 'completed',
  ) || []

  const primaryResume = completedResumes.find((r: any) => r.is_master) || completedResumes[0]

  useEffect(() => {
    if (!selectedResumeId && primaryResume?.id) {
      setSelectedResumeId(primaryResume.id)
    }
  }, [primaryResume?.id, selectedResumeId])

  const selectedResume =
    completedResumes.find((r: any) => r.id === selectedResumeId) || primaryResume

  // Auto-fetch cached match result
  const { data: matchData, isLoading: matchLoading } = useQuery({
    queryKey: ['my-match', id],
    queryFn: () =>
      api.get(`/matches/my-match/${id}`).then((r) => r.data).catch(() => null),
    enabled: !!id,
    refetchInterval: (query) => {
      if (!query.state.data && primaryResume) return 10000
      return false
    },
  })

  const reanalyzeMutation = useMutation({
    mutationFn: async () => {
      if (!primaryResume) throw new Error('No profile data available')
      await api.post('/matches/analyze', {
        resume_id: primaryResume.id,
        job_id: id,
      })
      const maxAttempts = 15
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((r) => setTimeout(r, 3000))
        try {
          const result = await api.get(`/matches/my-match/${id}`)
          return result.data
        } catch (err: any) {
          if (err?.response?.status === 404 && i < maxAttempts - 1) continue
          throw err
        }
      }
      throw new Error('Analysis timed out. Please try again.')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-match', id] })
      queryClient.invalidateQueries({ queryKey: ['my-match-scores'] })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || 'Analysis failed. Please try again.'
      if (Platform.OS === 'web') alert(msg)
      else Alert.alert('Error', msg)
    },
  })

  const optimizeMutation = useMutation({
    mutationFn: async () => {
      const result = await api.post(
        `/matches/${matchData.match_result.id}/optimize-resume`,
      )
      return result.data
    },
    onSuccess: (data) => {
      setOptimizedResume(data)
    },
    onError: () => {
      if (Platform.OS === 'web') alert('Failed to generate optimized resume.')
      else Alert.alert('Error', 'Failed to generate optimized resume.')
    },
  })

  const applyMutation = useMutation({
    mutationFn: async () => {
      const result = await api.post('/applications/', {
        job_id: id,
        resume_id: selectedResume?.id || null,
        cover_letter: '',
      })
      return result.data
    },
    onSuccess: () => {
      if (Platform.OS === 'web') alert('Successfully applied for this job!')
      else Alert.alert('Success', 'Successfully applied for this job!')
      refetchAppStatus()
      queryClient.invalidateQueries({ queryKey: ['my-applications'] })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail?.[0]?.msg || err?.response?.data?.detail || 'Application failed. Have you already applied?'
      if (Platform.OS === 'web') alert(msg)
      else Alert.alert('Notice', msg)
    },
  })

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const result = await api.patch(`/applications/${appStatus.application_id}/withdraw`)
      return result.data
    },
    onSuccess: () => {
      if (Platform.OS === 'web') alert('Application withdrawn.')
      else Alert.alert('Done', 'Application withdrawn.')
      refetchAppStatus()
      queryClient.invalidateQueries({ queryKey: ['my-applications'] })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || 'Failed to withdraw.'
      if (Platform.OS === 'web') alert(msg)
      else Alert.alert('Error', msg)
    },
  })

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

  function getScoreLabel(score: number) {
    if (score >= 0.8) return 'Excellent Match'
    if (score >= 0.7) return 'Strong Match'
    if (score >= 0.5) return 'Moderate Match'
    if (score >= 0.4) return 'Fair Match'
    return 'Needs Improvement'
  }

  const hasApplied = appStatus?.applied === true
  const currentStatus = appStatus?.status
  const isRejected = currentStatus === 'rejected'
  const isWithdrawn = currentStatus === 'withdrawn'
  const jobClosed = job?.status === 'closed'

  if (jobLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: true, title: 'Job Details', headerStyle: { backgroundColor: '#0f172a' }, headerTintColor: '#ffffff' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1d4ed8" />
        </View>
      </SafeAreaView>
    )
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: true, title: 'Job Details', headerStyle: { backgroundColor: '#0f172a' }, headerTintColor: '#ffffff' }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Job not found</Text>
        </View>
      </SafeAreaView>
    )
  }

  const activeMatch = matchData

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Job Details',
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        }}
      />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Job Header */}
        <View style={styles.jobHeader}>
          <View style={styles.companyAvatar}>
            <Text style={styles.companyAvatarText}>
              {(job.company || 'C')[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.jobCompany}>{job.company}</Text>
          <View style={styles.metaRow}>
            {job.location && <Text style={styles.metaText}>{job.location}</Text>}
            {job.job_type && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{job.job_type.replace('_', ' ')}</Text>
              </View>
            )}
            {job.is_remote && (
              <View style={styles.badgeGreen}>
                <Text style={styles.badgeGreenText}>Remote</Text>
              </View>
            )}
            {job.experience_level && (
              <View style={styles.badgePurple}>
                <Text style={styles.badgePurpleText}>
                  {job.experience_level.charAt(0).toUpperCase() + job.experience_level.slice(1)}
                </Text>
              </View>
            )}
          </View>
          {(job.salary_min || job.salary_max) && (
            <Text style={styles.salary}>
              {job.salary_currency || 'USD'}{' '}
              {job.salary_min?.toLocaleString()}
              {job.salary_max ? ` - ${job.salary_max.toLocaleString()}` : '+'}
            </Text>
          )}
        </View>

        {/* Rejection Notice */}
        {isRejected && (
          <View style={styles.rejectionCard}>
            <Text style={styles.rejectionTitle}>Application Rejected</Text>
            {appStatus?.rejection_reason && (
              <Text style={styles.rejectionReason}>
                Reason: {appStatus.rejection_reason}
              </Text>
            )}
          </View>
        )}

        {/* Application Status Banner */}
        {hasApplied && !isRejected && (
          <View style={[
            styles.statusBanner,
            currentStatus === 'shortlisted' ? { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' } :
            currentStatus === 'interview' ? { backgroundColor: '#f3e8ff', borderColor: '#c4b5fd' } :
            currentStatus === 'offer' ? { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' } :
            currentStatus === 'withdrawn' ? { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' } :
            { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }
          ]}>
            <Text style={[
              styles.statusBannerText,
              currentStatus === 'shortlisted' ? { color: '#059669' } :
              currentStatus === 'interview' ? { color: '#7c3aed' } :
              currentStatus === 'offer' ? { color: '#059669' } :
              currentStatus === 'withdrawn' ? { color: '#6b7280' } :
              { color: '#1d4ed8' }
            ]}>
              Status: {currentStatus ? currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1) : 'Applied'}
            </Text>
          </View>
        )}

        {/* Match Score Card - auto-loaded */}
        {activeMatch ? (
          <View style={styles.scoreCard}>
            <View
              style={[
                styles.scoreCircle,
                { backgroundColor: getScoreBg(activeMatch.match_result.overall_score) },
              ]}
            >
              <Text
                style={[
                  styles.scoreValue,
                  { color: getScoreColor(activeMatch.match_result.overall_score) },
                ]}
              >
                {Math.round(activeMatch.match_result.overall_score * 100)}%
              </Text>
            </View>
            <Text style={styles.scoreLabel}>
              {getScoreLabel(activeMatch.match_result.overall_score)}
            </Text>

            <View style={styles.subScores}>
              {[
                { label: 'Skills', v: activeMatch.match_result.skill_score },
                { label: 'Semantic', v: activeMatch.match_result.semantic_score },
                { label: 'Experience', v: activeMatch.match_result.experience_score },
                { label: 'Education', v: activeMatch.match_result.education_score },
              ].map((s) => (
                <View key={s.label} style={styles.subScoreItem}>
                  <Text style={[styles.subScoreValue, { color: getScoreColor(s.v) }]}>
                    {Math.round(s.v * 100)}%
                  </Text>
                  <Text style={styles.subScoreLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => reanalyzeMutation.mutate()}
              disabled={reanalyzeMutation.isPending}
              style={styles.reanalyzeLink}
              activeOpacity={0.6}
            >
              <Text style={styles.reanalizeLinkText}>
                {reanalyzeMutation.isPending ? 'Re-analyzing...' : 'Re-analyze match'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : primaryResume ? (
          <View style={styles.analyzingCard}>
            {matchLoading ? (
              <>
                <ActivityIndicator size="small" color="#1d4ed8" />
                <Text style={styles.analyzingText}>Loading match analysis...</Text>
              </>
            ) : (
              <>
                <ActivityIndicator size="small" color="#6b7280" />
                <Text style={styles.analyzingText}>
                  Analyzing your profile skills against this position. Check back shortly.
                </Text>
              </>
            )}
          </View>
        ) : (
          <View style={styles.noResumeCard}>
            <Text style={styles.noResumeText}>
              Complete your profile with skills, education, and projects to see your match score.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile')}
              style={styles.uploadBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.uploadBtnText}>Go to Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {jobClosed ? (
            <View style={styles.closedBtn}>
              <Text style={styles.closedBtnText}>Position Closed</Text>
            </View>
          ) : hasApplied ? (
            <View style={styles.actionRow}>
              <View style={styles.appliedBtn}>
                <Text style={styles.appliedBtnText}>Applied</Text>
              </View>
              {!isWithdrawn && !isRejected && (
                <TouchableOpacity
                  onPress={() => {
                    const doWithdraw = () => withdrawMutation.mutate()
                    if (Platform.OS === 'web') {
                      if (confirm('Are you sure you want to withdraw this application?')) doWithdraw()
                    } else {
                      Alert.alert(
                        'Not Interested?',
                        'Are you sure you want to withdraw your application?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Withdraw', style: 'destructive', onPress: doWithdraw },
                        ],
                      )
                    }
                  }}
                  disabled={withdrawMutation.isPending}
                  style={styles.notInterestedBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.notInterestedBtnText}>
                    {withdrawMutation.isPending ? 'Withdrawing...' : 'Not Interested'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View>
              {completedResumes.length > 0 && (
                <TouchableOpacity
                  onPress={() => setPickerOpen(true)}
                  style={styles.resumePickerRow}
                  activeOpacity={0.7}
                >
                  <View style={styles.resumePickerIcon}>
                    <Feather name="file-text" size={16} color="#2563eb" />
                  </View>
                  <View style={styles.resumePickerText}>
                    <Text style={styles.resumePickerLabel}>Applying with</Text>
                    <Text style={styles.resumePickerName} numberOfLines={1}>
                      {selectedResume?.title || 'Select a resume'}
                      {selectedResume?.is_master ? '  (Master)' : ''}
                    </Text>
                  </View>
                  <Feather name="chevron-down" size={18} color="#6b7280" />
                </TouchableOpacity>
              )}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  onPress={() => applyMutation.mutate()}
                  disabled={applyMutation.isPending || !selectedResume}
                  style={[
                    styles.applyMainBtn,
                    (applyMutation.isPending || !selectedResume) && styles.buttonDisabled,
                  ]}
                  activeOpacity={0.8}
                >
                  {applyMutation.isPending ? (
                    <View style={styles.btnRow}>
                      <ActivityIndicator color="#ffffff" size="small" />
                      <Text style={styles.applyBtnText}>Submitting...</Text>
                    </View>
                  ) : (
                    <Text style={styles.applyBtnText}>Apply Now</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Job Description */}
        {job.description && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Description</Text>
            <Text style={styles.cardContent}>{job.description}</Text>
          </View>
        )}

        {job.requirements && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Requirements</Text>
            <Text style={styles.cardContent}>{job.requirements}</Text>
          </View>
        )}

        {job.responsibilities && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Responsibilities</Text>
            <Text style={styles.cardContent}>{job.responsibilities}</Text>
          </View>
        )}

        {/* Match Details - shown automatically when available */}
        {activeMatch && (
          <View style={styles.results}>
            {activeMatch.match_result.explanation && (
              <View style={styles.card}>
                <Text style={styles.cardTitleBlue}>AI Insight</Text>
                <Text style={styles.cardContent}>
                  {activeMatch.match_result.explanation}
                </Text>
              </View>
            )}

            {activeMatch.match_result.matched_skills?.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  Matched Skills ({activeMatch.match_result.matched_skills.length})
                </Text>
                <View style={styles.skillsRow}>
                  {activeMatch.match_result.matched_skills.map((s: any) => (
                    <View key={s.skill_name} style={styles.matchedSkill}>
                      <Text style={styles.matchedSkillText}>{s.skill_name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {activeMatch.match_result.missing_skills?.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  Missing Skills ({activeMatch.match_result.missing_skills.length})
                </Text>
                <View style={styles.skillsRow}>
                  {activeMatch.match_result.missing_skills.map((s: any) => (
                    <View key={s.skill_name} style={styles.missingSkill}>
                      <Text style={styles.missingSkillText}>{s.skill_name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {activeMatch.skill_gaps?.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Skill Gap Breakdown</Text>
                {activeMatch.skill_gaps.map((gap: any) => (
                  <View key={gap.id} style={styles.gapRow}>
                    <View style={styles.gapInfo}>
                      <Text style={styles.gapSkillName}>{gap.skill_name}</Text>
                      <Text
                        style={[
                          styles.gapImportance,
                          {
                            color:
                              gap.importance === 'critical'
                                ? '#dc2626'
                                : gap.importance === 'high'
                                ? '#d97706'
                                : '#6b7280',
                          },
                        ]}
                      >
                        {gap.importance} - {gap.gap_type}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {activeMatch.recommendations?.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Recommended Learning</Text>
                {activeMatch.recommendations.map((rec: any) => (
                  <View key={rec.id} style={styles.recItem}>
                    <Text style={styles.recTitle}>{rec.resource_title}</Text>
                    <Text style={styles.recMeta}>
                      {rec.resource_provider} -- {rec.resource_type}
                      {rec.estimated_hours ? ` -- ~${rec.estimated_hours}h` : ''}
                    </Text>
                    <View style={styles.recSkillTag}>
                      <Text style={styles.recSkillTagText}>
                        For: {rec.skill_name}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              onPress={() => optimizeMutation.mutate()}
              disabled={optimizeMutation.isPending}
              style={[
                styles.optimizeBtn,
                optimizeMutation.isPending && styles.buttonDisabled,
              ]}
              activeOpacity={0.8}
            >
              {optimizeMutation.isPending ? (
                <View style={styles.btnRow}>
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text style={styles.optimizeBtnText}>Generating...</Text>
                </View>
              ) : (
                <Text style={styles.optimizeBtnText}>
                  Build Optimized Resume for This Job
                </Text>
              )}
            </TouchableOpacity>

            {optimizedResume && (
              <View style={styles.card}>
                <Text style={styles.cardTitleBlue}>Optimized Resume</Text>

                {optimizedResume.suggested_summary && (
                  <View style={styles.optimizedSection}>
                    <Text style={styles.optimizedLabel}>Suggested Summary</Text>
                    <Text style={styles.optimizedContent}>
                      {optimizedResume.suggested_summary}
                    </Text>
                  </View>
                )}

                {optimizedResume.tailoring_suggestions?.length > 0 && (
                  <View style={styles.optimizedSection}>
                    <Text style={styles.optimizedLabel}>Tailoring Tips</Text>
                    {optimizedResume.tailoring_suggestions.map(
                      (tip: string, i: number) => (
                        <View key={i} style={styles.tipRow}>
                          <Text style={styles.tipBullet}>-</Text>
                          <Text style={styles.tipText}>{tip}</Text>
                        </View>
                      ),
                    )}
                  </View>
                )}

                {optimizedResume.highlighted_skills?.length > 0 && (
                  <View style={styles.optimizedSection}>
                    <Text style={styles.optimizedLabel}>Highlight These Skills</Text>
                    <View style={styles.skillsRow}>
                      {optimizedResume.highlighted_skills.map((s: string) => (
                        <View key={s} style={styles.matchedSkill}>
                          <Text style={styles.matchedSkillText}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Resume</Text>
              <TouchableOpacity onPress={() => setPickerOpen(false)} hitSlop={8}>
                <Feather name="x" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            {completedResumes.length === 0 ? (
              <Text style={styles.modalEmpty}>No completed resumes yet.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 360 }}>
                {completedResumes.map((r: any) => {
                  const isSel = r.id === selectedResume?.id
                  const isTailored = !!r.parsed_data?._target_job_id
                  return (
                    <TouchableOpacity
                      key={r.id}
                      onPress={() => {
                        setSelectedResumeId(r.id)
                        setPickerOpen(false)
                      }}
                      style={[styles.modalRow, isSel && styles.modalRowActive]}
                      activeOpacity={0.7}
                    >
                      <View style={styles.modalRowText}>
                        <Text style={styles.modalRowTitle} numberOfLines={1}>
                          {r.title}
                        </Text>
                        <View style={styles.modalChips}>
                          {r.is_master && (
                            <View style={styles.chipMaster}>
                              <Text style={styles.chipMasterText}>Master</Text>
                            </View>
                          )}
                          {isTailored && (
                            <View style={styles.chipTailored}>
                              <Text style={styles.chipTailoredText}>Tailored</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      {isSel && <Feather name="check" size={18} color="#2563eb" />}
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            )}
            <TouchableOpacity
              onPress={() => {
                setPickerOpen(false)
                router.push('/resume-builder')
              }}
              style={styles.modalBuildBtn}
              activeOpacity={0.8}
            >
              <Feather name="plus" size={16} color="#2563eb" />
              <Text style={styles.modalBuildText}>Build a tailored resume</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
  },
  jobHeader: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  companyAvatar: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  companyAvatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#475569',
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 4,
  },
  jobCompany: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#6b7280',
    alignSelf: 'center',
  },
  badge: {
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    color: '#1d4ed8',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  badgeGreen: {
    backgroundColor: '#ecfdf5',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeGreenText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  badgePurple: {
    backgroundColor: '#f3e8ff',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgePurpleText: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '500',
  },
  salary: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },

  // Rejection Card
  rejectionCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  rejectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 4,
  },
  rejectionReason: {
    fontSize: 14,
    color: '#991b1b',
    lineHeight: 20,
  },

  // Status Banner
  statusBanner: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusBannerText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Score Card
  scoreCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
    alignItems: 'center',
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '800',
  },
  scoreLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  subScores: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  subScoreItem: {
    alignItems: 'center',
    flex: 1,
  },
  subScoreValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  subScoreLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  reanalyzeLink: {
    marginTop: 14,
    paddingVertical: 6,
  },
  reanalizeLinkText: {
    fontSize: 13,
    color: '#6b7280',
    textDecorationLine: 'underline',
  },

  // Analyzing / No Resume states
  analyzingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  analyzingText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  noResumeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
    alignItems: 'center',
  },
  noResumeText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  uploadBtn: {
    backgroundColor: '#1d4ed8',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  uploadBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Action Section
  actionSection: {
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  resumePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 10,
    gap: 12,
  },
  resumePickerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumePickerText: {
    flex: 1,
  },
  resumePickerLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  resumePickerName: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '700',
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalEmpty: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 24,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 12,
  },
  modalRowActive: {
    backgroundColor: '#eff6ff',
  },
  modalRowText: {
    flex: 1,
  },
  modalRowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  modalChips: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  chipMaster: {
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  chipMasterText: {
    fontSize: 11,
    color: '#b45309',
    fontWeight: '700',
  },
  chipTailored: {
    backgroundColor: '#ecfdf5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  chipTailoredText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
  },
  modalBuildBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
  },
  modalBuildText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '700',
  },
  applyMainBtn: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  appliedBtn: {
    flex: 1,
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  appliedBtnText: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '700',
  },
  notInterestedBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  notInterestedBtnText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
  closedBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  closedBtnText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  // Cards
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },
  cardTitleBlue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1d4ed8',
    marginBottom: 10,
  },
  cardContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },

  // Results
  results: {
    marginTop: 4,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  matchedSkill: {
    backgroundColor: '#ecfdf5',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  matchedSkillText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '500',
  },
  missingSkill: {
    backgroundColor: '#fef2f2',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  missingSkillText: {
    fontSize: 13,
    color: '#dc2626',
    fontWeight: '500',
  },
  gapRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  gapInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gapSkillName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  gapImportance: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  recItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  recTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  recMeta: {
    marginTop: 4,
    fontSize: 13,
    color: '#6b7280',
  },
  recSkillTag: {
    marginTop: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  recSkillTagText: {
    fontSize: 12,
    color: '#1d4ed8',
    fontWeight: '500',
  },
  optimizeBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  optimizeBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  optimizedSection: {
    marginBottom: 16,
  },
  optimizedLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  optimizedContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  tipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  tipBullet: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  tipText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    flex: 1,
  },
})
