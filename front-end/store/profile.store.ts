import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type ProfileGender = 'male' | 'female' | 'secret'

const defaultProfile = {
  username: '',
  signature: '',
  birthday: '',
  email: '',
  education: '',
  occupation: '',
  gender: 'secret' as ProfileGender,
  avatarUri: null,
  backgroundUri: null,
  followers: 0,
  following: 0
}

interface ProfileState {
  username: string
  signature: string
  birthday: string
  email: string
  education: string
  occupation: string
  gender: ProfileGender
  avatarUri: string | null
  backgroundUri: string | null
  followers: number
  following: number
  updateProfile: (
    data: Partial<Omit<ProfileState, 'updateProfile' | 'resetProfile'>>
  ) => void
  resetProfile: () => void
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      ...defaultProfile,
      updateProfile: (data) => set((state) => ({ ...state, ...data })),
      resetProfile: () => set({ ...defaultProfile })
    }),
    {
      name: 'pawwisdom-profile',
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
)
