import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../store/auth.store'
import { authService } from '../../services/auth.service'
import { useDialog } from '../../components/ui/DialogProvider'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null)

  const { setUser, setToken } = useAuthStore()
  const { showDialog } = useDialog()

  const handleLogin = async () => {
    if (!email || !password) {
      showDialog({ title: '错误', message: '请填写所有字段' })
      return
    }

    setLoading(true)
    try {
      const response = await authService.login({ identifier: email, password })
      setUser(response.user)
      setToken(response.token)
      router.replace('/(tabs)/profile')
    } catch (error: any) {
      showDialog({
        title: '登录失败',
        message: error.response?.data?.message || '邮箱或密码错误'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>欢迎回来</Text>
            <Text style={styles.subtitle}>登录您的账号</Text>
          </View>

          <View style={styles.inputGroup}>
            <View
              style={[
                styles.inputContainer,
                focusedField === 'email' && styles.inputContainerActive
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={focusedField === 'email' ? '#4F46E5' : '#9ca3af'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="邮箱"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="#9ca3af"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View
              style={[
                styles.inputContainer,
                focusedField === 'password' && styles.inputContainerActive
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={focusedField === 'password' ? '#4F46E5' : '#9ca3af'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="密码"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#9ca3af"
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#9ca3af"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => router.push('/auth/reset-password')}
          >
            <Text style={styles.forgotPasswordText}>忘记密码？</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? '登录中...' : '登录'}</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>或使用以下方式登录</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.socialButton}>
            <Ionicons name="logo-apple" size={22} color="#111827" />
            <Text style={styles.socialButtonText}>使用 Apple 登录</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialButton}>
            <Ionicons name="logo-google" size={20} color="#EA4335" />
            <Text style={styles.socialButtonText}>使用 Google 登录</Text>
          </TouchableOpacity>

          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>还没有账号？</Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text style={styles.signUpLink}>立即注册</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24
  },
  header: {
    marginBottom: 28
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280'
  },
  inputGroup: {
    gap: 16,
    marginBottom: 14
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56
  },
  inputContainerActive: {
    borderColor: '#4F46E5'
  },
  inputIcon: {
    marginRight: 10
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827'
  },
  eyeIcon: {
    paddingLeft: 8
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500'
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 24
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb'
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: '#9ca3af'
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 12
  },
  socialButtonText: {
    marginLeft: 12,
    fontSize: 15,
    color: '#111827',
    fontWeight: '600'
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24
  },
  signUpText: {
    fontSize: 14,
    color: '#6b7280'
  },
  signUpLink: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
    marginLeft: 4
  }
})
