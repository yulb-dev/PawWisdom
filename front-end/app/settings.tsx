import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useDialog } from '../components/ui/DialogProvider'
import { useAuthStore } from '../store/auth.store'
import { authService } from '../services/auth.service'
import { Ionicons } from '@expo/vector-icons'

export default function SettingsScreen() {
  const { showDialog } = useDialog()
  const { logout } = useAuthStore()
  const insets = useSafeAreaInsets()

  const handleLogout = () => {
    showDialog({
      title: '退出登录',
      message: '确定要退出登录吗？',
      confirmText: '退出',
      cancelText: '取消',
      showCancel: true,
      onConfirm: async () => {
        try {
          await authService.logout()
          logout()
          router.replace('/')
        } catch (error) {
          showDialog({ title: '错误', message: '退出登录失败，请稍后重试' })
        }
      }
    })
  }

  const SettingRow = ({
    label,
    value,
    onPress,
    showArrow = true
  }: {
    label: string
    value?: string
    onPress?: () => void
    showArrow?: boolean
  }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        {showArrow && <Text style={styles.arrow}>›</Text>}
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 5 }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>设置</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <SettingRow label="收货地址" onPress={() => {}} />
        </View>

        <View style={styles.section}>
          <SettingRow label="账号安全" onPress={() => {}} />
          <SettingRow label="隐私设置" onPress={() => {}} />
        </View>

        <View style={styles.section}>
          <SettingRow label="支付设置" onPress={() => {}} />
          <SettingRow label="消息通知" onPress={() => {}} />
          <SettingRow label="通用设置" onPress={() => {}} />
          <SettingRow label="清理缓存" onPress={() => {}} />
        </View>

        <View style={styles.section}>
          <SettingRow label="长辈版" value="未开启" onPress={() => {}} />
          <SettingRow label="未成年人模式" value="未开启" onPress={() => {}} />
        </View>

        <View style={styles.section}>
          <SettingRow label="关于美团" value="当前已是最新版本" onPress={() => {}} />
          <SettingRow label="意见反馈" onPress={() => {}} />
        </View>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>切换账号</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={styles.actionButtonText}>退出登录</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fa'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    paddingBottom: 4
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 0,
    minWidth: 44
  },
  backText: {
    fontSize: 24,
    color: '#111111'
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111111'
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 40
  },
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 8
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16
  },
  rowLabel: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500'
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  rowValue: {
    fontSize: 14,
    color: '#999999'
  },
  arrow: {
    fontSize: 20,
    color: '#cccccc',
    fontWeight: '300'
  },
  actionButton: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  logoutButton: {
    marginTop: 8
  },
  actionButtonText: {
    fontSize: 16,
    color: '#111111',
    fontWeight: '500'
  }
})
