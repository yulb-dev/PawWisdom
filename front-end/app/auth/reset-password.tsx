import { useMemo, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Image } from 'expo-image'
import { BlurView } from 'expo-blur'
import {
  VerificationCodeInput,
  NumericKeypad
} from '../../components/auth/VerificationCodeInput'
import { useDialog } from '../../components/ui/DialogProvider'

type ResetStep = 'method' | 'input' | 'verify' | 'newPassword' | 'success'
type ResetMethod = 'email' | 'phone'

const CODE_LENGTH = 4
const TEST_CODE = '0000'

export default function ResetPassword() {
  const [step, setStep] = useState<ResetStep>('method')
  const [method, setMethod] = useState<ResetMethod>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const { showDialog } = useDialog()
  const [focusedField, setFocusedField] = useState<
    'email' | 'phone' | 'password' | 'confirmPassword' | null
  >(null)

  const handleBack = () => {
    if (step === 'method') {
      router.back()
      return
    }
    if (step === 'input') {
      setStep('method')
      return
    }
    if (step === 'verify') {
      setStep('input')
      return
    }
    if (step === 'newPassword') {
      setStep('verify')
      return
    }
  }

  const maskedTarget = useMemo(() => {
    if (method === 'email') {
      if (!email) {
        return '您的邮箱'
      }
      const [name, domain] = email.split('@')
      const safeName = name.length > 2 ? `${name.slice(0, 2)}***` : `${name}***`
      return `${safeName}@${domain || ''}`
    }
    if (!phone) {
      return '您的手机号'
    }
    const tail = phone.replace(/\s+/g, '').slice(-4)
    return `**** **** ${tail}`
  }, [email, method, phone])

  const handleSendCode = () => {
    if (method === 'email' && !email) {
      showDialog({ title: '错误', message: '请输入邮箱' })
      return
    }
    if (method === 'phone' && !phone) {
      showDialog({ title: '错误', message: '请输入手机号' })
      return
    }
    setCode('')
    setStep('verify')
  }

  const handlePressNumber = (value: string) => {
    if (code.length >= CODE_LENGTH) {
      return
    }
    setCode((prev) => `${prev}${value}`)
  }

  const handleBackspace = () => {
    setCode((prev) => prev.slice(0, -1))
  }

  const handleVerify = () => {
    if (code.length < CODE_LENGTH) {
      showDialog({ title: '错误', message: '请输入4位验证码' })
      return
    }
    if (code !== TEST_CODE) {
      showDialog({ title: '验证码错误', message: '请输入正确的验证码' })
      return
    }
    setStep('newPassword')
  }

  const handleResetPassword = () => {
    if (!password || !confirmPassword) {
      showDialog({ title: '错误', message: '请填写所有字段' })
      return
    }
    if (password !== confirmPassword) {
      showDialog({ title: '错误', message: '两次输入的密码不一致' })
      return
    }
    setShowSuccessModal(true)
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
          {step !== 'success' && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="chevron-back" size={22} color="#111827" />
            </TouchableOpacity>
          )}

          {step === 'method' && (
            <>
              <Text style={styles.title}>重置密码</Text>
              <Text style={styles.subtitle}>请选择一种方式找回密码</Text>

              <TouchableOpacity
                style={[styles.methodCard, method === 'email' && styles.methodCardActive]}
                onPress={() => setMethod('email')}
              >
                <View
                  style={[
                    styles.methodIcon,
                    method === 'email' && styles.methodIconActive
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={22}
                    color={method === 'email' ? '#ffffff' : '#4F46E5'}
                  />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodTitle}>邮箱</Text>
                  <Text style={styles.methodText}>使用邮箱接收验证码</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.methodCard, method === 'phone' && styles.methodCardActive]}
                onPress={() => setMethod('phone')}
              >
                <View
                  style={[
                    styles.methodIcon,
                    method === 'phone' && styles.methodIconActive
                  ]}
                >
                  <Ionicons
                    name="call-outline"
                    size={22}
                    color={method === 'phone' ? '#ffffff' : '#4F46E5'}
                  />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodTitle}>手机号</Text>
                  <Text style={styles.methodText}>使用短信接收验证码</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setStep('input')}
              >
                <Text style={styles.primaryButtonText}>继续</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'input' && (
            <>
              <Text style={styles.title}>重置密码</Text>
              <Text style={styles.subtitle}>
                {method === 'email'
                  ? '请输入邮箱，我们将发送验证码到您的邮箱'
                  : '请输入手机号，我们将发送验证码到您的手机'}
              </Text>

              <View
                style={[
                  styles.inputContainer,
                  focusedField === (method === 'email' ? 'email' : 'phone') &&
                    styles.inputContainerActive
                ]}
              >
                <Ionicons
                  name={method === 'email' ? 'mail-outline' : 'call-outline'}
                  size={20}
                  color={
                    focusedField === (method === 'email' ? 'email' : 'phone')
                      ? '#4F46E5'
                      : '#9ca3af'
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder={method === 'email' ? '邮箱' : '手机号'}
                  value={method === 'email' ? email : phone}
                  onChangeText={method === 'email' ? setEmail : setPhone}
                  autoCapitalize="none"
                  keyboardType={method === 'email' ? 'email-address' : 'phone-pad'}
                  placeholderTextColor="#9ca3af"
                  onFocus={() => setFocusedField(method === 'email' ? 'email' : 'phone')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={handleSendCode}>
                <Text style={styles.primaryButtonText}>发送验证码</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'verify' && (
            <>
              <Text style={styles.title}>验证码</Text>
              <Text style={styles.subtitle}>请输入发送到 {maskedTarget} 的验证码</Text>

              <View style={styles.verifyLayout}>
                <View style={styles.verifyContent}>
                  <VerificationCodeInput code={code} length={CODE_LENGTH} />

                  <TouchableOpacity style={styles.resendButton} onPress={handleSendCode}>
                    <Text style={styles.resendText}>重新发送验证码</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.primaryButton} onPress={handleVerify}>
                    <Text style={styles.primaryButtonText}>继续</Text>
                  </TouchableOpacity>
                </View>

                <NumericKeypad
                  onPressNumber={handlePressNumber}
                  onBackspace={handleBackspace}
                />
              </View>
            </>
          )}

          {step === 'newPassword' && (
            <>
              <Text style={styles.title}>创建新密码</Text>
              <Text style={styles.subtitle}>新密码需与旧密码不同</Text>

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
                  placeholder="新密码"
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

              <View
                style={[
                  styles.inputContainer,
                  focusedField === 'confirmPassword' && styles.inputContainerActive
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={focusedField === 'confirmPassword' ? '#4F46E5' : '#9ca3af'}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="确认密码"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  placeholderTextColor="#9ca3af"
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleResetPassword}
              >
                <Text style={styles.primaryButtonText}>重置密码</Text>
              </TouchableOpacity>
            </>
          )}

          <Modal visible={showSuccessModal} transparent animationType="fade">
            <View style={styles.modalContainer}>
              <BlurView
                intensity={28}
                tint="light"
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.modalOverlay} />
              <View style={styles.successCard}>
                <View style={styles.successIconWrap}>
                  <Image
                    source={require('../../assets/icons/success.svg')}
                    style={styles.successIcon}
                  />
                </View>
                <Text style={styles.successTitle}>密码重置成功</Text>
                <Text style={styles.successSubtitle}>密码已更新，请使用新密码登录</Text>
                <TouchableOpacity
                  style={[styles.primaryButton, styles.successButton]}
                  onPress={() => {
                    setShowSuccessModal(false)
                    router.replace('/auth/login')
                  }}
                >
                  <Text style={styles.primaryButtonText}>返回登录</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
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
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 28
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16
  },
  methodCardActive: {
    borderColor: '#455af7',
    backgroundColor: '#f5f6ff'
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  methodIconActive: {
    backgroundColor: '#455af7'
  },
  methodInfo: {
    flex: 1
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4
  },
  methodText: {
    fontSize: 14,
    color: '#6b7280'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16
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
  verifyLayout: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 12
  },
  verifyContent: {
    alignItems: 'center'
  },
  resendButton: {
    alignSelf: 'center',
    marginBottom: 28
  },
  resendText: {
    fontSize: 14,
    color: '#455af7',
    fontWeight: '600'
  },
  primaryButton: {
    backgroundColor: '#455af7',
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'stretch'
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  },
  modalContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 24, 39, 0.02)'
  },
  successCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 28,
    width: '88%',
    alignItems: 'center',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5
  },
  successIconWrap: {
    marginBottom: 20
  },
  successIcon: {
    width: 100,
    height: 100
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8
  },
  successSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20
  },
  successButton: {
    alignSelf: 'stretch',
    marginTop: 0
  }
})
