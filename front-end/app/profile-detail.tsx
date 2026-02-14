import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { useDialog } from '../components/ui/DialogProvider'
import { useAuthStore } from '../store/auth.store'
import { useProfileStore } from '../store/profile.store'
import { petService, Pet } from '../services/pet.service'
import { followService } from '../services/follow.service'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const DESIGN_WIDTH = 375
const scale = (size: number) => (SCREEN_WIDTH / DESIGN_WIDTH) * size
const fontSize = (size: number) => Math.max(12, Math.round(scale(size)))
const DRAWER_WIDTH = SCREEN_WIDTH * 0.72

export default function ProfileDetailScreen() {
  const { isAuthenticated, user } = useAuthStore()
  const { showDialog } = useDialog()
  const profile = useProfileStore()
  const [pets, setPets] = useState<Pet[]>([])
  const [drawerVisible, setDrawerVisible] = useState(false)
  const drawerTranslateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current
  const insets = useSafeAreaInsets()
  const hasMounted = useRef(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login')
      return
    }
    loadPets()
    loadFollowStats()
  }, [isAuthenticated])

  // 监听页面焦点，每次进入页面时刷新宠物列表
  useFocusEffect(
    useCallback(() => {
      if (hasMounted.current && isAuthenticated) {
        loadPets()
        loadFollowStats()
      } else {
        hasMounted.current = true
      }
    }, [isAuthenticated])
  )

  const loadPets = async () => {
    try {
      const data = await petService.getMyPets()
      setPets(data)
    } catch (error) {
      showDialog({ title: '错误', message: '加载宠物档案失败' })
    }
  }

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
  const signature = profile.signature || '添加点介绍吧...'
  const avatarSource = profile.avatarUri
    ? { uri: profile.avatarUri }
    : require('../assets/images/default_avatar.webp')
  const backgroundSource = profile.backgroundUri
    ? { uri: profile.backgroundUri }
    : require('../assets/images/default_background.jpg')

  const topPets = useMemo(() => pets.slice(0, 2), [pets])

  if (!isAuthenticated) {
    return null
  }

  const HEADER_HEIGHT = SCREEN_WIDTH * 0.65 + insets.top

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollBody}
      >
        <View style={styles.headerWrap}>
          <Image
            source={backgroundSource}
            style={styles.headerImage}
            contentFit="cover"
          />
          <View style={styles.headerOverlay} />
          <View style={[styles.headerActions, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push('/profile/edit')}
              >
                <Image
                  source={require('../assets/icons/edit.svg')}
                  style={styles.iconImage}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push('/scan')}
              >
                <Image
                  source={require('../assets/icons/scan_qr.svg')}
                  style={styles.iconImage}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push('/settings')}
              >
                <Image
                  source={require('../assets/icons/setup.svg')}
                  style={styles.iconImage}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.profileTextBlock}>
              <Text style={styles.profileName}>{displayName}</Text>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{profile.followers}</Text>
                  <Text style={styles.statLabel}>粉丝</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{profile.following}</Text>
                  <Text style={styles.statLabel}>关注</Text>
                </View>
              </View>
              <Text style={styles.signatureText}>{signature}</Text>
            </View>
            <View style={styles.avatarWrap}>
              <Image source={avatarSource} style={styles.avatar} contentFit="cover" />
            </View>
          </View>
        </View>

        {/* 我的内容卡片 */}
        <View style={styles.contentCard}>
          <View style={styles.contentGrid}>
            <TouchableOpacity style={styles.contentItem} onPress={() => router.push('/my-posts')}>
              <Ionicons name="newspaper-outline" size={24} color="#f97316" />
              <Text style={styles.contentItemText}>我的动态</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contentItem} onPress={() => router.push('/my-drafts')}>
              <Ionicons name="document-outline" size={24} color="#8B5CF6" />
              <Text style={styles.contentItemText}>草稿箱</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contentItem} onPress={() => router.push('/my-likes')}>
              <Ionicons name="heart-outline" size={24} color="#FF6B6B" />
              <Text style={styles.contentItemText}>我的点赞</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contentItem}
              onPress={() => router.push('/my-favorites')}
            >
              <Ionicons name="star-outline" size={24} color="#FCD34D" />
              <Text style={styles.contentItemText}>我的收藏</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.petCard}>
          <View style={styles.petHeader}>
            <View style={styles.petTitleRow}>
              <Ionicons name="paw" size={20} color="#f97316" />
              <Text style={styles.petTitle}>我的宠物</Text>
              {pets.length > 0 && (
                <View style={styles.petBadge}>
                  <Text style={styles.petBadgeText}>{pets.length}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => router.push({ pathname: '/pets' })}>
              <Text style={styles.viewAllText}>查看全部</Text>
            </TouchableOpacity>
          </View>

          {pets.length > 0 ? (
            <View style={styles.petList}>
              {topPets.map((pet) => (
                <TouchableOpacity
                  key={pet.id}
                  style={styles.petItem}
                  onPress={() =>
                    router.push({ pathname: '/pets/edit', params: { id: pet.id } })
                  }
                >
                  <View style={styles.petAvatarWrap}>
                    <Image
                      source={
                        pet.avatarUrl
                          ? { uri: pet.avatarUrl }
                          : require('../assets/images/default_avatar.webp')
                      }
                      style={styles.petAvatar}
                      contentFit="cover"
                    />
                  </View>
                  <View style={styles.petItemInfo}>
                    <Text style={styles.petItemName} numberOfLines={1}>
                      {pet.name}
                    </Text>
                    <Text style={styles.petItemBreed} numberOfLines={1}>
                      {pet.breed ||
                        (pet.species === 'cat'
                          ? '猫'
                          : pet.species === 'dog'
                            ? '狗'
                            : '其他')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                </TouchableOpacity>
              ))}
              {pets.length > 2 && (
                <TouchableOpacity
                  style={styles.viewMoreButton}
                  onPress={() => router.push({ pathname: '/pets' })}
                >
                  <Text style={styles.viewMoreText}>查看更多 ({pets.length - 2})</Text>
                  <Ionicons name="arrow-forward" size={16} color="#f97316" />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity style={styles.emptyPetCard} onPress={() => router.push('/pets/edit')}>
              <Ionicons name="add-circle-outline" size={40} color="#f97316" />
              <Text style={styles.emptyPetText}>添加第一只宠物</Text>
            </TouchableOpacity>
          )}
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
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  scrollBody: {
    paddingBottom: 24
  },
  headerWrap: {
    width: '100%',
    position: 'relative'
  },
  headerImage: {
    width: '100%',
    height: 200
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.15)'
  },
  headerActions: {
    position: 'absolute',
    top: 0,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
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
    tintColor: '#ffffff'
  },
  profileCard: {
    marginHorizontal: 20,
    backgroundColor: '#ffffff',
    paddingVertical: 20
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  profileTextBlock: {
    flex: 1,
    paddingRight: 12
  },
  profileName: {
    fontSize: fontSize(20),
    fontWeight: '600',
    color: '#111111',
    marginBottom: 12
  },
  statRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4
  },
  statValue: {
    fontSize: fontSize(15),
    fontWeight: '500',
    color: '#111111'
  },
  statLabel: {
    fontSize: fontSize(14),
    color: '#999999'
  },
  signatureText: {
    fontSize: fontSize(14),
    color: '#666666',
    lineHeight: 20
  },
  avatarWrap: {
    width: scale(110),
    height: scale(110),
    borderRadius: scale(55),
    borderWidth: 3,
    borderColor: '#ffffff',
    overflow: 'hidden',
    transform: [{ translateY: -50 }]
  },
  avatar: {
    width: '100%',
    height: '100%'
  },
  contentCard: {
    marginTop: 16,
    marginHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  contentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  contentItem: {
    flex: 1,
    minWidth: '45%',
    aspectRatio: 1.5,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  contentItemText: {
    fontSize: fontSize(14),
    fontWeight: '600',
    color: '#1f2937'
  },
  petCard: {
    marginTop: 16,
    marginHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  petHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  petTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  petTitle: {
    fontSize: fontSize(17),
    color: '#1f2937',
    fontWeight: '700'
  },
  petBadge: {
    backgroundColor: '#f97316',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center'
  },
  petBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff'
  },
  viewAllText: {
    fontSize: fontSize(14),
    color: '#f97316',
    fontWeight: '600'
  },
  petList: {
    gap: 12
  },
  petItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    gap: 12
  },
  petAvatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ffffff'
  },
  petAvatar: {
    width: '100%',
    height: '100%'
  },
  petItemInfo: {
    flex: 1,
    gap: 4
  },
  petItemName: {
    fontSize: fontSize(15),
    fontWeight: '600',
    color: '#1f2937'
  },
  petItemBreed: {
    fontSize: fontSize(13),
    color: '#6b7280'
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#fef3f2',
    borderRadius: 12
  },
  viewMoreText: {
    fontSize: fontSize(14),
    color: '#f97316',
    fontWeight: '600'
  },
  emptyPetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 24,
    backgroundColor: '#fef3f2',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#fed7aa',
    borderStyle: 'dashed'
  },
  emptyPetText: {
    fontSize: fontSize(15),
    color: '#f97316',
    fontWeight: '600'
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
