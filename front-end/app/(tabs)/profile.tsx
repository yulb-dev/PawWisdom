import { useEffect, useMemo, useRef, useState } from 'react'
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
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useDialog } from '../../components/ui/DialogProvider'
import { useAuthStore } from '../../store/auth.store'
import { useProfileStore } from '../../store/profile.store'
import { petService, Pet } from '../../services/pet.service'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const DESIGN_WIDTH = 375
const scale = (size: number) => (SCREEN_WIDTH / DESIGN_WIDTH) * size
const fontSize = (size: number) => Math.max(12, Math.round(scale(size)))
const DRAWER_WIDTH = SCREEN_WIDTH * 0.72

export default function ProfileScreen() {
  const { isAuthenticated, user } = useAuthStore()
  const { showDialog } = useDialog()
  const profile = useProfileStore()
  const [pets, setPets] = useState<Pet[]>([])
  const [drawerVisible, setDrawerVisible] = useState(false)
  const drawerTranslateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current
  const insets = useSafeAreaInsets()

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login')
      return
    }
    loadPets()
  }, [isAuthenticated])

  const loadPets = async () => {
    try {
      const data = await petService.getMyPets()
      setPets(data)
    } catch (error) {
      showDialog({ title: '错误', message: '加载宠物档案失败' })
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

  const displayName = profile.username || user?.username || '用户'
  const signature = profile.signature || '还没有设置个人主页签名'
  const avatarSource = profile.avatarUri
    ? { uri: profile.avatarUri }
    : require('../../assets/images/default_avatar.webp')
  const backgroundSource = profile.backgroundUri
    ? { uri: profile.backgroundUri }
    : require('../../assets/images/default_background.jpg')

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
            <TouchableOpacity style={styles.iconButton} onPress={openDrawer}>
              <Image
                source={require('../../assets/icons/more_menu.svg')}
                style={styles.iconImage}
              />
            </TouchableOpacity>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push('/profile/edit')}
              >
                <Image
                  source={require('../../assets/icons/edit.svg')}
                  style={styles.iconImage}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push('/scan')}
              >
                <Image
                  source={require('../../assets/icons/scan_qr.svg')}
                  style={styles.iconImage}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push('/settings')}
              >
                <Image
                  source={require('../../assets/icons/setup.svg')}
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

        <View style={styles.petCard}>
          <Text style={styles.petTitle}>宠物档案</Text>
          <View style={styles.petRight}>
            <TouchableOpacity
              style={styles.petStack}
              onPress={() => router.push({ pathname: '/pets' })}
            >
              {topPets.map((pet, index) => (
                <View
                  key={pet.id}
                  style={[styles.petAvatarWrap, { marginLeft: index === 0 ? 0 : -12 }]}
                >
                  <Image
                    source={
                      pet.avatarUrl
                        ? { uri: pet.avatarUrl }
                        : require('../../assets/images/default_avatar.webp')
                    }
                    style={styles.petAvatar}
                    contentFit="cover"
                  />
                </View>
              ))}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addPetButton}
              onPress={() => router.push('/pets/edit')}
            >
              <Text style={styles.addPetText}>+</Text>
            </TouchableOpacity>
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
  petCard: {
    marginTop: 10,
    marginHorizontal: 20,
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 0
  },
  petTitle: {
    fontSize: fontSize(16),
    color: '#111111',
    fontWeight: '500',
    marginBottom: 8
  },
  petRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  petStack: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  petAvatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#ffffff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  petAvatar: {
    width: '100%',
    height: '100%'
  },
  addPetButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#dddddd',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff'
  },
  addPetText: {
    fontSize: 22,
    fontWeight: '400',
    color: '#999999'
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
