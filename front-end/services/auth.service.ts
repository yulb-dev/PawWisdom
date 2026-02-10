import { api } from '../config/api.config'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface RegisterData {
  email: string
  phone?: string
  password: string
}

export interface LoginData {
  identifier: string
  password: string
}

export interface User {
  id: string
  username: string
  nickname?: string
  email: string
  phone?: string
  avatarUrl?: string
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface WechatLoginData {
  openId: string
}

export interface WechatCodeData {
  code: string
}

export interface PhoneCodeData {
  phone: string
}

export interface PhoneLoginData {
  phone: string
  code: string
}

class AuthService {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data)
    await AsyncStorage.setItem('auth_token', response.data.token)
    return response.data
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data)
    await AsyncStorage.setItem('auth_token', response.data.token)
    return response.data
  }

  async wechatLogin(data: WechatLoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/wechat', data)
    await AsyncStorage.setItem('auth_token', response.data.token)
    return response.data
  }

  async wechatCodeLogin(data: WechatCodeData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/wechat/code', data)
    await AsyncStorage.setItem('auth_token', response.data.token)
    return response.data
  }

  async sendPhoneCode(data: PhoneCodeData): Promise<{ success: boolean }> {
    const response = await api.post<{ success: boolean }>('/auth/phone/code', data)
    return response.data
  }

  async phoneLogin(data: PhoneLoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/phone/login', data)
    await AsyncStorage.setItem('auth_token', response.data.token)
    return response.data
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('auth_token')
  }

  async getMe(): Promise<User> {
    const response = await api.get<User>('/auth/me')
    return response.data
  }

  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('auth_token')
  }
}

export const authService = new AuthService()
