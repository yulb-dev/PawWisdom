import * as ImagePicker from 'expo-image-picker'
import { Platform } from 'react-native'

// 动态导入file system，避免在Web平台出错
let FileSystem: any = null
if (Platform.OS !== 'web') {
  try {
    FileSystem = require('expo-file-system/legacy')
  } catch (error) {
    console.warn('Failed to load expo-file-system:', error)
  }
}

const getUploadsDir = () => {
  if (Platform.OS === 'web' || !FileSystem?.documentDirectory) {
    return null
  }
  return `${FileSystem.documentDirectory}uploads/`
}

const ensureUploadsDir = async () => {
  if (Platform.OS === 'web' || !FileSystem) {
    return
  }

  const UPLOADS_DIR = getUploadsDir()
  if (!UPLOADS_DIR) return

  try {
    await FileSystem.makeDirectoryAsync(UPLOADS_DIR, { intermediates: true })
  } catch (error: any) {
    // 目录已存在，忽略错误
    if (!error.message?.includes('already exists')) {
      throw error
    }
  }
}

const getFileExtension = (uri: string) => {
  const cleanUri = uri.split('?')[0]
  const parts = cleanUri.split('.')
  return parts.length > 1 ? parts[parts.length - 1] : 'jpg'
}

export const saveImageToLocal = async (uri: string, prefix: string) => {
  // Web平台直接返回原始URI
  if (Platform.OS === 'web' || !FileSystem) {
    return uri
  }

  const UPLOADS_DIR = getUploadsDir()
  if (!UPLOADS_DIR) {
    return uri
  }

  await ensureUploadsDir()
  const extension = getFileExtension(uri)
  const filename = `${prefix}-${Date.now()}.${extension}`
  const destination = `${UPLOADS_DIR}${filename}`
  await FileSystem.copyAsync({ from: uri, to: destination })
  return destination
}

export const pickAndSaveImage = async ({
  aspect,
  prefix
}: {
  aspect: [number, number]
  prefix: string
}) => {
  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      throw new Error('需要相册权限才能选择图片')
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect,
      quality: 0.9
    })

    if (result.canceled || !result.assets?.[0]?.uri) {
      return null
    }

    return await saveImageToLocal(result.assets[0].uri, prefix)
  } catch (error) {
    console.error('选择图片失败:', error)
    throw error
  }
}
