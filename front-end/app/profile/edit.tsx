import { useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useDialog } from '../../components/ui/DialogProvider'
import { useProfileStore, ProfileGender } from '../../store/profile.store'
import { pickAndSaveImage } from '../../utils/image-picker'
import { userService } from '../../services/user.service'
import { Ionicons } from '@expo/vector-icons'

export default function ProfileEditScreen() {
  const { showDialog } = useDialog()
  const profile = useProfileStore()
  const insets = useSafeAreaInsets()
  const [username, setUsername] = useState(profile.username)
  const [signature, setSignature] = useState(profile.signature)
  const [birthday, setBirthday] = useState(profile.birthday)
  const [email, setEmail] = useState(profile.email || '')
  const [education, setEducation] = useState(profile.education || '')
  const [occupation, setOccupation] = useState(profile.occupation || '')
  const [gender, setGender] = useState<ProfileGender>(profile.gender)
  const [avatarUri, setAvatarUri] = useState<string | null>(profile.avatarUri)
  const [backgroundUri, setBackgroundUri] = useState<string | null>(profile.backgroundUri)

  const [editingField, setEditingField] = useState<string | null>(null)
  const [tempValue, setTempValue] = useState('')

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

  const openFieldEditor = (field: string, currentValue: string) => {
    setEditingField(field)
    setTempValue(currentValue)
  }

  const closeFieldEditor = () => {
    setEditingField(null)
    setTempValue('')
  }

  const saveFieldValue = () => {
    if (!editingField) return

    switch (editingField) {
      case 'username':
        setUsername(tempValue)
        break
      case 'signature':
        setSignature(tempValue)
        break
      case 'birthday':
        setBirthday(tempValue)
        break
      case 'email':
        setEmail(tempValue)
        break
      case 'education':
        setEducation(tempValue)
        break
      case 'occupation':
        setOccupation(tempValue)
        break
    }
    closeFieldEditor()
  }

  const handleSave = async () => {
    if (!username.trim()) {
      showDialog({ title: '错误', message: '请输入昵称' })
      return
    }

    profile.updateProfile({
      username: username.trim(),
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
        username: username.trim(),
        avatarUrl: avatarUri || undefined
      })
    } catch (error) {
      showDialog({
        title: '提示',
        message: '已保存到本地，稍后同步到服务器',
        onConfirm: () => router.back()
      })
      return
    }

    showDialog({
      title: '成功',
      message: '个人资料已更新',
      onConfirm: () => router.back()
    })
  }

  const genderMap = {
    male: '男',
    female: '女',
    unknown: '未知'
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
          style={styles.headerButton}
          onPress={handleSave}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.saveText}>保存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
          <TouchableOpacity
            style={styles.row}
            onPress={() => openFieldEditor('username', username)}
          >
            <Text style={styles.rowLabel}>昵称</Text>
            <Text style={styles.rowValue}>{username || '请设置昵称'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => openFieldEditor('signature', signature)}
          >
            <Text style={styles.rowLabel}>个性签名</Text>
            <Text style={styles.rowValue} numberOfLines={1}>
              {signature || '请设置个性签名'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.row} onPress={() => {}}>
            <Text style={styles.rowLabel}>性别</Text>
            <Text style={styles.rowValue}>{genderMap[gender]}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => openFieldEditor('birthday', birthday)}
          >
            <Text style={styles.rowLabel}>生日</Text>
            <Text style={styles.rowValue}>{birthday || '请设置生日'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => openFieldEditor('email', email)}
          >
            <Text style={styles.rowLabel}>邮箱</Text>
            <Text style={styles.rowValue} numberOfLines={1}>
              {email || '请设置邮箱'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => openFieldEditor('education', education)}
          >
            <Text style={styles.rowLabel}>教育经历</Text>
            <Text style={styles.rowValue}>{education || '请设置教育经历'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.row, styles.rowLast]}
            onPress={() => openFieldEditor('occupation', occupation)}
          >
            <Text style={styles.rowLabel}>职业</Text>
            <Text style={styles.rowValue}>{occupation || '请设置职业'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={editingField !== null}
        transparent
        animationType="fade"
        onRequestClose={closeFieldEditor}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingField === 'username' && '编辑昵称'}
              {editingField === 'signature' && '编辑个性签名'}
              {editingField === 'birthday' && '编辑生日'}
              {editingField === 'email' && '编辑邮箱'}
              {editingField === 'education' && '编辑教育经历'}
              {editingField === 'occupation' && '编辑职业'}
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                editingField === 'signature' && styles.modalInputMultiline
              ]}
              value={tempValue}
              onChangeText={setTempValue}
              placeholder={
                editingField === 'birthday' ? 'YYYY/MM/DD' : `请输入${editingField}`
              }
              multiline={editingField === 'signature'}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={closeFieldEditor}
              >
                <Text style={styles.modalButtonTextCancel}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={saveFieldValue}
              >
                <Text style={styles.modalButtonTextConfirm}>确定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fa'
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
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
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
