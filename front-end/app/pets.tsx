import { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useLocalSearchParams } from 'expo-router'
import { petService, Pet, CreatePetData } from '../services/pet.service'
import { useDialog } from '../components/ui/DialogProvider'
import { pickAndSaveImage } from '../utils/image-picker'

export default function PetsScreen() {
  const { action } = useLocalSearchParams<{ action?: string }>()
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingPet, setEditingPet] = useState<Pet | null>(null)
  const { showDialog } = useDialog()

  // Form state
  const [name, setName] = useState('')
  const [species, setSpecies] = useState<'cat' | 'dog' | 'other'>('cat')
  const [breed, setBreed] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'unknown'>('unknown')
  const [weight, setWeight] = useState('')
  const [avatarUri, setAvatarUri] = useState<string | null>(null)

  useEffect(() => {
    loadPets()
  }, [])

  useEffect(() => {
    if (action === 'add') {
      openAddModal()
    }
  }, [action])

  const loadPets = async () => {
    try {
      const data = await petService.getMyPets()
      setPets(data)
    } catch (error) {
      showDialog({ title: '错误', message: '加载宠物列表失败' })
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    resetForm()
    setEditingPet(null)
    setAvatarUri(null)
    setModalVisible(true)
  }

  const openEditModal = (pet: Pet) => {
    setEditingPet(pet)
    setName(pet.name)
    setSpecies(pet.species)
    setBreed(pet.breed || '')
    setGender(pet.gender || 'unknown')
    setWeight(pet.weight?.toString() || '')
    setAvatarUri(pet.avatarUrl || null)
    setModalVisible(true)
  }

  const resetForm = () => {
    setName('')
    setSpecies('cat')
    setBreed('')
    setGender('unknown')
    setWeight('')
    setAvatarUri(null)
  }

  const handlePickAvatar = async () => {
    const nextUri = await pickAndSaveImage({ aspect: [1, 1], prefix: 'pet-avatar' })
    if (!nextUri) {
      showDialog({ title: '提示', message: '未选择图片' })
      return
    }
    setAvatarUri(nextUri)
  }

  const handleSave = async () => {
    if (!name) {
      showDialog({ title: '错误', message: '请输入宠物名称' })
      return
    }

    const petData: CreatePetData = {
      name,
      species,
      breed: breed || undefined,
      gender: gender || undefined,
      weight: weight ? parseFloat(weight) : undefined,
      avatarUrl: avatarUri || undefined
    }

    try {
      if (editingPet) {
        await petService.updatePet(editingPet.id, petData)
      } else {
        await petService.createPet(petData)
      }
      setModalVisible(false)
      loadPets()
    } catch (error) {
      showDialog({ title: '错误', message: '保存宠物信息失败' })
    }
  }

  const handleDelete = (pet: Pet) => {
    showDialog({
      title: '删除宠物',
      message: `确定要删除 ${pet.name} 吗？`,
      confirmText: '删除',
      cancelText: '取消',
      showCancel: true,
      onConfirm: async () => {
        try {
          await petService.deletePet(pet.id)
          loadPets()
        } catch (error) {
          showDialog({ title: '错误', message: '删除宠物失败' })
        }
      }
    })
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.headerCard}>
          <Text style={styles.title}>我的宠物</Text>
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Ionicons name="add-circle" size={30} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        {pets.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="paw-outline" size={60} color="#cbd5f5" />
            <Text style={styles.emptyText}>还没有宠物</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={openAddModal}>
              <Text style={styles.primaryButtonText}>添加第一只宠物</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={pets}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.petCard}>
                <View style={styles.petCardHeader}>
                  <View style={styles.petInfoRow}>
                    <View style={styles.petAvatar}>
                      <Image
                        source={
                          item.avatarUrl
                            ? { uri: item.avatarUrl }
                            : require('../assets/images/default_avatar.webp')
                        }
                        style={styles.petAvatarImage}
                        contentFit="cover"
                      />
                    </View>
                    <View>
                      <Text style={styles.petName}>{item.name}</Text>
                      <Text style={styles.petDetails}>
                        {item.species === 'cat'
                          ? '猫'
                          : item.species === 'dog'
                          ? '狗'
                          : '其他'}{' '}
                        • {item.breed || '未知品种'}
                      </Text>
                      {item.weight && (
                        <Text style={styles.petDetails}>体重：{item.weight}kg</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.petActions}>
                    <TouchableOpacity onPress={() => openEditModal(item)}>
                      <Ionicons name="create-outline" size={24} color="#6366f1" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item)}>
                      <Ionicons name="trash-outline" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />
        )}

        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {editingPet ? '编辑宠物' : '添加新宠物'}
                  </Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close-circle" size={32} color="#9ca3af" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>头像</Text>
                  <View style={styles.avatarRow}>
                    <View style={styles.avatarPreview}>
                      <Image
                        source={
                          avatarUri
                            ? { uri: avatarUri }
                            : require('../assets/images/default_avatar.webp')
                        }
                        style={styles.avatarPreviewImage}
                        contentFit="cover"
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.avatarButton}
                      onPress={handlePickAvatar}
                    >
                      <Text style={styles.avatarButtonText}>选择头像</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>名称 *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="宠物名称"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>物种 *</Text>
                  <View style={styles.speciesButtons}>
                    {[
                      { key: 'cat', label: '猫' },
                      { key: 'dog', label: '狗' },
                      { key: 'other', label: '其他' }
                    ].map((s) => (
                      <TouchableOpacity
                        key={s.key}
                        style={[
                          styles.speciesButton,
                          species === s.key && styles.speciesButtonActive
                        ]}
                        onPress={() => setSpecies(s.key as 'cat' | 'dog' | 'other')}
                      >
                        <Text
                          style={[
                            styles.speciesButtonText,
                            species === s.key && styles.speciesButtonTextActive
                          ]}
                        >
                          {s.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>品种</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="品种（选填）"
                    value={breed}
                    onChangeText={setBreed}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>性别</Text>
                  <View style={styles.speciesButtons}>
                    {[
                      { key: 'male', label: '公' },
                      { key: 'female', label: '母' },
                      { key: 'unknown', label: '未知' }
                    ].map((g) => (
                      <TouchableOpacity
                        key={g.key}
                        style={[
                          styles.speciesButton,
                          gender === g.key && styles.speciesButtonActive
                        ]}
                        onPress={() => setGender(g.key as 'male' | 'female' | 'unknown')}
                      >
                        <Text
                          style={[
                            styles.speciesButtonText,
                            gender === g.key && styles.speciesButtonTextActive
                          ]}
                        >
                          {g.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>体重 (kg)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="体重（选填）"
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="decimal-pad"
                  />
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>
                    {editingPet ? '更新宠物' : '添加宠物'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f6fb'
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f6fb'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb'
  },
  headerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    margin: 16,
    marginBottom: 6,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827'
  },
  addButton: {
    padding: 4
  },
  emptyCard: {
    margin: 16,
    padding: 24,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 20
  },
  primaryButton: {
    backgroundColor: '#455af7',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  listContent: {
    padding: 16
  },
  petCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3
  },
  petCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  petInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  petAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#f3f4f6',
    overflow: 'hidden'
  },
  petAvatarImage: {
    width: '100%',
    height: '100%'
  },
  petName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 5
  },
  petDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2
  },
  petActions: {
    flexDirection: 'row',
    gap: 15
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827'
  },
  inputContainer: {
    marginBottom: 20
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  avatarPreview: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f3f4f6',
    overflow: 'hidden'
  },
  avatarPreviewImage: {
    width: '100%',
    height: '100%'
  },
  avatarButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f3f4f6'
  },
  avatarButtonText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600'
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827'
  },
  speciesButtons: {
    flexDirection: 'row',
    gap: 10
  },
  speciesButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center'
  },
  speciesButtonActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5'
  },
  speciesButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280'
  },
  speciesButtonTextActive: {
    color: '#fff'
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
})
