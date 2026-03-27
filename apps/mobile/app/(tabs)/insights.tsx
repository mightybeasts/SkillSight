import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Linking,
} from 'react-native'
import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useRouter } from 'expo-router'

type TabKey = 'gaps' | 'learning' | 'history'

export default function InsightsScreen() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>('gaps')
  const [refreshing, setRefreshing] = useState(false)

  const { data: skillGaps, isLoading: gapsLoading, refetch: refetchGaps } = useQuery({
    queryKey: ['skill-gaps'],
    queryFn: () => api.get('/skill-gaps/me').then((r) => r.data).catch(() => []),
  })

  const { data: learning, isLoading: learningLoading, refetch: refetchLearning } = useQuery({
    queryKey: ['learning'],
    queryFn: () => api.get('/learning/me').then((r) => r.data).catch(() => []),
  })

  const { data: resumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => api.get('/resumes').then((r) => r.data).catch(() => []),
  })

  // Get match history for the first completed resume
  const masterResume = resumes?.find((r: any) => r.processing_status === 'completed')
  const { data: matchHistory, isLoading: matchLoading, refetch: refetchMatch } = useQuery({
    queryKey: ['match-history', masterResume?.id],
    queryFn: () =>
      masterResume
        ? api.get(`/matches/resume/${masterResume.id}`).then((r) => r.data).catch(() => [])
        : [],
    enabled: !!masterResume,
  })

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refetchGaps(), refetchLearning(), refetchMatch()])
    setRefreshing(false)
  }, [refetchGaps, refetchLearning, refetchMatch])

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'gaps', label: 'Skill Gaps' },
    { key: 'learning', label: 'Learning' },
    { key: 'history', label: 'Matches' },
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

  function getPriorityColor(priority: number) {
    if (priority <= 1) return '#dc2626'
    if (priority <= 2) return '#d97706'
    return '#6b7280'
  }

  function getPriorityLabel(priority: number) {
    if (priority <= 1) return 'High'
    if (priority <= 2) return 'Medium'
    return 'Low'
  }

  const hasNoData =
    (!skillGaps?.length) && (!learning?.length) && (!matchHistory?.length)

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1d4ed8" />
        }
      >
        {/* Empty state - no analysis done yet */}
        {hasNoData && !gapsLoading && !learningLoading && !matchLoading && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>AI</Text>
            </View>
            <Text style={styles.emptyTitle}>No analysis data yet</Text>
            <Text style={styles.emptySubtitle}>
              Upload a resume and run a match analysis on a job to see your
              skill gaps, learning recommendations, and match history.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/jobs')}
              style={styles.emptyCta}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyCtaText}>Browse Jobs</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Skill Gaps Tab */}
        {activeTab === 'gaps' && (
          <>
            {gapsLoading ? (
              <ActivityIndicator style={styles.loader} color="#1d4ed8" />
            ) : skillGaps?.length > 0 ? (
              <>
                <Text style={styles.sectionDesc}>
                  Skills you need to develop based on your job match analyses.
                  Higher gap means more improvement needed.
                </Text>
                <View style={styles.gapsList}>
                  {skillGaps.map((gap: any, i: number) => (
                    <View key={gap.skill || i} style={styles.gapCard}>
                      <View style={styles.gapHeader}>
                        <Text style={styles.gapSkill}>{gap.skill}</Text>
                        <Text
                          style={[
                            styles.gapPercentText,
                            {
                              color:
                                gap.gap >= 60
                                  ? '#dc2626'
                                  : gap.gap >= 30
                                  ? '#d97706'
                                  : '#059669',
                            },
                          ]}
                        >
                          {gap.gap}% gap
                        </Text>
                      </View>
                      <View style={styles.gapBarContainer}>
                        <View style={styles.gapBarLabels}>
                          <Text style={styles.gapBarLabel}>
                            Current: {gap.current}%
                          </Text>
                          <Text style={styles.gapBarLabel}>
                            Required: {gap.required}%
                          </Text>
                        </View>
                        <View style={styles.gapBarBg}>
                          <View
                            style={[
                              styles.gapBarCurrent,
                              {
                                width: `${Math.min(gap.current, 100)}%`,
                                backgroundColor:
                                  gap.current >= 70
                                    ? '#059669'
                                    : gap.current >= 40
                                    ? '#d97706'
                                    : '#dc2626',
                              },
                            ]}
                          />
                          <View
                            style={[
                              styles.gapBarRequired,
                              { left: `${Math.min(gap.required, 100)}%` },
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            ) : !hasNoData ? (
              <View style={styles.tabEmpty}>
                <Text style={styles.tabEmptyText}>
                  No skill gaps identified yet. Run a match analysis to see results.
                </Text>
              </View>
            ) : null}
          </>
        )}

        {/* Learning Tab */}
        {activeTab === 'learning' && (
          <>
            {learningLoading ? (
              <ActivityIndicator style={styles.loader} color="#1d4ed8" />
            ) : learning?.length > 0 ? (
              <>
                <Text style={styles.sectionDesc}>
                  Recommended resources to fill your skill gaps and improve your
                  match scores.
                </Text>
                <View style={styles.learningList}>
                  {learning.map((rec: any, i: number) => (
                    <TouchableOpacity
                      key={rec.id || i}
                      style={styles.learningCard}
                      activeOpacity={rec.resource_url ? 0.7 : 1}
                      onPress={() => {
                        if (rec.resource_url) {
                          Linking.openURL(rec.resource_url)
                        }
                      }}
                    >
                      <View style={styles.learningHeader}>
                        <View style={styles.learningInfo}>
                          <Text style={styles.learningTitle}>
                            {rec.resource_title}
                          </Text>
                          <Text style={styles.learningProvider}>
                            {rec.resource_provider}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.priorityBadge,
                            {
                              backgroundColor:
                                rec.priority <= 1
                                  ? '#fef2f2'
                                  : rec.priority <= 2
                                  ? '#fffbeb'
                                  : '#f1f5f9',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.priorityText,
                              { color: getPriorityColor(rec.priority) },
                            ]}
                          >
                            {getPriorityLabel(rec.priority)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.learningMeta}>
                        <View style={styles.skillBadge}>
                          <Text style={styles.skillBadgeText}>
                            {rec.skill_name}
                          </Text>
                        </View>
                        <View style={styles.typeBadge}>
                          <Text style={styles.typeBadgeText}>
                            {rec.resource_type}
                          </Text>
                        </View>
                        {rec.estimated_hours && (
                          <Text style={styles.hoursText}>
                            ~{rec.estimated_hours}h
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : !hasNoData ? (
              <View style={styles.tabEmpty}>
                <Text style={styles.tabEmptyText}>
                  No recommendations yet. Run a match analysis to get personalized learning paths.
                </Text>
              </View>
            ) : null}
          </>
        )}

        {/* Match History Tab */}
        {activeTab === 'history' && (
          <>
            {matchLoading ? (
              <ActivityIndicator style={styles.loader} color="#1d4ed8" />
            ) : matchHistory?.length > 0 ? (
              <>
                <Text style={styles.sectionDesc}>
                  Your match analysis results sorted by score.
                </Text>
                <View style={styles.matchList}>
                  {matchHistory.map((match: any, i: number) => (
                    <View key={match.id || i} style={styles.matchCard}>
                      <View style={styles.matchHeader}>
                        <View
                          style={[
                            styles.scoreCircle,
                            { backgroundColor: getScoreBg(match.overall_score) },
                          ]}
                        >
                          <Text
                            style={[
                              styles.scoreCircleText,
                              { color: getScoreColor(match.overall_score) },
                            ]}
                          >
                            {Math.round(match.overall_score * 100)}%
                          </Text>
                        </View>
                        <View style={styles.matchInfo}>
                          <Text style={styles.matchJobId}>
                            Job Match
                          </Text>
                          <View style={styles.matchScores}>
                            <Text style={styles.matchScoreItem}>
                              Skills: {Math.round(match.skill_score * 100)}%
                            </Text>
                            <Text style={styles.matchScoreItem}>
                              Semantic: {Math.round(match.semantic_score * 100)}%
                            </Text>
                          </View>
                        </View>
                      </View>
                      {match.explanation && (
                        <Text style={styles.matchExplanation} numberOfLines={3}>
                          {match.explanation.split('\n')[0]}
                        </Text>
                      )}
                      {match.matched_skills?.length > 0 && (
                        <View style={styles.matchSkillsRow}>
                          {match.matched_skills.slice(0, 4).map((s: any) => (
                            <View key={s.skill_name} style={styles.matchedChip}>
                              <Text style={styles.matchedChipText}>{s.skill_name}</Text>
                            </View>
                          ))}
                          {match.matched_skills.length > 4 && (
                            <Text style={styles.moreText}>
                              +{match.matched_skills.length - 4}
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </>
            ) : !hasNoData ? (
              <View style={styles.tabEmpty}>
                <Text style={styles.tabEmptyText}>
                  No match history yet. Go to a job posting and run an analysis.
                </Text>
              </View>
            ) : null}
          </>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#1d4ed8',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#1d4ed8',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  sectionDesc: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIconText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#d97706',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  emptyCta: {
    marginTop: 24,
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyCtaText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 40,
  },
  tabEmpty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  tabEmptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },

  // Skill Gaps
  gapsList: {
    gap: 10,
  },
  gapCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  gapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  gapSkill: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  gapPercentText: {
    fontSize: 14,
    fontWeight: '700',
  },
  gapBarContainer: {},
  gapBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  gapBarLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  gapBarBg: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  gapBarCurrent: {
    height: 8,
    borderRadius: 4,
  },
  gapBarRequired: {
    position: 'absolute',
    top: -2,
    width: 2,
    height: 12,
    backgroundColor: '#0f172a',
    borderRadius: 1,
  },

  // Learning
  learningList: {
    gap: 10,
  },
  learningCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  learningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  learningInfo: {
    flex: 1,
  },
  learningTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 20,
  },
  learningProvider: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  priorityBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  learningMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  skillBadge: {
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  skillBadgeText: {
    fontSize: 12,
    color: '#1d4ed8',
    fontWeight: '500',
  },
  typeBadge: {
    backgroundColor: '#f3e8ff',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeBadgeText: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  hoursText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },

  // Match History
  matchList: {
    gap: 10,
  },
  matchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  scoreCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCircleText: {
    fontSize: 18,
    fontWeight: '800',
  },
  matchInfo: {
    flex: 1,
  },
  matchJobId: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  matchScores: {
    flexDirection: 'row',
    gap: 12,
  },
  matchScoreItem: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  matchExplanation: {
    marginTop: 10,
    fontSize: 13,
    color: '#374151',
    lineHeight: 19,
  },
  matchSkillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    alignItems: 'center',
  },
  matchedChip: {
    backgroundColor: '#ecfdf5',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  matchedChipText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  moreText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
})
