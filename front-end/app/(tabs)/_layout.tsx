import { Tabs, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../store/auth.store'

export default function TabLayout() {
  const { isAuthenticated } = useAuthStore()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        headerShown: false
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="pets"
        options={{
          title: '宠物',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="paw-outline" size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
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
