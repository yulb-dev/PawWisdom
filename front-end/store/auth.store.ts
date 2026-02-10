import { create } from 'zustand'
import { RegisterData, User } from '../services/auth.service'

interface PendingRegisterData extends RegisterData {
  phone?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  pendingRegister: PendingRegisterData | null
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setPendingRegister: (data: PendingRegisterData | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  pendingRegister: null,
  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user
    }),
  setToken: (token) =>
    set({
      token
    }),
  setPendingRegister: (data) =>
    set({
      pendingRegister: data
    }),
  logout: () =>
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      pendingRegister: null
    })
}))
