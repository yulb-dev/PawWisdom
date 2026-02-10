import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../store/auth.store'
import { authService } from '../../services/auth.service'
import { useDialog } from '../../components/ui/DialogProvider'

export default function Login() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loginMode, setLoginMode] = useState<'email' | 'phone'>('email')
  const [loginMethod, setLoginMethod] = useState<'password' | 'code'>('password')
  const [codeCountdown, setCodeCountdown] = useState(0)
  const [sendingCode, setSendingCode] = useState(false)
  const [focusedField, setFocusedField] = useState<'identifier' | 'password' | null>(null)

  const { setUser, setToken } = useAuthStore()
  const { showDialog } = useDialog()
  const wechatAppId = process.env.EXPO_PUBLIC_WECHAT_APP_ID

  const handleIdentifierChange = (value: string) => {
    setIdentifier(value)
    if (value.includes('@')) {
      setLoginMode('email')
      setLoginMethod('password')
      return
    }
    if (value.length === 0) {
      return
    }
    if (/^\d+$/.test(value)) {
      setLoginMode('phone')
    }
  }

  useEffect(() => {
    if (codeCountdown <= 0) return
    const timer = setTimeout(() => {
      setCodeCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearTimeout(timer)
  }, [codeCountdown])

  useEffect(() => {
    const handleUrl = (url: string) => {
      try {
        const parsed = new URL(url)
        if (parsed.hostname !== 'wechat-auth') {
          return
        }
        const codeValue = parsed.searchParams.get('code')
        if (codeValue) {
          void handleWechatCodeLogin(codeValue)
        }
      } catch {
        return
      }
    }

    const subscription = Linking.addEventListener('url', (event) => {
      handleUrl(event.url)
    })

    void Linking.getInitialURL().then((url) => {
      if (url) {
        handleUrl(url)
      }
    })

    return () => {
      subscription.remove()
    }
  }, [])

  const handleLogin = async () => {
    if (!identifier) {
      showDialog({ title: '错误', message: '请填写所有字段' })
      return
    }

    if (loginMode === 'email') {
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
      if (!emailRegex.test(identifier.trim())) {
        showDialog({ title: '错误', message: '请输入有效的邮箱地址' })
        return
      }
    } else {
      const phoneRegex = /^1\d{10}$/
      if (!phoneRegex.test(identifier.trim())) {
        showDialog({ title: '错误', message: '请输入有效的手机号' })
        return
      }
    }

    if (loginMethod === 'password') {
      if (!password) {
        showDialog({ title: '错误', message: '请输入密码' })
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
    } else {
      if (!code) {
        showDialog({ title: '错误', message: '请输入验证码' })
        return
      }
    }

    setLoading(true)
    try {
      if (loginMode === 'phone' && loginMethod === 'code') {
        const response = await authService.phoneLogin({
          phone: identifier.trim(),
          code: code.trim()
        })
        setUser(response.user)
        setToken(response.token)
        router.replace('/(tabs)/profile')
      } else {
        const response = await authService.login({ identifier: identifier.trim(), password })
        setUser(response.user)
        setToken(response.token)
        router.replace('/(tabs)/profile')
      }
    } catch (error: any) {
      const fallbackMessage =
        loginMode === 'phone'
          ? loginMethod === 'code'
            ? '验证码错误或已过期'
            : '手机号或密码错误'
          : '邮箱或密码错误'
      showDialog({
        title: '登录失败',
        message: error.response?.data?.message || fallbackMessage
      })
    } finally {
      setLoading(false)
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
    if (!wechatAppId) {
      showDialog({
        title: '提示',
        message: '未配置微信 AppID，请先配置后再试'
      })
      return
    }

    const state = `pw_${Date.now()}`
    const authUrl = `weixin://app/${wechatAppId}/auth/?scope=snsapi_userinfo&state=${state}`

    try {
      const canOpen = await Linking.canOpenURL(authUrl)
      if (!canOpen) {
        showDialog({
          title: '提示',
          message: '未检测到微信客户端，请安装后重试'
        })
        return
      }
      await Linking.openURL(authUrl)
    } catch (error: any) {
      showDialog({
        title: '登录失败',
        message: error?.message || '无法拉起微信，请稍后重试'
      })
    }
  }

  const handleWechatCodeLogin = async (codeValue: string) => {
    try {
      setLoading(true)
      const response = await authService.wechatCodeLogin({ code: codeValue })
      setUser(response.user)
      setToken(response.token)
      router.replace('/(tabs)/profile')
    } catch (error: any) {
      showDialog({
        title: '登录失败',
        message: error.response?.data?.message || '微信授权失败'
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
            {loginMode === 'phone' && (
              <View style={styles.methodTabs}>
                <TouchableOpacity
                  style={[
                    styles.methodTab,
                    loginMethod === 'password' && styles.methodTabActive
                  ]}
                  onPress={() => setLoginMethod('password')}
                >
                  <Text
                    style={[
                      styles.methodTabText,
                      loginMethod === 'password' && styles.methodTabTextActive
                    ]}
                  >
                    密码登录
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.methodTab,
                    loginMethod === 'code' && styles.methodTabActive
                  ]}
                  onPress={() => setLoginMethod('code')}
                >
                  <Text
                    style={[
                      styles.methodTabText,
                      loginMethod === 'code' && styles.methodTabTextActive
                    ]}
                  >
                    验证码登录
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            <View
              style={[
                styles.inputContainer,
                focusedField === 'identifier' && styles.inputContainerActive
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={focusedField === 'identifier' ? '#f86752' : '#9ca3af'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={loginMode === 'email' ? '邮箱' : '手机号'}
                value={identifier}
                onChangeText={handleIdentifierChange}
                autoCapitalize="none"
                keyboardType={loginMode === 'email' ? 'email-address' : 'phone-pad'}
                placeholderTextColor="#9ca3af"
                onFocus={() => setFocusedField('identifier')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {loginMethod === 'password' ? (
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
                <View style={[styles.inputContainer, styles.codeInputContainer]}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color="#9ca3af"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="验证码"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    placeholderTextColor="#9ca3af"
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

          {loginMethod === 'password' && (
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => router.push('/auth/reset-password')}
            >
              <Text style={styles.forgotPasswordText}>忘记密码？</Text>
            </TouchableOpacity>
          )}

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

          <TouchableOpacity style={styles.socialButton} onPress={handleWechatLogin}>
            <Ionicons name="logo-wechat" size={22} color="#111827" />
            <Text style={styles.socialButtonText}>微信登录</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => {
              setLoginMode('phone')
              setLoginMethod('code')
              setIdentifier('')
            }}
          >
            <Ionicons name="call-outline" size={20} color="#EA4335" />
            <Text style={styles.socialButtonText}>手机号登录</Text>
          </TouchableOpacity>

          {loginMode === 'phone' && (
            <TouchableOpacity
              style={styles.switchLoginMode}
              onPress={() => {
                setLoginMode('email')
                setLoginMethod('password')
                setIdentifier('')
                setCode('')
              }}
            >
              <Text style={styles.switchLoginText}>使用邮箱登录</Text>
            </TouchableOpacity>
          )}

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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#f86752',
    fontWeight: '500'
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
  switchLoginMode: {
    alignSelf: 'center',
    marginTop: 8
  },
  switchLoginText: {
    fontSize: 13,
    color: '#6b7280'
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
    color: '#f86752',
    fontWeight: '600',
    marginLeft: 4
  }
})
