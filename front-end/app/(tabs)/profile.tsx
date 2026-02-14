import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useAuthStore } from '../../store/auth.store'
import { useProfileStore } from '../../store/profile.store'
import { followService } from '../../services/follow.service'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const DESIGN_WIDTH = 375
const scale = (size: number) => (SCREEN_WIDTH / DESIGN_WIDTH) * size
const fontSize = (size: number) => Math.max(12, Math.round(scale(size)))
const DRAWER_WIDTH = SCREEN_WIDTH * 0.72

export default function ProfileScreen() {
  const { isAuthenticated, user } = useAuthStore()
  const profile = useProfileStore()
  const [drawerVisible, setDrawerVisible] = useState(false)
  const drawerTranslateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current
  const insets = useSafeAreaInsets()
  const hasMounted = useRef(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login')
      return
    }
    loadFollowStats()
  }, [isAuthenticated])

  // 监听页面焦点，每次进入页面时刷新关注统计
  useFocusEffect(
    useCallback(() => {
      if (hasMounted.current && isAuthenticated) {
        loadFollowStats()
      } else {
        hasMounted.current = true
      }
    }, [isAuthenticated])
  )

  const loadFollowStats = async () => {
    try {
      const { followerCount, followingCount } = await followService.getMyFollowStats()
      profile.updateProfile({
        followers: followerCount,
        following: followingCount
      })
    } catch {
      // 关注统计加载失败不影响主流程，这里静默处理
    }
  }

  const openDrawer = () => {
    setDrawerVisible(true)
    Animated.timing(drawerTranslateX, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true
    }).start()
  }

  const closeDrawer = () => {
    Animated.timing(drawerTranslateX, {
      toValue: -DRAWER_WIDTH,
      duration: 220,
      useNativeDriver: true
    }).start(() => {
      setDrawerVisible(false)
    })
  }

  const displayName = profile.username || user?.nickname || '用户'
  const avatarSource = profile.avatarUri
    ? { uri: profile.avatarUri }
    : require('../../assets/images/default_avatar.webp')

  if (!isAuthenticated) {
    return null
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={openDrawer}>
          <Image
            source={require('../../assets/icons/more_menu.svg')}
            style={styles.iconImage}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.scanButton} onPress={() => router.push('/scan')}>
          <Ionicons name="scan-outline" size={24} color="#111" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/settings')}>
          <Ionicons name="shield-checkmark-outline" size={24} color="#111" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 用户信息卡片 */}
        <TouchableOpacity
          style={styles.profileCard}
          activeOpacity={0.8}
          onPress={() => router.push('/profile-detail')}
        >
          <Image source={avatarSource} style={styles.avatar} contentFit="cover" />
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userSubtitle}>金毛寻回犬 · 宠物达人</Text>
          </View>
          <Ionicons name="qr-code-outline" size={24} color="#111" />
        </TouchableOpacity>

        {/* 统计卡片 */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>98626</Text>
            <Text style={styles.statLabel}>获赞</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>686</Text>
            <Text style={styles.statLabel}>动态</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>6869</Text>
            <Text style={styles.statLabel}>分享</Text>
          </View>
        </View>

        {/* 功能列表 */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/profile-detail')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="people-outline" size={24} color="#111" />
              <Text style={styles.menuItemText}>粉丝</Text>
            </View>
            <View style={styles.menuItemRight}>
              <Text style={styles.menuItemCount}>{profile.followers}</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/profile-detail')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="person-add-outline" size={24} color="#111" />
              <Text style={styles.menuItemText}>关注</Text>
            </View>
            <View style={styles.menuItemRight}>
              <Text style={styles.menuItemCount}>{profile.following}</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/my-favorites')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="star-outline" size={24} color="#111" />
              <Text style={styles.menuItemText}>收藏</Text>
            </View>
            <View style={styles.menuItemRight}>
              <Text style={styles.menuItemCount}>264</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/my-posts')}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="bag-handle-outline" size={24} color="#111" />
              <Text style={styles.menuItemText}>我的动态</Text>
            </View>
            <View style={styles.menuItemRight}>
              <Text style={styles.menuItemCount}>18</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>
        </View>

        {/* 深色模式切换 */}
        <View style={styles.darkModeSection}>
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="moon-outline" size={24} color="#111" />
              <Text style={styles.menuItemText}>深色模式</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {drawerVisible && (
        <View style={styles.drawerOverlay} pointerEvents="box-none">
          <Pressable style={styles.drawerBackdrop} onPress={closeDrawer} />
          <Animated.View
            style={[styles.drawer, { transform: [{ translateX: drawerTranslateX }] }]}
          >
            <View style={styles.drawerContent} />
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff'
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconImage: {
    width: 24,
    height: 24,
    tintColor: '#111'
  },
  scanButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 24
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32
  },
  profileInfo: {
    flex: 1
  },
  userName: {
    fontSize: fontSize(18),
    fontWeight: '700',
    color: '#111',
    marginBottom: 4
  },
  userSubtitle: {
    fontSize: fontSize(14),
    color: '#999'
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 12
  },
  statItem: {
    alignItems: 'center'
  },
  statNumber: {
    fontSize: fontSize(24),
    fontWeight: '700',
    color: '#111',
    marginBottom: 4
  },
  statLabel: {
    fontSize: fontSize(12),
    color: '#999'
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E5E5'
  },
  menuSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden'
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0'
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  menuItemText: {
    fontSize: fontSize(16),
    color: '#111',
    fontWeight: '500'
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  menuItemCount: {
    fontSize: fontSize(14),
    color: '#999'
  },
  darkModeSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden'
  },
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row'
  },
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)'
  },
  drawer: {
    width: DRAWER_WIDTH,
    backgroundColor: '#ffffff',
    height: '100%'
  },
  drawerContent: {
    flex: 1
  }
})
