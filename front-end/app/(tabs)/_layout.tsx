import { Tabs, router } from 'expo-router'
import { StyleSheet, View, Text, TouchableOpacity, Modal, Animated, Pressable } from 'react-native'
import { Image } from 'expo-image'
import { useAuthStore } from '../../store/auth.store'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import React, { useRef } from 'react'

const DRAWER_HEIGHT = 220

export default function TabLayout() {
  const { isAuthenticated } = useAuthStore()
  const insets = useSafeAreaInsets()
  const [showDrawer, setShowDrawer] = React.useState(false)
  const translateY = useRef(new Animated.Value(DRAWER_HEIGHT)).current

  const openDrawer = () => {
    setShowDrawer(true)
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start()
  }

  const closeDrawer = () => {
    Animated.timing(translateY, {
      toValue: DRAWER_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowDrawer(false)
    })
  }

  const handleSelectCamera = () => {
    closeDrawer()
    setTimeout(() => {
      router.push('/create-post')
    }, 300)
  }

  const handleSelectAI = () => {
    closeDrawer()
    setTimeout(() => {
      router.push('/ai-emotion')
    }, 300)
  }

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#f96853',
          tabBarInactiveTintColor: '#282828',
          headerShown: false,
          tabBarStyle: styles.tabBar
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: '首页',
            tabBarIcon: ({ color, size }) => (
              <Image
                source={require('../../assets/icons/tabbar/home.svg')}
                style={[styles.tabIcon, { width: size, height: size, tintColor: color }]}
                contentFit="contain"
              />
            )
          }}
        />
        <Tabs.Screen
          name="planet"
          options={{
            title: '广场',
            tabBarIcon: ({ color, size }) => (
              <Image
                source={require('../../assets/icons/tabbar/planet.svg')}
                style={[styles.tabIcon, { width: size + 2, height: size + 2, tintColor: color }]}
                contentFit="contain"
              />
            )
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            title: '发布',
            tabBarIcon: ({ color, size }) => (
              <Image
                source={require('../../assets/icons/tabbar/create.svg')}
                style={[styles.tabIcon, { width: size, height: size, tintColor: color }]}
                contentFit="contain"
              />
            )
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault()
              openDrawer()
            }
          }}
        />
        <Tabs.Screen
          name="message"
          options={{
            title: '消息',
            tabBarIcon: ({ color, size }) => (
              <Image
                source={require('../../assets/icons/tabbar/message.svg')}
                style={[styles.tabIcon, { width: size, height: size, tintColor: color }]}
                contentFit="contain"
              />
            )
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: '我的',
            tabBarIcon: ({ color, size }) => (
              <Image
                source={require('../../assets/icons/tabbar/myself.svg')}
                style={[styles.tabIcon, { width: size + 2, height: size + 2, tintColor: color }]}
                contentFit="contain"
              />
            )
          }}
          listeners={{
            tabPress: (event) => {
              if (!isAuthenticated) {
                event.preventDefault()
                router.replace('/auth/login')
              }
            }
          }}
        />
      </Tabs>

      {/* 发布抽屉 */}
      {showDrawer && (
        <Modal transparent visible={showDrawer} animationType="none" onRequestClose={closeDrawer}>
          <View style={styles.drawerContainer}>
            <Pressable style={styles.backdrop} onPress={closeDrawer} />
            <Animated.View
              style={[
                styles.drawer,
                {
                  paddingBottom: insets.bottom + 16,
                  transform: [{ translateY }],
                },
              ]}
            >
              <View style={styles.handle} />
              <Text style={styles.title}>创建内容</Text>

              <TouchableOpacity style={styles.menuItem} onPress={handleSelectCamera}>
                <View style={styles.iconContainer}>
                  <Ionicons name="images-outline" size={24} color="#FF6B6B" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>从相机选择</Text>
                  <Text style={styles.menuDescription}>选择照片或视频发布动态</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={handleSelectAI}>
                <View style={[styles.iconContainer, styles.aiIconContainer]}>
                  <Ionicons name="sparkles-outline" size={24} color="#8B5CF6" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>AI情绪识别</Text>
                  <Text style={styles.menuDescription}>拍摄宠物照片，AI识别情绪</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopColor: '#f1f1f1',
    backgroundColor: '#ffffff'
  },
  tabIcon: {
    // contentFit 作为 prop 传递，不需要在 style 中定义
  },
  drawerContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    minHeight: DRAWER_HEIGHT,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  aiIconContainer: {
    backgroundColor: '#F3F0FF',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
})
