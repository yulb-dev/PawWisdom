import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useDialog } from '../../components/ui/DialogProvider'
import { useAuthStore } from '../../store/auth.store'
import { useProfileStore, ProfileGender } from '../../store/profile.store'
import { pickAndSaveImage } from '../../utils/image-picker'
import { userService } from '../../services/user.service'
import { Ionicons } from '@expo/vector-icons'

export default function ProfileEditScreen() {
  const { showDialog } = useDialog()
  const profile = useProfileStore()
  const { user } = useAuthStore()
  const insets = useSafeAreaInsets()
  const [nickname, setNickname] = useState(() => profile.username || user?.nickname || '')
  const [signature, setSignature] = useState(profile.signature || '')
  const [birthday, setBirthday] = useState(profile.birthday)
  const [email, setEmail] = useState(profile.email || '')
  const [education, setEducation] = useState(profile.education || '')
  const [occupation, setOccupation] = useState(profile.occupation || '')
  const [gender, setGender] = useState<ProfileGender>(
    profile.gender === 'male' ||
      profile.gender === 'female' ||
      profile.gender === 'secret'
      ? profile.gender
      : 'secret'
  )
  const [avatarUri, setAvatarUri] = useState<string | null>(profile.avatarUri)
  const [backgroundUri, setBackgroundUri] = useState<string | null>(profile.backgroundUri)

  const [saving, setSaving] = useState(false)
  const [genderPickerVisible, setGenderPickerVisible] = useState(false)
  const [educationPickerVisible, setEducationPickerVisible] = useState(false)
  const [birthdayPickerVisible, setBirthdayPickerVisible] = useState(false)
  const [birthdayDraft, setBirthdayDraft] = useState<Date>(() => {
    if (birthday) {
      const parsed = new Date(birthday)
      if (!Number.isNaN(parsed.getTime())) {
        return parsed
      }
    }
    return new Date()
  })

  const educationOptions = useMemo(
    () => ['小学', '初中', '高中', '专科', '本科', '硕士', '博士', '其他'],
    []
  )
  const genderOptions = useMemo(
    () => [
      { label: '男', value: 'male' as ProfileGender },
      { label: '女', value: 'female' as ProfileGender },
      { label: '保密', value: 'secret' as ProfileGender }
    ],
    []
  )

  const handlePickAvatar = async () => {
    try {
      const nextUri = await pickAndSaveImage({ aspect: [1, 1], prefix: 'user-avatar' })
      if (nextUri) {
        setAvatarUri(nextUri)
      }
    } catch (error) {
      showDialog({ title: '错误', message: '选择图片失败，请重试' })
    }
  }

  const handlePickBackground = async () => {
    try {
      const nextUri = await pickAndSaveImage({
        aspect: [16, 9],
        prefix: 'user-background'
      })
      if (nextUri) {
        setBackgroundUri(nextUri)
      }
    } catch (error) {
      showDialog({ title: '错误', message: '选择图片失败，请重试' })
    }
  }

  const formatBirthday = (date: Date) => date.toISOString().slice(0, 10)

  const handleSave = async () => {
    if (!nickname.trim()) {
      showDialog({ title: '错误', message: '请输入昵称' })
      return
    }

    if (email.trim()) {
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
      if (!emailRegex.test(email.trim())) {
        showDialog({ title: '错误', message: '请输入有效的邮箱地址' })
        return
      }
    }

    if (saving) {
      return
    }

    setSaving(true)

    profile.updateProfile({
      username: nickname.trim(),
      signature: signature.trim(),
      birthday: birthday.trim(),
      email: email.trim(),
      education: education.trim(),
      occupation: occupation.trim(),
      gender,
      avatarUri,
      backgroundUri
    })

    try {
      await userService.updateProfile({
        nickname: nickname.trim(),
        email: email.trim() || undefined,
        avatarUrl: avatarUri || undefined,
        backgroundUrl: backgroundUri || undefined,
        signature: signature.trim() || undefined,
        birthday: birthday.trim() || undefined,
        gender,
        education: education.trim() || undefined,
        occupation: occupation.trim() || undefined
      })
    } catch (error) {
      showDialog({
        title: '提示',
        message: '已保存到本地，稍后同步到服务器',
        onConfirm: () => router.back()
      })
      setSaving(false)
      return
    }

    showDialog({
      title: '成功',
      message: '个人资料已更新',
      onConfirm: () => router.back()
    })
    setSaving(false)
  }

  const genderMap = {
    male: '男',
    female: '女',
    secret: '保密'
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 5 }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>个人信息</Text>
        <TouchableOpacity
          style={[styles.headerButton, styles.headerSaveButton]}
          onPress={handleSave}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          disabled={saving}
        >
          {saving ? <ActivityIndicator size="small" color="#111111" /> : null}
          <Text style={styles.saveText}>{saving ? '保存中...' : '保存'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 64 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.section}>
            <TouchableOpacity style={styles.row} onPress={handlePickAvatar}>
              <Text style={styles.rowLabel}>头像与头像框</Text>
              <View style={styles.rowRight}>
                <View style={styles.avatarSmall}>
                  <Image
                    source={
                      avatarUri
                        ? { uri: avatarUri }
                        : require('../../assets/images/default_avatar.webp')
                    }
                    style={styles.avatarImage}
                    contentFit="cover"
                  />
                </View>
              </View>
            </TouchableOpacity>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>昵称</Text>
              <TextInput
                style={styles.rowInput}
                value={nickname}
                onChangeText={setNickname}
                placeholder="请设置昵称"
                placeholderTextColor="#c0c4cc"
              />
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>爪印号</Text>
              <Text style={styles.rowValue}>{user?.username || '--'}</Text>
            </View>
            <View style={[styles.row, styles.rowMultiline]}>
              <Text style={styles.rowLabel}>个性签名</Text>
              <TextInput
                style={[styles.rowInput, styles.rowInputMultiline]}
                value={signature}
                onChangeText={setSignature}
                placeholder="添加点介绍吧..."
                placeholderTextColor="#c0c4cc"
                multiline
              />
            </View>
            <TouchableOpacity style={styles.row} onPress={handlePickBackground}>
              <Text style={styles.rowLabel}>背景图</Text>
              <View style={styles.rowRight}>
                <View style={styles.backgroundPreview}>
                  <Image
                    source={
                      backgroundUri
                        ? { uri: backgroundUri }
                        : require('../../assets/images/default_background.jpg')
                    }
                    style={styles.backgroundPreviewImage}
                    contentFit="cover"
                  />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => setGenderPickerVisible(true)}
            >
              <Text style={styles.rowLabel}>性别</Text>
              <Text style={styles.rowValue}>{genderMap[gender]}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.row}
              onPress={() => {
                setBirthdayDraft(() => {
                  if (birthday) {
                    const parsed = new Date(birthday)
                    if (!Number.isNaN(parsed.getTime())) {
                      return parsed
                    }
                  }
                  return new Date()
                })
                setBirthdayPickerVisible(true)
              }}
            >
              <Text style={styles.rowLabel}>生日</Text>
              <Text style={styles.rowValue}>{birthday || '请设置生日'}</Text>
            </TouchableOpacity>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>邮箱</Text>
              <TextInput
                style={styles.rowInput}
                value={email}
                onChangeText={setEmail}
                placeholder="请设置邮箱"
                placeholderTextColor="#c0c4cc"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={styles.row}
              onPress={() => setEducationPickerVisible(true)}
            >
              <Text style={styles.rowLabel}>教育经历</Text>
              <Text style={styles.rowValue}>{education || '请设置教育经历'}</Text>
            </TouchableOpacity>

            <View style={[styles.row, styles.rowLast]}>
              <Text style={styles.rowLabel}>职业</Text>
              <TextInput
                style={styles.rowInput}
                value={occupation}
                onChangeText={setOccupation}
                placeholder="请设置职业"
                placeholderTextColor="#c0c4cc"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={genderPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGenderPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContent}>
            <Text style={styles.modalTitle}>选择性别</Text>
            <View style={styles.pickerList}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {genderOptions.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={styles.pickerItem}
                    onPress={() => {
                      setGender(item.value)
                      setGenderPickerVisible(false)
                    }}
                  >
                    <Text style={styles.pickerItemText}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={() => setGenderPickerVisible(false)}
            >
              <Text style={styles.modalButtonTextCancel}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={educationPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEducationPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContent}>
            <Text style={styles.modalTitle}>选择教育经历</Text>
            {educationOptions.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.pickerItem}
                onPress={() => {
                  setEducation(item)
                  setEducationPickerVisible(false)
                }}
              >
                <Text style={styles.pickerItemText}>{item}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={() => setEducationPickerVisible(false)}
            >
              <Text style={styles.modalButtonTextCancel}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {Platform.OS === 'ios' && (
        <Modal
          visible={birthdayPickerVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setBirthdayPickerVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.pickerContent}>
              <Text style={styles.modalTitle}>选择生日</Text>
              <DateTimePicker
                value={birthdayDraft}
                mode="date"
                display="spinner"
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
      )}

      {Platform.OS !== 'ios' && birthdayPickerVisible && (
        <DateTimePicker
          value={birthdayDraft}
          mode="date"
          display="default"
          onChange={(_, selectedDate) => {
            setBirthdayPickerVisible(false)
            if (selectedDate) {
              setBirthday(formatBirthday(selectedDate))
            }
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fa'
  },
  keyboardAvoiding: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    paddingBottom: 4
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 0,
    minWidth: 44
  },
  headerSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'flex-end'
  },
  backText: {
    fontSize: 24,
    color: '#111111'
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111111'
  },
  saveText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111111',
    textAlign: 'right'
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 40
  },
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 8
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16
  },
  rowMultiline: {
    alignItems: 'flex-start'
  },
  rowLast: {
    borderBottomWidth: 0
  },
  rowLabel: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500'
  },
  rowValue: {
    fontSize: 14,
    color: '#999999',
    maxWidth: '60%',
    textAlign: 'right'
  },
  rowInput: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    color: '#333333',
    paddingVertical: 0
  },
  rowInputMultiline: {
    minHeight: 64,
    textAlignVertical: 'top'
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  backgroundPreview: {
    width: 72,
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5'
  },
  backgroundPreviewImage: {
    width: '100%',
    height: '100%'
  },
  avatarSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5'
  },
  avatarImage: {
    width: '100%',
    height: '100%'
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
    borderRadius: 16,
    padding: 20
  },
  pickerContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    gap: 8
  },
  pickerList: {
    maxHeight: 240
  },
  pickerItem: {
    paddingVertical: 10
  },
  pickerItemText: {
    fontSize: 16,
    color: '#111111',
    textAlign: 'center'
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 16,
    textAlign: 'center'
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111111',
    backgroundColor: '#ffffff',
    marginBottom: 20
  },
  modalInputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top'
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12
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
