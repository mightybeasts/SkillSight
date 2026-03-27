import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { useState } from 'react'
import * as WebBrowser from 'expo-web-browser'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'expo-router'

WebBrowser.maybeCompleteAuthSession()

export default function LoginScreen() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleEmailAuth() {
    if (!email || !password) {
      setError('Please enter email and password.')
      return
    }
    setLoading(true)
    setError('')
    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName || undefined },
          },
        })
        if (signUpError) throw signUpError
        router.replace('/(tabs)/home')
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
        router.replace('/(tabs)/home')
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    setError('')
    try {
      if (Platform.OS === 'web') {
        const { error: oauthError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        })
        if (oauthError) throw oauthError
        return
      }

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'skillsight://auth/callback',
          skipBrowserRedirect: true,
        },
      })

      if (oauthError) throw oauthError

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          'skillsight://auth/callback',
        )

        if (result.type === 'success') {
          const url = result.url
          const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1])
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')

          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
            router.replace('/(tabs)/home')
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed.')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Purple Header Section */}
          <View style={styles.headerBackground}>
            <SafeAreaView>
              <View style={styles.logoSection}>
                <View style={styles.logoRow}>
                  <View style={styles.iconPlaceholder}>
                    <Text style={styles.iconEye}>👁</Text>
                  </View>
                  <Text style={styles.logoText}>SkillSight</Text>
                </View>
                <Text style={styles.headerTitle}>Find your perfect{'\n'}career match</Text>
                <Text style={styles.tagline}>
                  AI-powered job matching that helps you land your dream role based on semantic skills.
                </Text>
              </View>
            </SafeAreaView>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <View style={styles.formCard}>
              <Text style={styles.welcomeText}>Welcome back</Text>
              <Text style={styles.welcomeSubtext}>
                Sign in to discover top jobs and track your applications.
              </Text>

              {/* Google OAuth */}
              <TouchableOpacity
                style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
                onPress={handleGoogleLogin}
                disabled={googleLoading}
                activeOpacity={0.8}
              >
                {googleLoading ? (
                  <ActivityIndicator color="#2563eb" />
                ) : (
                  <>
                    <Text style={styles.googleIconText}>G</Text>
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <Text style={styles.formTitle}>
                {isSignUp ? 'Create Account' : 'Sign In with Email'}
              </Text>

              {isSignUp && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor="#9ca3af"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@company.com"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Min. 6 characters"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleEmailAuth}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Toggle Sign In / Sign Up */}
              <TouchableOpacity
                style={styles.toggleContainer}
                onPress={() => {
                  setIsSignUp(!isSignUp)
                  setError('')
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.toggleText}>
                  {isSignUp
                    ? 'Already have an account? '
                    : "Don't have an account? "}
                  <Text style={styles.toggleLink}>
                    {isSignUp ? 'Sign In' : 'Sign up'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
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
    flexGrow: 1,
    backgroundColor: '#f8fafc',
  },
  headerBackground: {
    backgroundColor: '#1d4ed8',
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 60,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logoSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  iconPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  iconEye: {
    fontSize: 16,
    color: '#ffffff',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -1,
    marginBottom: 16,
    lineHeight: 42,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 24,
  },
  formContainer: {
    flex: 1,
    marginTop: -40,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
    marginTop: 8,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  dividerText: {
    marginHorizontal: 14,
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  googleIconText: {
    color: '#4285F4',
    fontSize: 18,
    fontWeight: '800',
    marginRight: 10,
  },
  googleButtonText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '600',
  },
  toggleContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  toggleText: {
    color: '#6b7280',
    fontSize: 14,
  },
  toggleLink: {
    color: '#2563eb',
    fontWeight: '700',
  },
})
