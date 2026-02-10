import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image as RNImage,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postService } from '../services/post.service';
import { commentService } from '../services/comment.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_WIDTH;

export default function PostDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const queryClient = useQueryClient();

  const postId = params.id as string;

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  // 获取动态详情
  const { data: post, isLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => postService.getPost(postId),
    enabled: !!postId,
  });

  // 获取评论列表
  const { data: commentsData } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => commentService.getCommentsByPost(postId, 1, 20),
    enabled: !!postId,
  });

  // 点赞/取消点赞
  const likeMutation = useMutation({
    mutationFn: async () => {
      const isLiked = await postService.checkLikeStatus(postId);
      if (isLiked) {
        await postService.unlikePost(postId);
      } else {
        await postService.likePost(postId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });

  // 发送评论
  const commentMutation = useMutation({
    mutationFn: (content: string) =>
      commentService.createComment({
        postId,
        content,
      }),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      Alert.alert('成功', '评论发布成功');
    },
    onError: () => {
      Alert.alert('错误', '评论发布失败');
    },
  });

  // 顶部导航栏背景透明度（滚动后显示背景）
  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const handleShare = async () => {
    try {
      await postService.sharePost(postId);
      Alert.alert('成功', '分享成功');
    } catch (error) {
      Alert.alert('错误', '分享失败');
    }
  };

  const toggleCommentExpand = (commentId: string) => {
    setExpandedComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const handleCommentLike = async (commentId: string) => {
    try {
      await commentService.likeComment(commentId);
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    } catch (error) {
      // 可能已点赞，尝试取消点赞
      try {
        await commentService.unlikeComment(commentId);
        queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      } catch (e) {
        Alert.alert('错误', '操作失败');
      }
    }
  };

  const handleSendComment = () => {
    if (commentText.trim()) {
      commentMutation.mutate(commentText.trim());
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (isLoading || !post) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
        </View>
      </SafeAreaView>
    );
  }

  const comments = commentsData?.data || [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* 顶部导航栏（固定，始终显示） */}
        <Animated.View
          style={[
            styles.header,
            {
              paddingTop: insets.top,
              backgroundColor: headerBgOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: ['rgba(255, 255, 255, 0.95)', '#fff'],
              }),
            },
          ]}
        >
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <RNImage
              source={{
                uri: post.user?.avatarUrl || require('../assets/images/default_avatar.webp'),
              }}
              style={styles.headerAvatar}
            />
            <Text style={styles.headerUsername} numberOfLines={1}>
              {post.user?.nickname || post.user?.username || '未知用户'}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.followButton} onPress={() => Alert.alert('提示', '关注功能开发中')}>
              <Text style={styles.followButtonText}>关注</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={24} color="#111827" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: false,
          })}
          scrollEventThrottle={16}
        >
          {/* 图片轮播 */}
          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <View style={styles.imageContainer}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                  setCurrentImageIndex(index);
                }}
              >
                {post.mediaUrls.map((image, index) => (
                  <RNImage
                    key={index}
                    source={{ uri: image }}
                    style={styles.postImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
              {post.mediaUrls.length > 1 && (
                <View style={styles.imageIndicator}>
                  <Text style={styles.imageIndicatorText}>
                    {currentImageIndex + 1}/{post.mediaUrls.length}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* 内容区域 */}
          <View style={styles.contentContainer}>
            {/* 标题 */}
            {post.title && <Text style={styles.title}>{post.title}</Text>}

            {/* 内容 */}
            <Text style={styles.content}>{post.content}</Text>

            {/* 发布日期 */}
            <Text style={styles.date}>{formatDate(post.createdAt)}</Text>
          </View>

          {/* 评论区域 */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>评论 {comments.length}</Text>

            {comments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <RNImage
                  source={
                    comment.user?.avatarUrl
                      ? { uri: comment.user.avatarUrl }
                      : require('../assets/images/default_avatar.webp')
                  }
                  style={styles.commentAvatar}
                />
                <View style={styles.commentContent}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentUsername}>
                      {comment.user?.nickname || comment.user?.username || '未知用户'}
                    </Text>
                    {comment.isPinned && (
                      <View style={styles.pinnedBadge}>
                        <Text style={styles.pinnedText}>置顶</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.commentText}>{comment.content}</Text>

                  <View style={styles.commentActions}>
                    <Text style={styles.commentTime}>{formatDate(comment.createdAt)}</Text>
                    <TouchableOpacity onPress={() => handleCommentLike(comment.id)}>
                      <View style={styles.commentAction}>
                        <Ionicons name="heart-outline" size={16} color="#999" />
                        {comment.likeCount > 0 && (
                          <Text style={styles.commentActionText}>{comment.likeCount}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </Animated.ScrollView>

        {/* 底部评论输入框 */}
        <View style={[styles.commentInputContainer, { paddingBottom: insets.bottom }]}>
          <TextInput
            style={styles.commentInput}
            placeholder="说点什么吧..."
            placeholderTextColor="#999"
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, commentText.trim() && styles.sendButtonActive]}
            onPress={handleSendComment}
            disabled={!commentText.trim() || commentMutation.isPending}
          >
            {commentMutation.isPending ? (
              <ActivityIndicator size="small" color="#FF6B6B" />
            ) : (
              <Ionicons name="send" size={20} color={commentText.trim() ? '#FF6B6B' : '#ccc'} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 100,
    borderBottomColor: '#f0f0f0',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  headerUsername: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  followButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    position: 'relative',
  },
  postImage: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    backgroundColor: '#f0f0f0',
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  imageIndicatorText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 28,
    marginBottom: 12,
  },
  content: {
    fontSize: 15,
    lineHeight: 24,
    color: '#333',
    marginBottom: 12,
  },
  date: {
    fontSize: 13,
    color: '#999',
  },
  commentsSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 80,
  },
  commentsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  pinnedBadge: {
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pinnedText: {
    fontSize: 11,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    marginBottom: 8,
  },
  repliesContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  replyItem: {
    marginBottom: 8,
  },
  replyText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#666',
  },
  replyUsername: {
    fontWeight: '600',
    color: '#FF6B6B',
  },
  replyArrow: {
    color: '#999',
  },
  expandText: {
    fontSize: 13,
    color: '#FF6B6B',
    marginBottom: 8,
  },
  collapseText: {
    fontSize: 13,
    color: '#FF6B6B',
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentActionText: {
    fontSize: 12,
    color: '#999',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendButtonActive: {
    backgroundColor: '#FFF5F5',
  },
});
