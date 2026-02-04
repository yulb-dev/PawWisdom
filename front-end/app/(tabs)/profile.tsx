import { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useAuthStore } from '../../store/auth.store'
import { userService, UserProfile } from '../../services/user.service'
import { authService } from '../../services/auth.service'
import { useDialog } from '../../components/ui/DialogProvider'

export default function ProfileScreen() {
  const { logout, isAuthenticated } = useAuthStore()
  const { showDialog } = useDialog()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      setProfile(null)
      setLoading(false)
      router.replace('/auth/login')
      return
    }
    loadProfile()
  }, [isAuthenticated])

  const loadProfile = async () => {
    try {
      const data = await userService.getProfile()
      setProfile(data)
    } catch (error) {
      showDialog({ title: '错误', message: '加载个人资料失败' })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    const performLogout = async () => {
      try {
        await authService.logout()
        logout()
        router.replace('/')
      } catch (error) {
        showDialog({ title: '错误', message: '退出登录失败，请稍后重试' })
      }
    }

    showDialog({
      title: '退出登录',
      message: '确定要退出登录吗？',
      confirmText: '退出',
      cancelText: '取消',
      showCancel: true,
      onConfirm: performLogout
    })
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeAreaView>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.username?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.username}>{profile?.username}</Text>
          <Text style={styles.email}>{profile?.email}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>我的宠物</Text>
          {profile?.pets && profile.pets.length > 0 ? (
            profile.pets.map((pet) => (
              <View key={pet.id} style={styles.petCard}>
                <View style={styles.petInfo}>
                  <Text style={styles.petName}>{pet.name}</Text>
                  <Text style={styles.petDetails}>
                    {pet.species === 'cat' ? '猫' : pet.species === 'dog' ? '狗' : '其他'}{' '}
                    • {pet.breed || '未知品种'}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>还没有宠物，快去添加第一只吧！</Text>
          )}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/(tabs)/pets')}
          >
            <Text style={styles.addButtonText}>添加宠物</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>账号信息</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>用户名</Text>
            <Text style={styles.infoValue}>{profile?.username}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>邮箱</Text>
            <Text style={styles.infoValue}>{profile?.email}</Text>
          </View>
          {profile?.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>手机</Text>
              <Text style={styles.infoValue}>{profile.phone}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>退出登录</Text>
        </TouchableOpacity>
      </ScrollView>
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
    padding: 16
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb'
  },
  headerCard: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff'
  },
  username: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6
  },
  email: {
    fontSize: 14,
    color: '#6b7280'
  },
  sectionCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12
  },
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    marginBottom: 10
  },
  petInfo: {
    flex: 1
  },
  petName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4
  },
  petDetails: {
    fontSize: 14,
    color: '#6b7280'
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 16
  },
  addButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600'
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280'
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600'
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600'
  }
})
