import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image as RNImage,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import ImagePicker, {
  SelectedImage,
} from '../components/upload/ImagePicker';
import { uploadService } from '../services/upload.service';
import { postService } from '../services/post.service';
import { petService } from '../services/pet.service';

export default function CreatePostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | undefined>();
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [videoCoverUri, setVideoCoverUri] = useState<string | undefined>();

  const { data: myPets = [] } = useQuery({
    queryKey: ['my-pets-for-post'],
    queryFn: () => petService.getMyPets(),
  });

  // 从AI情绪识别页面传来的数据
  const preloadedImageUrl = params.imageUrl as string;
  const emotion = params.emotion as string;
  const confidence = params.confidence as string;
  const description = params.description as string;

  // 初始化内容
  useEffect(() => {
    if (description) {
      setContent(`${description}\n\n`);
    }
    if (emotion) {
      setHashtags([emotion]);
    }
    if (preloadedImageUrl) {
      setSelectedImages([
        { uri: preloadedImageUrl, type: 'image', name: 'ai-analyzed.jpg' },
      ]);
    }
  }, [description, emotion, preloadedImageUrl]);

  // 处理图片选择
  const handleImagesSelected = (images: SelectedImage[]) => {
    setSelectedImages(images);
    // 如果是视频并且有封面,保存封面URI
    const video = images.find(img => img.type === 'video');
    setVideoCoverUri(video?.coverUri);
  };

  // 处理视频封面选择
  const handleVideoCoverSelect = (videoUri: string, coverUri: string) => {
    setVideoCoverUri(coverUri);
  };

  // 添加话题标签
  const handleAddHashtag = () => {
    const tag = hashtagInput.trim();
    if (!tag) return;

    if (hashtags.includes(tag)) {
      Alert.alert('提示', '该话题已存在');
      return;
    }

    if (hashtags.length >= 10) {
      Alert.alert('提示', '最多添加10个话题标签');
      return;
    }

    setHashtags([...hashtags, tag]);
    setHashtagInput('');
  };

  // 删除话题标签
  const handleRemoveHashtag = (index: number) => {
    setHashtags(hashtags.filter((_, i) => i !== index));
  };

  // 从文本中提取话题标签
  const extractHashtagsFromContent = (text: string): string[] => {
    const regex = /#(\S+)/g;
    const matches = text.match(regex);
    if (!matches) return [];

    return matches.map((match) => match.substring(1));
  };

  // 发布动态
  const handlePublish = async () => {
    if (!content.trim() && selectedImages.length === 0) {
      Alert.alert('提示', '请输入内容或上传媒体');
      return;
    }

    const hasVideo = selectedImages.some((item) => item.type === 'video');
    const hasImage = selectedImages.some((item) => item.type === 'image');
    if (hasVideo && hasImage) {
      Alert.alert('提示', '不支持同时选择图片和视频');
      return;
    }
    if (selectedImages.filter((item) => item.type === 'video').length > 1) {
      Alert.alert('提示', '发布动态仅支持一个视频');
      return;
    }
    if (hasImage && selectedImages.length > 6) {
      Alert.alert('提示', '发布动态最多上传6张图片');
      return;
    }

    try {
      let uploadedUrls: string[] = [];
      let uploadedCoverUrl: string | undefined;

      // 上传新图片/视频（排除已上传的）
      const imagesToUpload = selectedImages.filter(
        (img) => !img.uri.startsWith('http'),
      );

      if (imagesToUpload.length > 0) {
        setUploading(true);
        const uploadResults = await uploadService.uploadFiles(
          imagesToUpload.map((img) => ({
            uri: img.uri,
            name: img.name,
            type: img.type === 'image' ? 'image/jpeg' : 'video/mp4',
          })),
          'posts',
        );
        uploadedUrls = uploadResults.files.map((file) => file.url);
      }

      // 如果有视频封面,上传封面
      if (videoCoverUri && !videoCoverUri.startsWith('http')) {
        const coverResult = await uploadService.uploadFiles(
          [
            {
              uri: videoCoverUri,
              name: 'cover.jpg',
              type: 'image/jpeg',
            },
          ],
          'posts',
        );
        uploadedCoverUrl = coverResult.files[0]?.url;
      } else if (videoCoverUri) {
        uploadedCoverUrl = videoCoverUri;
      }

      // 添加已上传的图片URL
      const existingUrls = selectedImages
        .filter((img) => img.uri.startsWith('http'))
        .map((img) => img.uri);

      const allUrls = [...existingUrls, ...uploadedUrls];
      setUploading(false);

      // 从内容中提取话题标签
      const extractedHashtags = extractHashtagsFromContent(content);
      const allHashtags = Array.from(
        new Set([...hashtags, ...extractedHashtags]),
      );

      // 发布动态
      setPublishing(true);
      await postService.createPost({
        petId: selectedPetId,
        content: content.trim(),
        mediaType:
          selectedImages.length > 0
            ? selectedImages[0].type === 'video'
              ? 'video'
              : 'image'
            : undefined,
        mediaUrls: allUrls.length > 0 ? allUrls : undefined,
        coverImageUrl: uploadedCoverUrl, // 添加视频封面
        hashtags: allHashtags.length > 0 ? allHashtags : undefined,
        aiAnalysis:
          emotion && confidence
            ? {
                emotion,
                confidence: parseFloat(confidence),
                description,
              }
            : undefined,
      });

      setPublishing(false);

      Alert.alert('发布成功', '你的动态已成功发布', [
        {
          text: '确定',
          onPress: () => {
            // 返回首页
            router.replace('/(tabs)');
          },
        },
      ]);
    } catch (error: any) {
      setUploading(false);
      setPublishing(false);
      console.error('发布失败:', error);
      Alert.alert(
        '发布失败',
        error.response?.data?.message || '请稍后重试',
      );
    }
  };

  const isLoading = uploading || publishing;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelButton}>取消</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>发布动态</Text>
        <TouchableOpacity
          onPress={handlePublish}
          disabled={isLoading}
          style={[styles.publishBtn, isLoading && styles.publishBtnDisabled]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FF6B6B" />
          ) : (
            <Text style={styles.publishBtnText}>发布</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* 内容输入 */}
        <TextInput
          style={styles.contentInput}
          placeholder="分享你和宠物的快乐时光..."
          placeholderTextColor="#999"
          multiline
          value={content}
          onChangeText={setContent}
          maxLength={2000}
          editable={!isLoading}
        />

        {/* 字数统计 */}
        <Text style={styles.charCount}>{content.length}/2000</Text>

        {/* 图片选择 */}
        <View style={styles.section}>
          <ImagePicker
            maxImages={6}
            onImagesSelected={handleImagesSelected}
            initialImages={selectedImages}
            onVideoCoverSelect={handleVideoCoverSelect}
          />
          <Text style={styles.mediaTip}>支持最多6张图片或1个视频，不支持混选</Text>
        </View>

        {/* 关联宠物 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="paw" size={20} color="#666" />
            <Text style={styles.sectionTitle}>关联宠物档案</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.petChip,
                !selectedPetId && styles.petChipActive,
              ]}
              onPress={() => setSelectedPetId(undefined)}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.petChipText,
                  !selectedPetId && styles.petChipTextActive,
                ]}
              >
                不关联
              </Text>
            </TouchableOpacity>
            {myPets.map((pet) => {
              const isActive = selectedPetId === pet.id;
              return (
                <TouchableOpacity
                  key={pet.id}
                  style={[styles.petChip, isActive && styles.petChipActive]}
                  onPress={() => setSelectedPetId(pet.id)}
                  disabled={isLoading}
                >
                  <RNImage
                    source={
                      pet.avatarUrl
                        ? { uri: pet.avatarUrl }
                        : require('../assets/images/default_avatar.webp')
                    }
                    style={styles.petAvatar}
                  />
                  <View>
                    <Text
                      style={[
                        styles.petChipText,
                        isActive && styles.petChipTextActive,
                      ]}
                    >
                      {pet.name}
                    </Text>
                    <Text style={styles.petChipSubText}>
                      {pet.species === 'cat'
                        ? '猫'
                        : pet.species === 'dog'
                          ? '狗'
                          : '其他'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 话题标签 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pricetag" size={20} color="#666" />
            <Text style={styles.sectionTitle}>话题标签</Text>
          </View>

          {/* 已添加的标签 */}
          {hashtags.length > 0 && (
            <View style={styles.hashtagList}>
              {hashtags.map((tag, index) => (
                <View key={index} style={styles.hashtagItem}>
                  <Text style={styles.hashtagText}>#{tag}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveHashtag(index)}
                    disabled={isLoading}
                  >
                    <Ionicons name="close-circle" size={18} color="#999" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* 添加标签 */}
          {hashtags.length < 10 && (
            <View style={styles.hashtagInput}>
              <TextInput
                style={styles.hashtagInputField}
                placeholder="输入话题标签"
                placeholderTextColor="#999"
                value={hashtagInput}
                onChangeText={setHashtagInput}
                onSubmitEditing={handleAddHashtag}
                returnKeyType="done"
                maxLength={20}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={handleAddHashtag}
                disabled={!hashtagInput.trim() || isLoading}
              >
                <Ionicons
                  name="add-circle"
                  size={28}
                  color={hashtagInput.trim() ? '#FF6B6B' : '#ddd'}
                />
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.hint}>提示：在内容中使用 #话题 也会自动添加标签</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginTop: 40,
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  publishBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  publishBtnDisabled: {
    opacity: 0.5,
  },
  publishBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  content: {
    flex: 1,
  },
  contentInput: {
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 150,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    paddingHorizontal: 16,
    paddingBottom: 8,
    fontSize: 12,
    color: '#999',
  },
  section: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  mediaTip: {
    marginTop: 4,
    fontSize: 12,
    color: '#999',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  hashtagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  hashtagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  hashtagText: {
    fontSize: 14,
    color: '#FF6B6B',
  },
  hashtagInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  hashtagInputField: {
    flex: 1,
    fontSize: 15,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    lineHeight: 18,
  },
  petChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: '#fff',
    minHeight: 44,
  },
  petChipActive: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  petChipText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  petChipTextActive: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  petChipSubText: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  petAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
});
