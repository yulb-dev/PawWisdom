import { useMemo, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useAuthStore } from '../../store/auth.store'
import { useProfileStore } from '../../store/profile.store'
import { authService } from '../../services/auth.service'
import {
  VerificationCodeInput,
  NumericKeypad
} from '../../components/auth/VerificationCodeInput'
import { useDialog } from '../../components/ui/DialogProvider'

const CODE_LENGTH = 4
const TEST_CODE = '0000'

export default function VerifyCode() {
  const { type } = useLocalSearchParams<{ type?: string }>()
  const verifyType = (type || 'email') as 'email' | 'phone'
  const { pendingRegister, setUser, setToken, setPendingRegister } = useAuthStore()
  const resetProfile = useProfileStore((state) => state.resetProfile)
  const { showDialog } = useDialog()
  const [code, setCode] = useState('')

  const maskedIdentifier = useMemo(() => {
    if (!pendingRegister?.email && !pendingRegister?.phone) {
      return ''
    }
    if (verifyType === 'email' && pendingRegister?.email) {
      const [name, domain] = pendingRegister.email.split('@')
      const safeName = name.length > 2 ? `${name.slice(0, 2)}***` : `${name}***`
      return `${safeName}@${domain || ''}`
    }
    if (verifyType === 'phone' && pendingRegister?.phone) {
      const phone = pendingRegister.phone
      return `${phone.slice(0, 3)}****${phone.slice(-4)}`
    }
    return ''
  }, [pendingRegister, verifyType])

  const handlePressNumber = (value: string) => {
    if (code.length >= CODE_LENGTH) {
      return
    }
    setCode((prev) => `${prev}${value}`)
  }

  const handleBackspace = () => {
    setCode((prev) => prev.slice(0, -1))
  }

  const handleVerify = async () => {
    if (!pendingRegister) {
      showDialog({
        title: '错误',
        message: '注册信息已失效，请重新注册',
        onConfirm: () => router.replace('/auth/register')
      })
      return
    }
    if (code.length < CODE_LENGTH) {
      showDialog({ title: '错误', message: '请输入4位验证码' })
      return
    }
    if (code !== TEST_CODE) {
      showDialog({ title: '验证码错误', message: '请输入正确的验证码' })
      return
    }

    try {
      const response = await authService.register(pendingRegister)
      setUser(response.user)
      setToken(response.token)
      setPendingRegister(null)
      resetProfile()
      router.replace('/(tabs)/profile')
    } catch (error: any) {
      showDialog({
        title: '注册失败',
        message: error.response?.data?.message || '创建账号失败'
      })
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>

        <Text style={styles.title}>验证码</Text>
        <Text style={styles.subtitle}>
          请输入发送到 {maskedIdentifier || (verifyType === 'email' ? '您的邮箱' : '您的手机号')}{' '}
          的验证码
        </Text>

        <View style={styles.verifyLayout}>
          <View style={styles.verifyContent}>
            <VerificationCodeInput code={code} length={CODE_LENGTH} />

            <TouchableOpacity style={styles.resendButton}>
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
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#ffffff',
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
    marginBottom: 8,
    alignSelf: 'stretch'
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  }
})
