import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type ProfileGender = 'male' | 'female' | 'unknown'

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
  updateProfile: (data: Partial<Omit<ProfileState, 'updateProfile'>>) => void
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      username: 'Kate Winslet',
      signature: '狗是唯一会爱你胜过你爱它的动物',
      birthday: '',
      email: '',
      education: '',
      occupation: '',
      gender: 'unknown',
      avatarUri: null,
      backgroundUri: null,
      followers: 9868,
      following: 786,
      updateProfile: (data) => set((state) => ({ ...state, ...data }))
    }),
    {
      name: 'pawwisdom-profile',
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
)
