import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { useDialog } from '../../components/ui/DialogProvider'
import { petService, Pet, CreatePetData } from '../../services/pet.service'
import { pickAndSaveImage } from '../../utils/image-picker'

export default function PetEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { showDialog } = useDialog()
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [birthdayPickerVisible, setBirthdayPickerVisible] = useState(false)
  const [birthdayDraft, setBirthdayDraft] = useState<Date>(new Date())

  const [name, setName] = useState('')
  const [species, setSpecies] = useState<'cat' | 'dog' | 'other'>('cat')
  const [breed, setBreed] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'unknown'>('unknown')
  const [weight, setWeight] = useState('')
  const [birthday, setBirthday] = useState('')
  const [avatarUri, setAvatarUri] = useState<string | null>(null)

  const isEditing = Boolean(id)

  useEffect(() => {
    if (id) {
      loadPet(id)
    }
  }, [id])

  const loadPet = async (petId: string) => {
    setLoading(true)
    try {
      const pet = await petService.getPet(petId)
      setName(pet.name)
      setSpecies(pet.species)
      setBreed(pet.breed || '')
      setGender(pet.gender || 'unknown')
      setWeight(pet.weight?.toString() || '')
      setBirthday(pet.birthday || '')
      setAvatarUri(pet.avatarUrl || null)
      if (pet.birthday) {
        const parsed = new Date(pet.birthday)
        if (!Number.isNaN(parsed.getTime())) {
          setBirthdayDraft(parsed)
        }
      }
    } catch (error) {
      showDialog({ title: '错误', message: '加载宠物信息失败' })
    } finally {
      setLoading(false)
    }
  }

  const handlePickAvatar = async () => {
    const nextUri = await pickAndSaveImage({ aspect: [1, 1], prefix: 'pet-avatar' })
    if (!nextUri) {
      showDialog({ title: '提示', message: '未选择图片' })
      return
    }
    setAvatarUri(nextUri)
  }

  const formatBirthday = (date: Date) => date.toISOString().slice(0, 10)

  const handleSave = async () => {
    if (!name.trim()) {
      showDialog({ title: '错误', message: '请输入宠物名称' })
      return
    }

    if (saving) return
    setSaving(true)

    const petData: CreatePetData = {
      name: name.trim(),
      species,
      breed: breed.trim() || undefined,
      gender: gender || undefined,
      birthday: birthday || undefined,
      weight: weight ? parseFloat(weight) : undefined,
      avatarUrl: avatarUri || undefined
    }

    try {
      if (id) {
        await petService.updatePet(id, petData)
      } else {
        await petService.createPet(petData)
      }
      showDialog({
        title: '成功',
        message: isEditing ? '宠物信息已更新' : '宠物已添加',
        onConfirm: () => router.back()
      })
    } catch (error) {
      showDialog({ title: '错误', message: '保存宠物信息失败' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#b65bff" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? '编辑宠物' : '新增宠物'}</Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 120 + insets.bottom }
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.label}>头像</Text>
            <View style={styles.avatarRow}>
              <View style={styles.avatarPreview}>
                <Image
                  source={
                    avatarUri
                      ? { uri: avatarUri }
                      : require('../../assets/images/default_avatar.webp')
                  }
                  style={styles.avatarPreviewImage}
                  contentFit="cover"
                />
              </View>
              <TouchableOpacity style={styles.avatarButton} onPress={handlePickAvatar}>
                <Text style={styles.avatarButtonText}>选择头像</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>名称 *</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入宠物名称"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>物种 *</Text>
            <View style={styles.selectorRow}>
              {[
                { key: 'cat', label: '猫' },
                { key: 'dog', label: '狗' },
                { key: 'other', label: '其他' }
              ].map((s) => (
                <TouchableOpacity
                  key={s.key}
                  style={[
                    styles.selectorButton,
                    species === s.key && styles.selectorButtonActive
                  ]}
                  onPress={() => setSpecies(s.key as 'cat' | 'dog' | 'other')}
                >
                  <Text
                    style={[
                      styles.selectorText,
                      species === s.key && styles.selectorTextActive
                    ]}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>品种</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入品种（选填）"
              value={breed}
              onChangeText={setBreed}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>性别</Text>
            <View style={styles.selectorRow}>
              {[
                { key: 'male', label: '公' },
                { key: 'female', label: '母' },
                { key: 'unknown', label: '未知' }
              ].map((g) => (
                <TouchableOpacity
                  key={g.key}
                  style={[
                    styles.selectorButton,
                    gender === g.key && styles.selectorButtonActive
                  ]}
                  onPress={() => setGender(g.key as 'male' | 'female' | 'unknown')}
                >
                  <Text
                    style={[
                      styles.selectorText,
                      gender === g.key && styles.selectorTextActive
                    ]}
                  >
                    {g.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>生日</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => {
                if (birthday) {
                  const parsed = new Date(birthday)
                  if (!Number.isNaN(parsed.getTime())) {
                    setBirthdayDraft(parsed)
                  }
                }
                setBirthdayPickerVisible(true)
              }}
            >
              <Text style={styles.inputText}>{birthday || '请选择生日'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>体重 (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入体重（选填）"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
            />
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[styles.saveButton, { bottom: insets.bottom + 16 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator size="small" color="#ffffff" /> : null}
          <Text style={styles.saveButtonText}>{saving ? '保存中...' : '保存'}</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={birthdayPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBirthdayPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>选择生日</Text>
            <DateTimePicker
              value={birthdayDraft}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, selectedDate) => {
                if (selectedDate) {
                  setBirthdayDraft(selectedDate)
                }
              }}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setBirthdayPickerVisible(false)}
              >
                <Text style={styles.modalButtonTextCancel}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={() => {
                  setBirthday(formatBirthday(birthdayDraft))
                  setBirthdayPickerVisible(false)
                }}
              >
                <Text style={styles.modalButtonTextConfirm}>确定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff'
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827'
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  avatarPreview: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827'
  },
  inputText: {
    color: '#111827',
    fontSize: 15
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 10
  },
  selectorButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center'
  },
  selectorButtonActive: {
    backgroundColor: '#b65bff',
    borderColor: '#b65bff'
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280'
  },
  selectorTextActive: {
    color: '#ffffff'
  },
  saveButton: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: '#b65bff',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 16,
    textAlign: 'center'
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  modalButtonCancel: {
    backgroundColor: '#f5f5f5'
  },
  modalButtonConfirm: {
    backgroundColor: '#111111'
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666'
  },
  modalButtonTextConfirm: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff'
  }
})
