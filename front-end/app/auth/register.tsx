import { useState, useEffect } from 'react'
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
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuthStore } from '../../store/auth.store'
import { authService } from '../../services/auth.service'
import { useDialog } from '../../components/ui/DialogProvider'

export default function Register() {
  const [registerMode, setRegisterMode] = useState<'email' | 'phone'>('email')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [codeCountdown, setCodeCountdown] = useState(0)
  const [sendingCode, setSendingCode] = useState(false)
  const [focusedField, setFocusedField] = useState<'identifier' | 'password' | 'code' | null>(
    null
  )

  const { setPendingRegister, setUser, setToken } = useAuthStore()
  const { showDialog } = useDialog()

  useEffect(() => {
    if (codeCountdown <= 0) return
    const timer = setTimeout(() => {
      setCodeCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearTimeout(timer)
  }, [codeCountdown])

  const handleRegister = async () => {
    if (registerMode === 'email') {
      if (!identifier || !password) {
        showDialog({ title: '错误', message: '请填写所有必填字段' })
        return
      }

      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
      if (!emailRegex.test(identifier.trim())) {
        showDialog({ title: '错误', message: '请输入有效的邮箱地址' })
        return
      }

      const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
      if (!passwordRule.test(password)) {
        showDialog({
          title: '错误',
          message: '密码需包含大小写字母和数字，且至少8位'
        })
        return
      }

      setLoading(true)
      setPendingRegister({ email: identifier.trim(), password })
      setLoading(false)
      router.push('/auth/verify?type=email')
    } else {
      // 手机号注册
      if (!identifier || !code) {
        showDialog({ title: '错误', message: '请填写手机号和验证码' })
        return
      }

      const phoneRegex = /^1\d{10}$/
      if (!phoneRegex.test(identifier.trim())) {
        showDialog({ title: '错误', message: '请输入有效的手机号' })
        return
      }

      setLoading(true)
      try {
        const response = await authService.phoneLogin({
          phone: identifier.trim(),
          code: code.trim()
        })
        setUser(response.user)
        setToken(response.token)
        router.replace('/(tabs)/profile')
      } catch (error: any) {
        showDialog({
          title: '注册失败',
          message: error.response?.data?.message || '验证码错误或已过期'
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const handleSendCode = async () => {
    const phoneRegex = /^1\d{10}$/
    if (!phoneRegex.test(identifier.trim())) {
      showDialog({ title: '错误', message: '请输入有效的手机号' })
      return
    }
    if (sendingCode || codeCountdown > 0) {
      return
    }
    setSendingCode(true)
    try {
      await authService.sendPhoneCode({ phone: identifier.trim() })
      setCodeCountdown(60)
      showDialog({ title: '提示', message: '验证码已发送（测试环境为 0000）' })
    } catch (error: any) {
      showDialog({
        title: '发送失败',
        message: error.response?.data?.message || '发送验证码失败，请稍后重试'
      })
    } finally {
      setSendingCode(false)
    }
  }

  const handleWechatLogin = async () => {
    try {
      setLoading(true)
      let openId = await AsyncStorage.getItem('wechat_open_id')
      if (!openId) {
        openId = `wx_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
        await AsyncStorage.setItem('wechat_open_id', openId)
      }
      const response = await authService.wechatLogin({ openId })
      setUser(response.user)
      setToken(response.token)
      router.replace('/(tabs)/profile')
    } catch (error: any) {
      showDialog({
        title: '登录失败',
        message: error.response?.data?.message || '微信登录暂时不可用'
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
            <Text style={styles.title}>注册账号</Text>
            <Text style={styles.subtitle}>创建您的新账号</Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.methodTabs}>
              <TouchableOpacity
                style={[
                  styles.methodTab,
                  registerMode === 'email' && styles.methodTabActive
                ]}
                onPress={() => {
                  setRegisterMode('email')
                  setIdentifier('')
                  setPassword('')
                  setCode('')
                }}
              >
                <Text
                  style={[
                    styles.methodTabText,
                    registerMode === 'email' && styles.methodTabTextActive
                  ]}
                >
                  邮箱注册
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.methodTab,
                  registerMode === 'phone' && styles.methodTabActive
                ]}
                onPress={() => {
                  setRegisterMode('phone')
                  setIdentifier('')
                  setPassword('')
                  setCode('')
                }}
              >
                <Text
                  style={[
                    styles.methodTabText,
                    registerMode === 'phone' && styles.methodTabTextActive
                  ]}
                >
                  手机号注册
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.inputContainer,
                focusedField === 'identifier' && styles.inputContainerActive
              ]}
            >
              <Ionicons
                name={registerMode === 'email' ? 'mail-outline' : 'call-outline'}
                size={20}
                color={focusedField === 'identifier' ? '#f86752' : '#9ca3af'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={registerMode === 'email' ? '邮箱' : '手机号'}
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                keyboardType={registerMode === 'email' ? 'email-address' : 'phone-pad'}
                placeholderTextColor="#9ca3af"
                onFocus={() => setFocusedField('identifier')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {registerMode === 'email' ? (
              <View
                style={[
                  styles.inputContainer,
                  focusedField === 'password' && styles.inputContainerActive
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={focusedField === 'password' ? '#f86752' : '#9ca3af'}
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
            ) : (
              <View style={styles.codeRow}>
                <View
                  style={[
                    styles.inputContainer,
                    styles.codeInputContainer,
                    focusedField === 'code' && styles.inputContainerActive
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color={focusedField === 'code' ? '#f86752' : '#9ca3af'}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="验证码"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    placeholderTextColor="#9ca3af"
                    onFocus={() => setFocusedField('code')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                <TouchableOpacity
                  style={[
                    styles.codeButton,
                    (codeCountdown > 0 || sendingCode) && styles.codeButtonDisabled
                  ]}
                  onPress={handleSendCode}
                  disabled={codeCountdown > 0 || sendingCode}
                >
                  <Text style={styles.codeButtonText}>
                    {codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? '处理中...' : '注册'}</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>或使用以下方式快速注册</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.socialButton} onPress={handleWechatLogin}>
            <Ionicons name="logo-wechat" size={22} color="#07C160" />
            <Text style={styles.socialButtonText}>微信快速注册</Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>已有账号？</Text>
            <TouchableOpacity onPress={() => router.replace('/auth/login')}>
              <Text style={styles.loginLink}>立即登录</Text>
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
    marginBottom: 24
  },
  methodTabs: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 14,
    padding: 4
  },
  methodTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12
  },
  methodTabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1
  },
  methodTabText: {
    fontSize: 13,
    color: '#6b7280'
  },
  methodTabTextActive: {
    color: '#111827',
    fontWeight: '600'
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
    borderColor: '#f86752'
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
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  codeInputContainer: {
    flex: 1
  },
  codeButton: {
    paddingHorizontal: 14,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center'
  },
  codeButtonDisabled: {
    backgroundColor: '#9ca3af'
  },
  codeButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600'
  },
  button: {
    backgroundColor: '#f86752',
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24
  },
  loginText: {
    fontSize: 14,
    color: '#6b7280'
  },
  loginLink: {
    fontSize: 14,
    color: '#f86752',
    fontWeight: '600',
    marginLeft: 4
  }
})
