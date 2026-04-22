import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  Platform,
  Alert,
} from 'react-native'
import { useMemo, useState } from 'react'
import { Stack, useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Feather } from '@expo/vector-icons'
import api from '@/lib/api'
import { downloadResumePdf } from '@/lib/download-resume'

type Job = {
  id: string
  title: string
  company: string
  location: string | null
  is_remote: boolean
  experience_level: string
}

type Template = 'modern' | 'classic' | 'minimal'

const TEMPLATES: { key: Template; name: string; desc: string; accent: string }[] = [
  { key: 'modern', name: 'Modern', desc: 'Bold headings, color accents', accent: '#2563eb' },
  { key: 'classic', name: 'Classic', desc: 'Traditional, ATS-friendly', accent: '#0f172a' },
  { key: 'minimal', name: 'Minimal', desc: 'Clean, lots of whitespace', accent: '#475569' },
]

export default function ResumeBuilderScreen() {
  const router = useRouter()
  const qc = useQueryClient()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [jobId, setJobId] = useState<string | null>(null)
  const [template, setTemplate] = useState<Template>('modern')
  const [search, setSearch] = useState('')
  const [savedTitle, setSavedTitle] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs-for-builder', search],
    queryFn: () =>
      api.get(`/jobs/?limit=30${search ? `&search=${encodeURIComponent(search)}` : ''}`)
        .then((r) => r.data as Job[])
        .catch(() => []),
  })

  const { data: resumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => api.get('/resumes').then((r) => r.data).catch(() => []),
  })

  const master = useMemo(
    () => (resumes || []).find((r: any) => r.is_master && r.processing_status === 'completed')
      || (resumes || []).find((r: any) => r.processing_status === 'completed'),
    [resumes],
  )

  const selectedJob = useMemo(
    () => (jobs || []).find((j) => j.id === jobId),
    [jobs, jobId],
  )

  // Match score for selected job (auto-trigger compute if missing)
  const { data: match, isFetching: matchFetching } = useQuery({
    queryKey: ['my-match', jobId],
    queryFn: () =>
      api.get(`/matches/my-match/${jobId}`).then((r) => r.data).catch(() => null),
    enabled: !!jobId && step >= 3,
    refetchInterval: (q) => (!q.state.data && jobId ? 5000 : false),
  })

  const triggerAnalyzeMutation = useMutation({
    mutationFn: async () => {
      if (!master || !jobId) throw new Error('Missing data')
      await api.post('/matches/analyze', { resume_id: master.id, job_id: jobId })
    },
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const r = await api.post('/resumes/tailored', {
        job_id: jobId,
        template,
        title: selectedJob ? `${template[0].toUpperCase()}${template.slice(1)} — ${selectedJob.title}` : undefined,
      })
      return r.data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['resumes'] })
      setSavedTitle(data?.title || 'Resume')
      setSavedId(data?.id || null)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || 'Failed to save tailored resume.'
      if (Platform.OS === 'web') alert(msg)
      else Alert.alert('Error', msg)
    },
  })

  const noMaster = resumes && resumes.length > 0 && !master
  const noResumesAtAll = resumes && resumes.length === 0

  const goNext = () => {
    if (step === 1 && jobId) setStep(2)
    else if (step === 2) {
      setStep(3)
      // Trigger compute if not cached
      if (master && jobId) triggerAnalyzeMutation.mutate()
    }
  }

  const goBack = () => {
    if (step === 1) router.back()
    else if (savedTitle) router.replace('/(tabs)/resumes')
    else setStep((step - 1) as 1 | 2)
  }

  const matchScore = match?.match_result?.overall_score
  const matchedSkills: any[] = match?.match_result?.matched_skills || []
  const missingSkills: any[] = match?.match_result?.missing_skills || []
  const accent = TEMPLATES.find((t) => t.key === template)!.accent

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Resume Builder',
          headerTitleStyle: { fontWeight: '700', fontSize: 17 },
          headerStyle: { backgroundColor: '#ffffff' },
        }}
      />
      <View style={styles.container}>
        {/* Step indicator */}
        <View style={styles.stepBar}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={styles.stepWrap}>
              <View style={[styles.stepDot, step >= s ? styles.stepDotActive : null]}>
                <Text style={[styles.stepDotText, step >= s && { color: '#ffffff' }]}>{s}</Text>
              </View>
              <Text style={[styles.stepLabel, step >= s && { color: '#0f172a' }]}>
                {s === 1 ? 'Target Job' : s === 2 ? 'Template' : 'Build'}
              </Text>
              {s < 3 && <View style={[styles.stepLine, step > s && styles.stepLineActive]} />}
            </View>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {noResumesAtAll && (
            <View style={styles.warnCard}>
              <Text style={styles.warnTitle}>No resume yet</Text>
              <Text style={styles.warnBody}>Upload a PDF resume first so we can tailor it.</Text>
              <TouchableOpacity
                style={styles.warnBtn}
                onPress={() => router.replace('/(tabs)/resumes')}
              >
                <Text style={styles.warnBtnText}>Go to Resumes</Text>
              </TouchableOpacity>
            </View>
          )}

          {noMaster && (
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                Tip: mark a resume as your <Text style={{ fontWeight: '700' }}>Master</Text> in the
                Resumes tab so the builder knows which one to tailor.
              </Text>
            </View>
          )}

          {/* STEP 1: pick job */}
          {step === 1 && (
            <>
              <Text style={styles.sectionLabel}>Pick a target job</Text>
              <View style={styles.searchWrap}>
                <Feather name="search" size={16} color="#9ca3af" />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search jobs"
                  placeholderTextColor="#9ca3af"
                  style={styles.searchInput}
                />
              </View>
              {jobsLoading ? (
                <ActivityIndicator color="#2563eb" style={{ marginTop: 24 }} />
              ) : !jobs || jobs.length === 0 ? (
                <Text style={styles.empty}>No jobs found.</Text>
              ) : (
                jobs.map((j) => (
                  <TouchableOpacity
                    key={j.id}
                    onPress={() => setJobId(j.id)}
                    style={[styles.jobRow, jobId === j.id && styles.jobRowActive]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.jobIcon}>
                      <Feather name="briefcase" size={16} color="#2563eb" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.jobTitle}>{j.title}</Text>
                      <Text style={styles.jobMeta}>
                        {j.company} · {j.location || 'Remote'} · {j.experience_level}
                      </Text>
                    </View>
                    {jobId === j.id && <Feather name="check-circle" size={18} color="#2563eb" />}
                  </TouchableOpacity>
                ))
              )}
            </>
          )}

          {/* STEP 2: pick template */}
          {step === 2 && (
            <>
              <Text style={styles.sectionLabel}>Pick a template</Text>
              {TEMPLATES.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  onPress={() => setTemplate(t.key)}
                  style={[styles.tplRow, template === t.key && styles.tplRowActive]}
                  activeOpacity={0.85}
                >
                  <View style={[styles.tplPreview, { borderLeftColor: t.accent }]}>
                    <View style={[styles.tplPreviewLine, { backgroundColor: t.accent, width: 56, height: 6 }]} />
                    <View style={[styles.tplPreviewLine, { width: 100, height: 4 }]} />
                    <View style={[styles.tplPreviewLine, { width: 80, height: 4 }]} />
                    <View style={[styles.tplPreviewLine, { width: 120, height: 4 }]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tplName}>{t.name}</Text>
                    <Text style={styles.tplDesc}>{t.desc}</Text>
                  </View>
                  {template === t.key && <Feather name="check-circle" size={20} color="#2563eb" />}
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* STEP 3: build + preview */}
          {step === 3 && (
            <>
              {savedTitle ? (
                <View style={styles.successCard}>
                  <View style={styles.successIcon}>
                    <Feather name="check" size={22} color="#ffffff" />
                  </View>
                  <Text style={styles.successTitle}>Tailored resume saved</Text>
                  <Text style={styles.successSub}>"{savedTitle}" is now in your resumes.</Text>
                  <View style={styles.successBtnRow}>
                    {savedId && (
                      <TouchableOpacity
                        style={styles.downloadBtn}
                        disabled={downloading}
                        onPress={async () => {
                          try {
                            setDownloading(true)
                            await downloadResumePdf(savedId, savedTitle)
                          } catch (e: any) {
                            const msg = e?.response?.data?.detail || 'Download failed.'
                            if (Platform.OS === 'web') alert(msg)
                            else Alert.alert('Error', msg)
                          } finally {
                            setDownloading(false)
                          }
                        }}
                        activeOpacity={0.85}
                      >
                        {downloading ? (
                          <ActivityIndicator color="#ffffff" size="small" />
                        ) : (
                          <>
                            <Feather name="download" size={16} color="#ffffff" />
                            <Text style={styles.downloadBtnText}>Download PDF</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.successBtn}
                      onPress={() => router.replace('/(tabs)/resumes')}
                    >
                      <Text style={styles.successBtnText}>Back to Resumes</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  {/* Score */}
                  <View style={styles.scoreCard}>
                    <Text style={styles.scoreCaption}>Relevance to {selectedJob?.title}</Text>
                    {matchScore != null ? (
                      <Text
                        style={[
                          styles.scoreValue,
                          { color: matchScore >= 0.7 ? '#059669' : matchScore >= 0.4 ? '#d97706' : '#dc2626' },
                        ]}
                      >
                        {Math.round(matchScore * 100)}%
                      </Text>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <ActivityIndicator size="small" color="#2563eb" />
                        <Text style={styles.scoreLoading}>
                          {matchFetching || triggerAnalyzeMutation.isPending ? 'Analyzing match…' : 'Computing…'}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Missing skills */}
                  {missingSkills.length > 0 && (
                    <View style={styles.card}>
                      <Text style={styles.cardTitle}>Missing skills ({missingSkills.length})</Text>
                      <View style={styles.chipsRow}>
                        {missingSkills.slice(0, 12).map((s, i) => (
                          <View key={i} style={styles.chipBad}>
                            <Text style={styles.chipBadText}>{s.skill_name}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Matched skills */}
                  {matchedSkills.length > 0 && (
                    <View style={styles.card}>
                      <Text style={styles.cardTitle}>Matched skills ({matchedSkills.length})</Text>
                      <View style={styles.chipsRow}>
                        {matchedSkills.slice(0, 12).map((s, i) => (
                          <View key={i} style={styles.chipGood}>
                            <Text style={styles.chipGoodText}>{s.skill_name}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Template preview */}
                  {master?.parsed_data && (
                    <View style={[styles.preview, { borderLeftColor: accent, borderLeftWidth: template === 'modern' ? 4 : 0 }]}>
                      <Text style={[styles.previewName, { color: accent }]}>
                        {master.parsed_data.name || 'Your Name'}
                      </Text>
                      <Text style={styles.previewMeta}>
                        {[master.parsed_data.email, master.parsed_data.phone].filter(Boolean).join(' · ')}
                      </Text>
                      <Text style={[styles.previewH, { color: accent }]}>SUMMARY</Text>
                      <Text style={styles.previewBody}>
                        Targeting {selectedJob?.title} at {selectedJob?.company}.{' '}
                        {master.parsed_data.summary || 'Add a professional summary to your master resume.'}
                      </Text>
                      {matchedSkills.length > 0 && (
                        <>
                          <Text style={[styles.previewH, { color: accent }]}>TOP SKILLS (REORDERED)</Text>
                          <Text style={styles.previewBody}>
                            {matchedSkills.slice(0, 8).map((s) => s.skill_name).join(' · ')}
                          </Text>
                        </>
                      )}
                      {Array.isArray(master.parsed_data.experience) && master.parsed_data.experience.length > 0 && (
                        <>
                          <Text style={[styles.previewH, { color: accent }]}>EXPERIENCE</Text>
                          {master.parsed_data.experience.slice(0, 2).map((e: any, i: number) => (
                            <View key={i} style={{ marginBottom: 8 }}>
                              <Text style={styles.previewItemTitle}>
                                {e.title || 'Role'} {e.company ? `· ${e.company}` : ''}
                              </Text>
                              {e.duration && <Text style={styles.previewItemMeta}>{e.duration}</Text>}
                            </View>
                          ))}
                        </>
                      )}
                    </View>
                  )}

                  {/* Save */}
                  <TouchableOpacity
                    onPress={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending || !master}
                    style={[styles.saveBtn, (!master || saveMutation.isPending) && { opacity: 0.6 }]}
                    activeOpacity={0.85}
                  >
                    {saveMutation.isPending ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={styles.saveBtnText}>Save tailored resume</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
        </ScrollView>

        {/* Footer nav */}
        {!savedTitle && (
          <View style={styles.footer}>
            <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
              <Text style={styles.backBtnText}>{step === 1 ? 'Cancel' : 'Back'}</Text>
            </TouchableOpacity>
            {step < 3 && (
              <TouchableOpacity
                onPress={goNext}
                disabled={step === 1 && !jobId}
                style={[styles.nextBtn, step === 1 && !jobId && { opacity: 0.5 }]}
                activeOpacity={0.85}
              >
                <Text style={styles.nextBtnText}>Next</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  scroll: { padding: 20, paddingBottom: 32 },

  stepBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  stepWrap: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: '#2563eb' },
  stepDotText: { fontSize: 12, fontWeight: '700', color: '#9ca3af' },
  stepLabel: { marginLeft: 8, fontSize: 12, color: '#9ca3af', fontWeight: '600' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#f1f5f9', marginHorizontal: 8 },
  stepLineActive: { backgroundColor: '#2563eb' },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  warnCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  warnTitle: { fontSize: 14, fontWeight: '700', color: '#92400e', marginBottom: 4 },
  warnBody: { fontSize: 13, color: '#78350f', marginBottom: 10 },
  warnBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#92400e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  warnBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

  infoCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 12,
  },
  infoText: { fontSize: 13, color: '#1e3a8a' },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#0f172a', padding: 0 },

  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 24 },

  jobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  jobRowActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  jobIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  jobMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },

  tplRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  tplRowActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  tplPreview: {
    width: 70,
    height: 80,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    padding: 8,
    gap: 4,
    borderLeftWidth: 3,
  },
  tplPreviewLine: {
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
  },
  tplName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  tplDesc: { fontSize: 12, color: '#6b7280', marginTop: 2 },

  scoreCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
    alignItems: 'center',
  },
  scoreCaption: { fontSize: 12, color: '#6b7280', marginBottom: 6 },
  scoreValue: { fontSize: 38, fontWeight: '800' },
  scoreLoading: { fontSize: 13, color: '#6b7280' },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chipGood: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipGoodText: { color: '#059669', fontSize: 12, fontWeight: '600' },
  chipBad: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipBadText: { color: '#dc2626', fontSize: 12, fontWeight: '600' },

  preview: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  previewName: { fontSize: 22, fontWeight: '800' },
  previewMeta: { fontSize: 12, color: '#6b7280', marginTop: 2, marginBottom: 12 },
  previewH: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 12,
    marginBottom: 4,
  },
  previewBody: { fontSize: 13, color: '#374151', lineHeight: 19 },
  previewItemTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  previewItemMeta: { fontSize: 12, color: '#6b7280' },

  saveBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },

  successCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  successIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  successSub: { fontSize: 13, color: '#6b7280', marginTop: 4, textAlign: 'center' },
  successBtn: {
    marginTop: 16,
    backgroundColor: '#2563eb',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  successBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  successBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  downloadBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },

  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  backBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  backBtnText: { color: '#374151', fontSize: 14, fontWeight: '600' },
  nextBtn: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  nextBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
})
