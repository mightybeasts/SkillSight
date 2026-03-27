import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Platform,
  RefreshControl,
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as DocumentPicker from 'expo-document-picker'
import api from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'expo-router'

type Section = 'personal' | 'skills' | 'experience' | 'education' | 'certifications' | 'projects'

export default function ProfileScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [expandedSection, setExpandedSection] = useState<Section | null>('personal')
  const [isEditing, setIsEditing] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState({
    full_name: '',
    headline: '',
    bio: '',
    location: '',
    linkedin_url: '',
    github_url: '',
  })

  const { data: user, isLoading: userLoading, refetch: refetchUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/users/me').then((r) => r.data),
  })

  const { data: resumes, isLoading: resumesLoading, refetch: refetchResumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => api.get('/resumes').then((r) => r.data).catch(() => []),
  })

  // Get the master/first completed resume for profile data
  const profileResume = resumes?.find(
    (r: any) => r.is_master && r.processing_status === 'completed',
  ) || resumes?.find((r: any) => r.processing_status === 'completed')

  const parsed = profileResume?.parsed_data || {}

  useEffect(() => {
    if (user) {
      setEditForm({
        full_name: user.full_name || '',
        headline: user.profile?.headline || '',
        bio: user.profile?.bio || '',
        location: user.profile?.location || '',
        linkedin_url: user.profile?.linkedin_url || '',
        github_url: user.profile?.github_url || '',
      })
    }
  }, [user])

  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof editForm) =>
      api.patch('/users/me/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
      setIsEditing(false)
      if (Platform.OS === 'web') {
        alert('Profile updated.')
      } else {
        Alert.alert('Success', 'Profile updated.')
      }
    },
    onError: () => {
      if (Platform.OS === 'web') {
        alert('Failed to update profile.')
      } else {
        Alert.alert('Error', 'Failed to update profile.')
      }
    },
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: DocumentPicker.DocumentPickerAsset) => {
      const formData = new FormData()
      if (Platform.OS === 'web' && (file as any).file) {
        formData.append('file', (file as any).file)
      } else {
        formData.append('file', {
          uri: file.uri,
          type: file.mimeType || 'application/pdf',
          name: file.name,
        } as any)
      }
      formData.append('title', file.name.replace('.pdf', ''))
      formData.append('is_master', 'true')
      return api.post('/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] })
      if (Platform.OS === 'web') {
        alert('Resume uploaded. Your profile will be updated once processing completes.')
      } else {
        Alert.alert(
          'Resume Uploaded',
          'Your profile sections will be auto-filled once AI processing completes. This may take a moment.',
        )
      }
    },
  })

  async function handleUploadResume() {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    })
    if (!result.canceled && result.assets[0]) {
      uploadMutation.mutate(result.assets[0])
    }
  }

  async function handleSignOut() {
    if (Platform.OS === 'web') {
      if (confirm('Sign out of SkillSight?')) {
        await supabase.auth.signOut()
        router.replace('/(auth)/login')
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut()
            router.replace('/(auth)/login')
          },
        },
      ])
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refetchUser(), refetchResumes()])
    setRefreshing(false)
  }, [refetchUser, refetchResumes])

  function toggleSection(s: Section) {
    setExpandedSection(expandedSection === s ? null : s)
  }

  function getInitial(name: string | undefined) {
    if (!name) return '?'
    return name.trim()[0]?.toUpperCase() || '?'
  }

  if (userLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1d4ed8" />
        </View>
      </SafeAreaView>
    )
  }

  const sections: { key: Section; title: string; hasData: boolean }[] = [
    { key: 'personal', title: 'Personal Information', hasData: true },
    {
      key: 'skills',
      title: 'Skills',
      hasData: (parsed.skills?.length || 0) > 0,
    },
    {
      key: 'experience',
      title: 'Work Experience',
      hasData: !!(parsed.sections?.experience),
    },
    {
      key: 'education',
      title: 'Education',
      hasData: !!(parsed.sections?.education),
    },
    {
      key: 'certifications',
      title: 'Certifications',
      hasData: !!(parsed.sections?.certifications),
    },
    {
      key: 'projects',
      title: 'Projects',
      hasData: !!(parsed.sections?.projects),
    },
  ]

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
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitial(user?.full_name)}
            </Text>
          </View>
          <Text style={styles.profileName}>
            {user?.full_name || 'User'}
          </Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          {user?.profile?.headline && (
            <Text style={styles.profileHeadline}>{user.profile.headline}</Text>
          )}
          {parsed.years_of_experience != null && (
            <View style={styles.expRow}>
              <Text style={styles.expText}>
                {parsed.years_of_experience} years experience
              </Text>
            </View>
          )}
        </View>

        {/* Auto-fill from Resume */}
        <TouchableOpacity
          onPress={handleUploadResume}
          disabled={uploadMutation.isPending}
          style={[styles.autoFillBtn, uploadMutation.isPending && styles.buttonDisabled]}
          activeOpacity={0.8}
        >
          {uploadMutation.isPending ? (
            <View style={styles.uploadingRow}>
              <ActivityIndicator color="#1d4ed8" size="small" />
              <Text style={styles.autoFillText}>Uploading...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.autoFillText}>Upload Resume to Auto-Fill Profile</Text>
              <Text style={styles.autoFillSubtext}>
                AI will extract your skills, experience, and education
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Profile Sections */}
        {sections.map((section) => (
          <View key={section.key} style={styles.sectionCard}>
            <TouchableOpacity
              onPress={() => toggleSection(section.key)}
              style={styles.sectionHeader}
              activeOpacity={0.7}
            >
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {!section.hasData && section.key !== 'personal' && (
                  <View style={styles.noDataBadge}>
                    <Text style={styles.noDataText}>No data</Text>
                  </View>
                )}
              </View>
              <Text style={styles.sectionChevron}>
                {expandedSection === section.key ? '^' : 'v'}
              </Text>
            </TouchableOpacity>

            {expandedSection === section.key && (
              <View style={styles.sectionContent}>
                <View style={styles.sectionDivider} />

                {/* Personal Information */}
                {section.key === 'personal' && (
                  <>
                    {isEditing ? (
                      <View style={styles.editForm}>
                        <View style={styles.fieldGroup}>
                          <Text style={styles.fieldLabel}>Full Name</Text>
                          <TextInput
                            style={styles.input}
                            value={editForm.full_name}
                            onChangeText={(v) =>
                              setEditForm({ ...editForm, full_name: v })
                            }
                            placeholder="Your full name"
                            placeholderTextColor="#9ca3af"
                          />
                        </View>
                        <View style={styles.fieldGroup}>
                          <Text style={styles.fieldLabel}>Headline</Text>
                          <TextInput
                            style={styles.input}
                            value={editForm.headline}
                            onChangeText={(v) =>
                              setEditForm({ ...editForm, headline: v })
                            }
                            placeholder="e.g. Full Stack Developer"
                            placeholderTextColor="#9ca3af"
                          />
                        </View>
                        <View style={styles.fieldGroup}>
                          <Text style={styles.fieldLabel}>Bio</Text>
                          <TextInput
                            style={[styles.input, styles.textArea]}
                            value={editForm.bio}
                            onChangeText={(v) =>
                              setEditForm({ ...editForm, bio: v })
                            }
                            placeholder="Tell us about yourself"
                            placeholderTextColor="#9ca3af"
                            multiline
                            numberOfLines={3}
                          />
                        </View>
                        <View style={styles.fieldGroup}>
                          <Text style={styles.fieldLabel}>Location</Text>
                          <TextInput
                            style={styles.input}
                            value={editForm.location}
                            onChangeText={(v) =>
                              setEditForm({ ...editForm, location: v })
                            }
                            placeholder="City, Country"
                            placeholderTextColor="#9ca3af"
                          />
                        </View>
                        <View style={styles.fieldGroup}>
                          <Text style={styles.fieldLabel}>LinkedIn</Text>
                          <TextInput
                            style={styles.input}
                            value={editForm.linkedin_url}
                            onChangeText={(v) =>
                              setEditForm({ ...editForm, linkedin_url: v })
                            }
                            placeholder="https://linkedin.com/in/username"
                            placeholderTextColor="#9ca3af"
                            autoCapitalize="none"
                          />
                        </View>
                        <View style={styles.fieldGroup}>
                          <Text style={styles.fieldLabel}>GitHub</Text>
                          <TextInput
                            style={styles.input}
                            value={editForm.github_url}
                            onChangeText={(v) =>
                              setEditForm({ ...editForm, github_url: v })
                            }
                            placeholder="https://github.com/username"
                            placeholderTextColor="#9ca3af"
                            autoCapitalize="none"
                          />
                        </View>
                        <View style={styles.editActions}>
                          <TouchableOpacity
                            onPress={() => setIsEditing(false)}
                            style={styles.cancelBtn}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => updateProfileMutation.mutate(editForm)}
                            disabled={updateProfileMutation.isPending}
                            style={[
                              styles.saveBtn,
                              updateProfileMutation.isPending && styles.buttonDisabled,
                            ]}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.saveBtnText}>
                              {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.infoList}>
                        <InfoRow label="Name" value={user?.full_name} />
                        <InfoRow label="Email" value={user?.email} />
                        <InfoRow label="Headline" value={user?.profile?.headline} />
                        <InfoRow label="Bio" value={user?.profile?.bio} />
                        <InfoRow label="Location" value={user?.profile?.location} />
                        <InfoRow label="LinkedIn" value={user?.profile?.linkedin_url} />
                        <InfoRow label="GitHub" value={user?.profile?.github_url} />
                        <TouchableOpacity
                          onPress={() => setIsEditing(true)}
                          style={styles.editBtn}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.editBtnText}>Edit Personal Info</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}

                {/* Skills */}
                {section.key === 'skills' && (
                  <>
                    {parsed.skills?.length > 0 ? (
                      <View style={styles.skillsGrid}>
                        {parsed.skills.map((skill: string) => (
                          <View key={skill} style={styles.skillTag}>
                            <Text style={styles.skillTagText}>{skill}</Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.emptySection}>
                        Upload a resume to auto-detect your skills.
                      </Text>
                    )}
                  </>
                )}

                {/* Experience */}
                {section.key === 'experience' && (
                  <>
                    {parsed.sections?.experience ? (
                      <Text style={styles.parsedContent}>
                        {typeof parsed.sections.experience === 'string'
                          ? parsed.sections.experience.trim()
                          : JSON.stringify(parsed.sections.experience, null, 2)}
                      </Text>
                    ) : (
                      <Text style={styles.emptySection}>
                        Upload a resume to auto-fill your work experience.
                      </Text>
                    )}
                  </>
                )}

                {/* Education */}
                {section.key === 'education' && (
                  <>
                    {parsed.sections?.education ? (
                      <Text style={styles.parsedContent}>
                        {typeof parsed.sections.education === 'string'
                          ? parsed.sections.education.trim()
                          : JSON.stringify(parsed.sections.education, null, 2)}
                      </Text>
                    ) : (
                      <Text style={styles.emptySection}>
                        Upload a resume to auto-fill your education.
                      </Text>
                    )}
                  </>
                )}

                {/* Certifications */}
                {section.key === 'certifications' && (
                  <>
                    {parsed.sections?.certifications ? (
                      <Text style={styles.parsedContent}>
                        {typeof parsed.sections.certifications === 'string'
                          ? parsed.sections.certifications.trim()
                          : JSON.stringify(parsed.sections.certifications, null, 2)}
                      </Text>
                    ) : (
                      <Text style={styles.emptySection}>
                        Upload a resume to auto-fill your certifications.
                      </Text>
                    )}
                  </>
                )}

                {/* Projects */}
                {section.key === 'projects' && (
                  <>
                    {parsed.sections?.projects ? (
                      <Text style={styles.parsedContent}>
                        {typeof parsed.sections.projects === 'string'
                          ? parsed.sections.projects.trim()
                          : JSON.stringify(parsed.sections.projects, null, 2)}
                      </Text>
                    ) : (
                      <Text style={styles.emptySection}>
                        Upload a resume to auto-fill your projects.
                      </Text>
                    )}
                  </>
                )}
              </View>
            )}
          </View>
        ))}

        {/* Sign Out */}
        <TouchableOpacity
          onPress={handleSignOut}
          style={styles.signOutButton}
          activeOpacity={0.7}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>SkillSight v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={[infoStyles.value, !value && infoStyles.placeholder]}>
        {value || 'Not set'}
      </Text>
    </View>
  )
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    flex: 0.35,
  },
  value: {
    fontSize: 14,
    color: '#0f172a',
    flex: 0.65,
    textAlign: 'right',
  },
  placeholder: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
})

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
  profileHeader: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  profileHeadline: {
    fontSize: 15,
    color: '#1d4ed8',
    fontWeight: '500',
    marginTop: 6,
  },
  expRow: {
    marginTop: 10,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  expText: {
    fontSize: 13,
    color: '#1d4ed8',
    fontWeight: '600',
  },
  autoFillBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#1d4ed8',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  autoFillText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  autoFillSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  noDataBadge: {
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  noDataText: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
  },
  sectionChevron: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '300',
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 14,
  },
  infoList: {},
  editForm: {},
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#0f172a',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1d4ed8',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  editBtn: {
    marginTop: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  skillTagText: {
    fontSize: 13,
    color: '#1d4ed8',
    fontWeight: '500',
  },
  parsedContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  emptySection: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  signOutButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
    marginTop: 10,
    marginBottom: 16,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#dc2626',
  },
  versionText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 10,
  },
})
