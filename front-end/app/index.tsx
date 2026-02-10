import { useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useAuthStore } from '../store/auth.store'
import { authService } from '../services/auth.service'

export default function Index() {
  const { isAuthenticated, setUser, setToken } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = await authService.getToken()
      if (token) {
        setToken(token)
        const user = await authService.getMe()
        setUser(user)
        router.replace('/(tabs)/profile')
      }
    } catch (error) {
      console.log('Not authenticated')
    }
  }

  if (isAuthenticated === null) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.heroCard}>
          <View style={styles.logoWrap}>
            <Image source={require('../assets/icons/logo.svg')} style={styles.logo} />
          </View>
          <Text style={styles.title}>爪印</Text>
          <Text style={styles.subtitle}>您的宠物健康与生活伴侣</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.primaryButtonText}>登录</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/auth/register')}
          >
            <Text style={styles.secondaryButtonText}>注册</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f6fb'
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f6fb',
    padding: 24,
    justifyContent: 'center'
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5
  },
  logoWrap: {
    width: 84,
    height: 84,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  logo: {
    width: 52,
    height: 52
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center'
  },
  buttonContainer: {
    gap: 12
  },
  primaryButton: {
    backgroundColor: '#455af7',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center'
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  secondaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600'
  }
})
