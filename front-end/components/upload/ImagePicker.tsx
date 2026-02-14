import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import * as ImagePickerExpo from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import VideoCoverPicker from './VideoCoverPicker';

export interface SelectedImage {
  uri: string;
  type: 'image' | 'video';
  name?: string;
  size?: number;
  coverUri?: string; // 视频封面URI
}

interface ImagePickerProps {
  maxImages?: number;
  onImagesSelected?: (images: SelectedImage[]) => void;
  initialImages?: SelectedImage[];
  allowVideo?: boolean;
  onVideoCoverSelect?: (videoUri: string, coverUri: string) => void;
}

export default function ImagePicker({
  maxImages = 6,
  onImagesSelected,
  initialImages = [],
  allowVideo = true,
  onVideoCoverSelect,
}: ImagePickerProps) {
  const [images, setImages] = useState<SelectedImage[]>(initialImages);
  const [loading, setLoading] = useState(false);
  const [needsCoverSelection, setNeedsCoverSelection] = useState(false);
  const [pendingVideoUri, setPendingVideoUri] = useState<string | null>(null);

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  const mode = useMemo<'image' | 'video' | null>(() => {
    if (images.length === 0) return null;
    return images.some((item) => item.type === 'video') ? 'video' : 'image';
  }, [images]);

  const hasVideo = mode === 'video';

  const updateSelection = (nextImages: SelectedImage[]) => {
    setImages(nextImages);
    onImagesSelected?.(nextImages);
  };

  const normalizeSelectedAssets = (
    selectedAssets: ImagePickerExpo.ImagePickerAsset[],
  ): SelectedImage[] =>
    selectedAssets.map((asset) => ({
      uri: asset.uri,
      type: asset.type === 'video' ? 'video' : 'image',
      name: asset.fileName,
      size: asset.fileSize,
    }));

  const validateAndMergeSelection = (newItems: SelectedImage[]): SelectedImage[] => {
    if (newItems.length === 0) return images;

    const hasSelectedVideo = newItems.some((item) => item.type === 'video');
    const hasSelectedImage = newItems.some((item) => item.type === 'image');

    if (hasSelectedVideo && hasSelectedImage) {
      Alert.alert('提示', '不支持同时选择图片和视频');
      return images;
    }

    if (hasSelectedVideo) {
      if (!allowVideo) {
        Alert.alert('提示', '当前不支持选择视频');
        return images;
      }
      if (mode === 'image') {
        Alert.alert('提示', '已选择图片，不能再添加视频');
        return images;
      }

      const combinedVideos = [...images, ...newItems].filter(
        (item) => item.type === 'video',
      );
      if (combinedVideos.length > 1) {
        Alert.alert('提示', '仅支持选择一个视频');
        return images;
      }
      return [combinedVideos[0]];
    }

    if (mode === 'video') {
      Alert.alert('提示', '已选择视频，不能再添加图片');
      return images;
    }

    return [...images, ...newItems]
      .filter((item) => item.type === 'image')
      .slice(0, maxImages);
  };

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
        mediaTypes: allowVideo 
          ? ImagePickerExpo.MediaTypeOptions.All 
          : ImagePickerExpo.MediaTypeOptions.Images,
        allowsMultipleSelection: !hasVideo,
        selectionLimit: hasVideo ? 1 : Math.max(1, maxImages - images.length),
        quality: 0.8,
        videoMaxDuration: 60, // 最长60秒
        videoQuality: ImagePickerExpo.UIImagePickerControllerQualityType.High,
      });

      if (!result.canceled && result.assets) {
        const normalized = normalizeSelectedAssets(result.assets);
        const updatedImages = validateAndMergeSelection(normalized);
        
        // 检查是否选择了视频,需要选择封面
        const selectedVideo = normalized.find(item => item.type === 'video');
        if (selectedVideo && onVideoCoverSelect) {
          setPendingVideoUri(selectedVideo.uri);
          setNeedsCoverSelection(true);
        } else {
          updateSelection(updatedImages);
        }
      }
    } catch (error) {
      console.error('选择媒体失败:', error);
      Alert.alert('错误', '选择媒体失败，请重试');
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
        mediaTypes: ImagePickerExpo.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets) {
        const normalized = normalizeSelectedAssets(result.assets);
        const updatedImages = validateAndMergeSelection(normalized);
        updateSelection(updatedImages);
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
    updateSelection(updatedImages);
  };

  // 显示选择选项
  const showPickerOptions = () => {
    Alert.alert('选择媒体', '请选择媒体来源', [
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

  const handleCoverSelected = (coverUri: string) => {
    if (pendingVideoUri && onVideoCoverSelect) {
      onVideoCoverSelect(pendingVideoUri, coverUri);
      const videoItem: SelectedImage = {
        uri: pendingVideoUri,
        type: 'video',
        coverUri: coverUri,
      };
      updateSelection([videoItem]);
    }
    setNeedsCoverSelection(false);
    setPendingVideoUri(null);
  };

  const handleCoverSelectionClose = () => {
    setNeedsCoverSelection(false);
    setPendingVideoUri(null);
  };

  const handleEditVideoCover = (videoUri: string) => {
    setPendingVideoUri(videoUri);
    setNeedsCoverSelection(true);
  };

  return (
    <>
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {images.map((image, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image 
                source={{ uri: image.type === 'video' && image.coverUri ? image.coverUri : image.uri }} 
                style={styles.image} 
              />
              {image.type === 'video' && (
                <View style={styles.videoIndicator}>
                  <Ionicons name="play-circle" size={32} color="white" />
                  <TouchableOpacity
                    style={styles.editCoverButton}
                    onPress={() => handleEditVideoCover(image.uri)}
                  >
                    <Text style={styles.editCoverButtonText}>编辑封面</Text>
                  </TouchableOpacity>
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
                    {images.length === 0
                      ? '添加图片/视频'
                      : hasVideo
                        ? '1/1 视频'
                        : `${images.length}/${maxImages} 图片`}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* 视频封面选择Modal */}
      <Modal
        visible={needsCoverSelection && !!pendingVideoUri}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        {pendingVideoUri && (
          <VideoCoverPicker
            videoUri={pendingVideoUri}
            onCoverSelected={handleCoverSelected}
            onClose={handleCoverSelectionClose}
          />
        )}
      </Modal>
    </>
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
  editCoverButton: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingVertical: 4,
    alignItems: 'center',
  },
  editCoverButtonText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
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
