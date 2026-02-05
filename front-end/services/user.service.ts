import { api } from '../config/api.config'
import { User } from './auth.service'
import { Pet } from './pet.service'

export interface UserProfile extends User {
  pets: Pet[]
}

export interface UpdateUserData {
  username?: string
  phone?: string
  email?: string
  avatarUrl?: string
  backgroundUrl?: string
  signature?: string
  birthday?: string
  gender?: 'male' | 'female' | 'secret'
  education?: string
  occupation?: string
}

class UserService {
  async getProfile(): Promise<UserProfile> {
    const response = await api.get<UserProfile>('/users/profile')
    return response.data
  }

  async updateProfile(data: UpdateUserData): Promise<User> {
    const response = await api.patch<User>('/users/profile', data)
    return response.data
  }

  async deleteAccount(): Promise<void> {
    await api.delete('/users/profile')
  }
}

export const userService = new UserService()
