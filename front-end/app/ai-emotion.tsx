import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ImagePicker, {
  SelectedImage,
} from '../components/upload/ImagePicker';
import { uploadService } from '../services/upload.service';
import { aiService, EmotionAnalysisResult } from '../services/ai.service';

export default function AiEmotionScreen() {
  const router = useRouter();
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [emotionResult, setEmotionResult] =
    useState<EmotionAnalysisResult | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');

  // 处理图片选择
  const handleImagesSelected = (images: SelectedImage[]) => {
    setSelectedImages(images);
    setEmotionResult(null);
    setUploadedImageUrl('');
  };

  // 开始分析
  const handleAnalyze = async () => {
    if (selectedImages.length === 0) {
      Alert.alert('提示', '请先选择一张宠物照片');
      return;
    }

    try {
      // 1. 上传图片
      setUploading(true);
      const uploadResult = await uploadService.uploadFile(
        {
          uri: selectedImages[0].uri,
          name: selectedImages[0].name,
          type: selectedImages[0].type === 'image' ? 'image/jpeg' : 'video/mp4',
        },
        'posts',
      );

      setUploadedImageUrl(uploadResult.url);
      setUploading(false);

      // 2. 调用AI分析
      setAnalyzing(true);
      const result = await aiService.analyzeEmotion({
        imageUrl: uploadResult.url,
      });

      setEmotionResult(result);
      setAnalyzing(false);
    } catch (error: any) {
      setUploading(false);
      setAnalyzing(false);
      console.error('分析失败:', error);
      Alert.alert(
        '分析失败',
        error.response?.data?.message || '请稍后重试',
      );
    }
  };

  // 重新分析
  const handleRetry = () => {
    setSelectedImages([]);
    setEmotionResult(null);
    setUploadedImageUrl('');
  };

  // 发布动态
  const handlePublish = () => {
    if (!emotionResult || !uploadedImageUrl) {
      return;
    }

    // 跳转到发布页面，携带数据
    router.push({
      pathname: '/create-post',
      params: {
        imageUrl: uploadedImageUrl,
        emotion: emotionResult.emotion,
        confidence: emotionResult.confidence.toString(),
        description: emotionResult.description,
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI情绪识别</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* 说明 */}
        {!emotionResult && (
          <View style={styles.infoBox}>
            <Ionicons name="sparkles" size={24} color="#FF6B6B" />
            <Text style={styles.infoText}>
              上传你的宠物照片，AI将帮你识别它的情绪状态
            </Text>
          </View>
        )}

        {/* 图片选择 */}
        {!emotionResult && (
          <View style={styles.section}>
            <ImagePicker
              maxImages={1}
              onImagesSelected={handleImagesSelected}
              initialImages={selectedImages}
            />
          </View>
        )}

        {/* 分析按钮 */}
        {!emotionResult && selectedImages.length > 0 && (
          <TouchableOpacity
            style={[
              styles.analyzeButton,
              (uploading || analyzing) && styles.analyzeButtonDisabled,
            ]}
            onPress={handleAnalyze}
            disabled={uploading || analyzing}
          >
            {uploading || analyzing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.analyzeButtonText}>
                {uploading ? '上传中...' : analyzing ? '分析中...' : '开始分析'}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* 分析结果 */}
        {emotionResult && uploadedImageUrl && (
          <View style={styles.resultContainer}>
            {/* 图片展示 */}
            <Image
              source={{ uri: uploadedImageUrl }}
              style={styles.resultImage}
            />

            {/* 情绪卡片 */}
            <View style={styles.emotionCard}>
              <View style={styles.emotionHeader}>
                <Ionicons name="happy" size={32} color="#FF6B6B" />
                <Text style={styles.emotionTitle}>{emotionResult.emotion}</Text>
              </View>

              <View style={styles.confidenceBar}>
                <View style={styles.confidenceBarBg}>
                  <View
                    style={[
                      styles.confidenceBarFill,
                      { width: `${emotionResult.confidence * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.confidenceText}>
                  置信度 {(emotionResult.confidence * 100).toFixed(0)}%
                </Text>
              </View>

              <Text style={styles.emotionDescription}>
                {emotionResult.description}
              </Text>

              {emotionResult.petType && (
                <View style={styles.petTypeContainer}>
                  <Ionicons name="paw" size={16} color="#666" />
                  <Text style={styles.petTypeText}>
                    检测到：
                    {emotionResult.petType === 'cat'
                      ? '猫咪'
                      : emotionResult.petType === 'dog'
                        ? '狗狗'
                        : '宠物'}
                  </Text>
                </View>
              )}
            </View>

            {/* 操作按钮 */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetry}
              >
                <Ionicons name="refresh" size={20} color="#666" />
                <Text style={styles.retryButtonText}>重新分析</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.publishButton}
                onPress={handlePublish}
              >
                <Text style={styles.publishButtonText}>发布动态</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 16,
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  section: {
    padding: 16,
  },
  analyzeButton: {
    margin: 16,
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  analyzeButtonDisabled: {
    opacity: 0.6,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    padding: 16,
  },
  resultImage: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginBottom: 16,
  },
  emotionCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  emotionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  emotionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  confidenceBar: {
    marginBottom: 16,
  },
  confidenceBarBg: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  confidenceBarFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  emotionDescription: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
  },
  petTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  petTypeText: {
    fontSize: 13,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  publishButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
  },
  publishButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
