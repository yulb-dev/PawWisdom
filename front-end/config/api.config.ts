import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import { Platform } from 'react-native'

const getDevServerHost = () => {
  // 优先使用 expoConfig.hostUri (SDK 50+)
  const hostUri = Constants.expoConfig?.hostUri
  if (!hostUri) {
    return null
  }
  return hostUri.split(':')[0]
}

const getDefaultApiBaseUrl = () => {
  const devHost = getDevServerHost()
  if (devHost) {
    return `http://${devHost}:3000/api`
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api'
  }
  return 'http://localhost:3000/api'
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || getDefaultApiBaseUrl()

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 增加到 30 秒，适应文件上传等耗时操作
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('auth_token')
      // You can redirect to login here
    }
    return Promise.reject(error)
  }
)
