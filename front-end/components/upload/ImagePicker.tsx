import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as ImagePickerExpo from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export interface SelectedImage {
  uri: string;
  type: 'image' | 'video';
  name?: string;
  size?: number;
}

interface ImagePickerProps {
  maxImages?: number;
  onImagesSelected?: (images: SelectedImage[]) => void;
  initialImages?: SelectedImage[];
}

export default function ImagePicker({
  maxImages = 9,
  onImagesSelected,
  initialImages = [],
}: ImagePickerProps) {
  const [images, setImages] = useState<SelectedImage[]>(initialImages);
  const [loading, setLoading] = useState(false);

  // 请求相机权限
  const requestCameraPermission = async () => {
    const { status } = await ImagePickerExpo.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('需要相机权限', '请在设置中允许访问相机');
      return false;
    }
    return true;
  };

  // 请求相册权限
  const requestMediaLibraryPermission = async () => {
    const { status } =
      await ImagePickerExpo.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('需要相册权限', '请在设置中允许访问相册');
      return false;
    }
    return true;
  };

  // 从相册选择
  const pickFromGallery = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    try {
      setLoading(true);
      const result = await ImagePickerExpo.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        selectionLimit: maxImages - images.length,
        quality: 0.8,
        videoMaxDuration: 60, // 最长60秒
      });

      if (!result.canceled && result.assets) {
        const newImages: SelectedImage[] = result.assets.map((asset) => ({
          uri: asset.uri,
          type: asset.type === 'video' ? 'video' : 'image',
          name: asset.fileName,
          size: asset.fileSize,
        }));

        const updatedImages = [...images, ...newImages].slice(0, maxImages);
        setImages(updatedImages);
        onImagesSelected?.(updatedImages);
      }
    } catch (error) {
      console.error('选择图片失败:', error);
      Alert.alert('错误', '选择图片失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 拍照
  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      setLoading(true);
      const result = await ImagePickerExpo.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets) {
        const newImage: SelectedImage = {
          uri: result.assets[0].uri,
          type: 'image',
          name: result.assets[0].fileName,
          size: result.assets[0].fileSize,
        };

        const updatedImages = [...images, newImage].slice(0, maxImages);
        setImages(updatedImages);
        onImagesSelected?.(updatedImages);
      }
    } catch (error) {
      console.error('拍照失败:', error);
      Alert.alert('错误', '拍照失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 删除图片
  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesSelected?.(updatedImages);
  };

  // 显示选择选项
  const showPickerOptions = () => {
    Alert.alert('选择图片', '请选择图片来源', [
      {
        text: '拍照',
        onPress: takePhoto,
      },
      {
        text: '从相册选择',
        onPress: pickFromGallery,
      },
      {
        text: '取消',
        style: 'cancel',
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {images.map((image, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image source={{ uri: image.uri }} style={styles.image} />
            {image.type === 'video' && (
              <View style={styles.videoIndicator}>
                <Ionicons name="play-circle" size={32} color="white" />
              </View>
            )}
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeImage(index)}
            >
              <Ionicons name="close-circle" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}

        {images.length < maxImages && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={showPickerOptions}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#666" />
            ) : (
              <>
                <Ionicons name="add" size={32} color="#666" />
                <Text style={styles.addButtonText}>
                  {images.length === 0 ? '添加图片' : `${images.length}/${maxImages}`}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 4,
  },
  imageContainer: {
    width: 100,
    height: 100,
    marginHorizontal: 4,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  videoIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
  },
  addButton: {
    width: 100,
    height: 100,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  addButtonText: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
});
