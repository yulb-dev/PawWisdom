import { api } from '../config/api.config'

export interface Pet {
  id: string
  ownerId: string
  name: string
  species: 'cat' | 'dog' | 'other'
  breed?: string
  birthday?: string
  gender?: 'male' | 'female' | 'unknown'
  weight?: number
  avatarUrl?: string
  createdAt: string
  updatedAt: string
}

export interface CreatePetData {
  name: string
  species: 'cat' | 'dog' | 'other'
  breed?: string
  birthday?: string
  gender?: 'male' | 'female' | 'unknown'
  weight?: number
  avatarUrl?: string
}

export interface UpdatePetData extends Partial<CreatePetData> {}

class PetService {
  async getMyPets(): Promise<Pet[]> {
    const response = await api.get<Pet[]>('/pets')
    return response.data
  }

  async getPet(id: string): Promise<Pet> {
    const response = await api.get<Pet>(`/pets/${id}`)
    return response.data
  }

  async getUserPets(userId: string): Promise<Pet[]> {
    const response = await api.get<Pet[]>(`/pets/user/${userId}`)
    return response.data
  }

  async createPet(data: CreatePetData): Promise<Pet> {
    const response = await api.post<Pet>('/pets', data)
    return response.data
  }

  async updatePet(id: string, data: UpdatePetData): Promise<Pet> {
    const response = await api.patch<Pet>(`/pets/${id}`, data)
    return response.data
  }

  async deletePet(id: string): Promise<void> {
    await api.delete(`/pets/${id}`)
  }
}

export const petService = new PetService()
