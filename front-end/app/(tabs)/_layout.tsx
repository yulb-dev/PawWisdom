import { Tabs, router } from 'expo-router'
import { StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { useAuthStore } from '../../store/auth.store'

export default function TabLayout() {
  const { isAuthenticated } = useAuthStore()

  return (
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
  )
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopColor: '#f1f1f1',
    backgroundColor: '#ffffff'
  },
  tabIcon: {
    // contentFit 作为 prop 传递，不需要在 style 中定义
  }
})
