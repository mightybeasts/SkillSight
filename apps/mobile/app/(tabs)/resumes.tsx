import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Platform,
} from 'react-native'
import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as DocumentPicker from 'expo-document-picker'
import { useRouter } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import api from '@/lib/api'
import { downloadResumePdf } from '@/lib/download-resume'

export default function ResumesScreen() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  async function handleDownload(id: string, title: string) {
    try {
      setDownloadingId(id)
      await downloadResumePdf(id, title)
    } catch (e: any) {
      const msg = e?.response?.data?.detail || 'Download failed.'
      if (Platform.OS === 'web') alert(msg)
      else Alert.alert('Error', msg)
    } finally {
      setDownloadingId(null)
    }
  }

  const { data: resumes, isLoading, refetch } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => api.get('/resumes').then((r) => r.data),
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: DocumentPicker.DocumentPickerAsset) => {
      const formData = new FormData()
      if (Platform.OS === 'web' && (file as any).file) {
        // On web, use the actual File object
        formData.append('file', (file as any).file)
      } else {
        formData.append('file', {
          uri: file.uri,
          type: file.mimeType || 'application/pdf',
          name: file.name,
        } as any)
      }
      formData.append('title', file.name.replace('.pdf', ''))
      formData.append('is_master', 'false')
      return api.post('/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] })
      if (Platform.OS === 'web') {
        alert('Resume uploaded and queued for AI processing.')
      } else {
        Alert.alert('Success', 'Resume uploaded and queued for AI processing.')
      }
    },
    onError: () => {
      if (Platform.OS === 'web') {
        alert('Upload failed. Please try again.')
      } else {
        Alert.alert('Error', 'Upload failed. Please try again.')
      }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/resumes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resumes'] }),
  })

  const setMasterMutation = useMutation({
    mutationFn: (resumeId: string) => api.patch(`/resumes/${resumeId}/set-master`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resumes'] }),
    onError: () => {
      const msg = 'Failed to update master resume.'
      if (Platform.OS === 'web') alert(msg)
      else Alert.alert('Error', msg)
    },
  })

  async function handleUpload() {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    })
    if (!result.canceled && result.assets[0]) {
      uploadMutation.mutate(result.assets[0])
    }
  }

  function handleDelete(id: string, title: string) {
    if (Platform.OS === 'web') {
      if (confirm(`Delete "${title}"? This cannot be undone.`)) {
        deleteMutation.mutate(id)
      }
    } else {
      Alert.alert('Delete Resume', `Delete "${title}"? This cannot be undone.`, [
        { text: 'Cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(id),
        },
      ])
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  function formatDate(dateString: string) {
    if (!dateString) return ''
    const d = new Date(dateString)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function getStatusStyle(status: string) {
    switch (status) {
      case 'completed':
        return { bg: '#ecfdf5', text: '#059669', label: 'Processed' }
      case 'processing':
        return { bg: '#eff6ff', text: '#1d4ed8', label: 'Processing' }
      case 'failed':
        return { bg: '#fef2f2', text: '#dc2626', label: 'Failed' }
      default:
        return { bg: '#fffbeb', text: '#d97706', label: 'Pending' }
    }
  }

  const isExpanded = (id: string) => expandedId === id

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1d4ed8" />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.pageTitle}>My Resumes</Text>
            <Text style={styles.pageSubtitle}>
              Upload and manage your resumes for AI matching
            </Text>
          </View>
        </View>

        {/* Upload Button */}
        <TouchableOpacity
          onPress={handleUpload}
          disabled={uploadMutation.isPending}
          style={[styles.uploadButton, uploadMutation.isPending && styles.buttonDisabled]}
          activeOpacity={0.8}
        >
          {uploadMutation.isPending ? (
            <View style={styles.uploadingRow}>
              <ActivityIndicator color="#ffffff" size="small" />
              <Text style={styles.uploadButtonText}>Uploading...</Text>
            </View>
          ) : (
            <Text style={styles.uploadButtonText}>+ Upload PDF Resume</Text>
          )}
        </TouchableOpacity>

        {/* Build Tailored Resume CTA */}
        <TouchableOpacity
          onPress={() => router.push('/resume-builder')}
          style={styles.builderCta}
          activeOpacity={0.85}
        >
          <View style={styles.builderIcon}>
            <Feather name="zap" size={18} color="#ffffff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.builderTitle}>Build Tailored Resume</Text>
            <Text style={styles.builderSub}>
              Pick a job + template — AI tailors your master resume.
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color="#ffffff" />
        </TouchableOpacity>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1d4ed8" />
            <Text style={styles.loadingText}>Loading resumes...</Text>
          </View>
        ) : !resumes?.length ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>R</Text>
            </View>
            <Text style={styles.emptyTitle}>No resumes yet</Text>
            <Text style={styles.emptySubtitle}>
              Upload a PDF resume to get started. Our AI will extract your
              skills, experience, and education automatically.
            </Text>
          </View>
        ) : (
          <View style={styles.resumeList}>
            {resumes.map((resume: any) => {
              const status = getStatusStyle(resume.processing_status)
              const expanded = isExpanded(resume.id)
              const parsed = resume.parsed_data || {}

              return (
                <View key={resume.id} style={styles.resumeCard}>
                  {/* Card Header */}
                  <TouchableOpacity
                    onPress={() => setExpandedId(expanded ? null : resume.id)}
                    activeOpacity={0.7}
                    style={styles.resumeCardHeader}
                  >
                    <View style={styles.resumeIcon}>
                      <Text style={styles.resumeIconText}>PDF</Text>
                    </View>
                    <View style={styles.resumeInfo}>
                      <Text style={styles.resumeTitle} numberOfLines={1}>
                        {resume.title}
                      </Text>
                      <View style={styles.resumeMetaRow}>
                        <Text style={styles.resumeDate}>
                          {formatDate(resume.created_at)}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                          <Text style={[styles.statusText, { color: status.text }]}>
                            {status.label}
                          </Text>
                        </View>
                        {resume.is_master && (
                          <View style={styles.masterBadge}>
                            <Text style={styles.masterBadgeText}>Master</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Text style={styles.expandChevron}>{expanded ? '^' : 'v'}</Text>
                  </TouchableOpacity>

                  {/* Skills preview (always visible if not expanded) */}
                  {!expanded && parsed.skills?.length > 0 && (
                    <View style={styles.skillsPreview}>
                      <View style={styles.divider} />
                      <View style={styles.skillsRow}>
                        {parsed.skills.slice(0, 5).map((skill: string) => (
                          <View key={skill} style={styles.skillChip}>
                            <Text style={styles.skillChipText}>{skill}</Text>
                          </View>
                        ))}
                        {parsed.skills.length > 5 && (
                          <Text style={styles.moreSkills}>
                            +{parsed.skills.length - 5}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Expanded Details */}
                  {expanded && resume.processing_status === 'completed' && (
                    <View style={styles.expandedSection}>
                      <View style={styles.divider} />

                      {/* Contact Info */}
                      {(parsed.name || parsed.email || parsed.phone) && (
                        <View style={styles.detailSection}>
                          <Text style={styles.detailSectionTitle}>Contact</Text>
                          {parsed.name && (
                            <Text style={styles.detailText}>{parsed.name}</Text>
                          )}
                          {parsed.email && (
                            <Text style={styles.detailText}>{parsed.email}</Text>
                          )}
                          {parsed.phone && (
                            <Text style={styles.detailText}>{parsed.phone}</Text>
                          )}
                        </View>
                      )}

                      {/* Experience */}
                      {parsed.years_of_experience != null && (
                        <View style={styles.detailSection}>
                          <Text style={styles.detailSectionTitle}>Experience</Text>
                          <Text style={styles.detailText}>
                            {parsed.years_of_experience} years
                          </Text>
                        </View>
                      )}

                      {/* Skills */}
                      {parsed.skills?.length > 0 && (
                        <View style={styles.detailSection}>
                          <Text style={styles.detailSectionTitle}>
                            Skills ({parsed.skills.length})
                          </Text>
                          <View style={styles.skillsRow}>
                            {parsed.skills.map((skill: string) => (
                              <View key={skill} style={styles.skillChip}>
                                <Text style={styles.skillChipText}>{skill}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      {/* Sections */}
                      {parsed.sections &&
                        Object.entries(parsed.sections).map(
                          ([key, value]: [string, any]) =>
                            value && (
                              <View key={key} style={styles.detailSection}>
                                <Text style={styles.detailSectionTitle}>
                                  {key.charAt(0).toUpperCase() + key.slice(1)}
                                </Text>
                                <Text
                                  style={styles.sectionContent}
                                  numberOfLines={8}
                                >
                                  {typeof value === 'string'
                                    ? value.trim()
                                    : JSON.stringify(value)}
                                </Text>
                              </View>
                            ),
                        )}

                      {/* Actions */}
                      <View style={styles.cardActions}>
                        {!resume.is_master && (
                          <TouchableOpacity
                            onPress={() => setMasterMutation.mutate(resume.id)}
                            disabled={setMasterMutation.isPending}
                            style={styles.masterBtn}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.masterBtnText}>
                              {setMasterMutation.isPending && setMasterMutation.variables === resume.id
                                ? 'Setting…'
                                : 'Set as Master'}
                            </Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          onPress={() => handleDownload(resume.id, resume.title)}
                          disabled={downloadingId === resume.id}
                          style={styles.downloadBtn}
                          activeOpacity={0.7}
                        >
                          {downloadingId === resume.id ? (
                            <ActivityIndicator color="#ffffff" size="small" />
                          ) : (
                            <>
                              <Feather name="download" size={13} color="#ffffff" />
                              <Text style={styles.downloadBtnText}>Download PDF</Text>
                            </>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDelete(resume.id, resume.title)}
                          style={styles.deleteBtn}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.deleteBtnText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {expanded && resume.processing_status !== 'completed' && (
                    <View style={styles.expandedSection}>
                      <View style={styles.divider} />
                      <Text style={styles.processingNote}>
                        {resume.processing_status === 'processing'
                          ? 'AI is currently parsing this resume. Check back shortly.'
                          : resume.processing_status === 'failed'
                          ? 'Processing failed. Try re-uploading.'
                          : 'Waiting in queue for processing.'}
                      </Text>
                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          onPress={() => handleDelete(resume.id, resume.title)}
                          style={styles.deleteBtn}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.deleteBtnText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  headerRow: {
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  uploadButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
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
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIconText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1d4ed8',
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
  resumeList: {
    gap: 12,
  },
  resumeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  resumeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  resumeIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeIconText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#dc2626',
  },
  resumeInfo: {
    flex: 1,
  },
  resumeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  resumeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resumeDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  masterBadge: {
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  masterBadgeText: {
    fontSize: 11,
    color: '#1d4ed8',
    fontWeight: '600',
  },
  expandChevron: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '300',
  },
  skillsPreview: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillChip: {
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  skillChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  moreSkills: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
    alignSelf: 'center',
    marginLeft: 2,
  },
  expandedSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#0f172a',
    lineHeight: 20,
  },
  sectionContent: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  deleteBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#dc2626',
  },
  masterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
  },
  masterBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#059669',
  },
  downloadBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  builderCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  builderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  builderTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  builderSub: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  processingNote: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
})
