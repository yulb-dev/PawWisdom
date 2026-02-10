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
            <Ionicons name="chevron-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? '编辑宠物' : '添加宠物'}</Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 120 + insets.bottom }
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarContainer} onPress={handlePickAvatar}>
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
                <View style={styles.avatarOverlay}>
                  <Ionicons name="camera" size={28} color="#ffffff" />
                </View>
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>点击选择头像</Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                宠物名称 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="给你的宠物起个名字"
                placeholderTextColor="#9ca3af"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                物种 <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.selectorRow}>
                {[
                  { key: 'cat', label: '猫', icon: '🐱' },
                  { key: 'dog', label: '狗', icon: '🐶' },
                  { key: 'other', label: '其他', icon: '🐾' }
                ].map((s) => (
                  <TouchableOpacity
                    key={s.key}
                    style={[
                      styles.selectorButton,
                      species === s.key && styles.selectorButtonActive
                    ]}
                    onPress={() => setSpecies(s.key as 'cat' | 'dog' | 'other')}
                  >
                    <Text style={styles.selectorIcon}>{s.icon}</Text>
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>品种</Text>
              <TextInput
                style={styles.input}
                placeholder="例如：英国短毛猫、金毛"
                placeholderTextColor="#9ca3af"
                value={breed}
                onChangeText={setBreed}
              />
            </View>

            <View style={styles.inputGroup}>
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>生日</Text>
              <TouchableOpacity
                style={styles.inputTouchable}
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
                <Text style={[styles.inputText, !birthday && styles.inputPlaceholder]}>
                  {birthday || '选择宠物的生日'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>体重 (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="输入体重，例如：5.5"
                placeholderTextColor="#9ca3af"
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons name="checkmark" size={24} color="#ffffff" />
            )}
            <Text style={styles.saveButtonText}>{saving ? '保存中...' : '保存'}</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: '#fafafa'
  },
  container: {
    flex: 1,
    backgroundColor: '#fafafa'
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: -0.5
  },
  scrollContent: {
    paddingBottom: 120
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  avatarContainer: {
    marginBottom: 12
  },
  avatarPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f3f4f6',
    overflow: 'hidden',
    position: 'relative'
  },
  avatarPreviewImage: {
    width: '100%',
    height: '100%'
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarHint: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500'
  },
  formSection: {
    paddingHorizontal: 20,
    paddingTop: 24
  },
  inputGroup: {
    marginBottom: 24
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10
  },
  required: {
    color: '#ef4444'
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1f2937'
  },
  inputTouchable: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  inputText: {
    color: '#1f2937',
    fontSize: 15
  },
  inputPlaceholder: {
    color: '#9ca3af'
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 12
  },
  selectorButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    gap: 6
  },
  selectorButtonActive: {
    backgroundColor: '#f97316',
    borderColor: '#f97316'
  },
  selectorIcon: {
    fontSize: 20
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280'
  },
  selectorTextActive: {
    color: '#ffffff'
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  saveButton: {
    backgroundColor: '#f97316',
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center'
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  modalButtonCancel: {
    backgroundColor: '#f3f4f6'
  },
  modalButtonConfirm: {
    backgroundColor: '#f97316'
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280'
  },
  modalButtonTextConfirm: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff'
  }
})
