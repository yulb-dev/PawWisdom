import React, { useEffect, useState, useRef } from 'react';
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
import { followService } from '../services/follow.service';
import { useAuthStore } from '../store/auth.store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_WIDTH;

export default function PostDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();

  const postId = params.id as string;

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [commentLikeStatusMap, setCommentLikeStatusMap] = useState<Record<string, boolean>>({});

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

  const { data: interactionStatus } = useQuery({
    queryKey: ['post-interactions', postId],
    queryFn: () => postService.getInteractionStatus(postId),
    enabled: !!postId && isAuthenticated,
  });

  const comments = React.useMemo(() => commentsData?.data || [], [commentsData?.data]);

  useEffect(() => {
    if (!isAuthenticated || comments.length === 0) {
      setCommentLikeStatusMap({});
      return;
    }

    let cancelled = false;
    const loadStatus = async () => {
      const entries = await Promise.all(
        comments.map(async (comment) => {
          try {
            const isLiked = await commentService.checkLikeStatus(comment.id);
            return [comment.id, isLiked] as const;
          } catch {
            return [comment.id, false] as const;
          }
        }),
      );
      if (!cancelled) {
        setCommentLikeStatusMap(Object.fromEntries(entries));
      }
    };

    loadStatus();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, comments]);

  // 点赞/取消点赞
  const likeMutation = useMutation({
    mutationFn: async () => {
      const isLiked = interactionStatus?.isLiked || false;
      if (isLiked) {
        await postService.unlikePost(postId);
      } else {
        await postService.likePost(postId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['post-interactions', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!post?.user?.id) return;
      const isFollowing = interactionStatus?.isFollowingAuthor || false;
      if (isFollowing) {
        await followService.unfollowUser(post.user.id);
      } else {
        await followService.followUser(post.user.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-interactions', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error: any) => {
      Alert.alert('操作失败', error?.response?.data?.message || '请稍后重试');
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
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
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
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    try {
      await postService.sharePost(postId);
      Alert.alert('成功', '分享成功');
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    } catch {
      Alert.alert('错误', '分享失败');
    }
  };

  const handleCommentLike = async (commentId: string) => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    try {
      const isLiked = commentLikeStatusMap[commentId] || false;
      if (isLiked) {
        await commentService.unlikeComment(commentId);
      } else {
        await commentService.likeComment(commentId);
      }
      setCommentLikeStatusMap((prev) => ({
        ...prev,
        [commentId]: !isLiked,
      }));
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    } catch {
      Alert.alert('错误', '操作失败');
    }
  };

  const handleSendComment = () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
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

  const getAvatarSource = (avatarUrl?: string | null) =>
    typeof avatarUrl === 'string' && avatarUrl.trim().length > 0
      ? { uri: avatarUrl }
      : require('../assets/images/default_avatar.webp');

  if (isLoading || !post) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
        </View>
      </SafeAreaView>
    );
  }

  const mediaUrls = (Array.isArray(post.mediaUrls) ? post.mediaUrls : []).filter(
    (url): url is string => typeof url === 'string' && url.trim().length > 0
  );
  const isVideo = post.mediaType === 'video';
  const canFollow = !!post.user?.id && post.user.id !== user?.id;

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
              source={getAvatarSource(post.user?.avatarUrl)}
              style={styles.headerAvatar}
            />
            <Text style={styles.headerUsername} numberOfLines={1}>
              {post.user?.nickname || post.user?.username || '未知用户'}
            </Text>
          </View>

          <View style={styles.headerRight}>
            {canFollow && (
              <TouchableOpacity
                style={[
                  styles.followButton,
                  interactionStatus?.isFollowingAuthor && styles.followButtonFollowing,
                ]}
                onPress={() => followMutation.mutate()}
                disabled={followMutation.isPending}
              >
                <Text
                  style={[
                    styles.followButtonText,
                    interactionStatus?.isFollowingAuthor && styles.followButtonTextFollowing,
                  ]}
                >
                  {interactionStatus?.isFollowingAuthor ? '已关注' : '关注'}
                </Text>
              </TouchableOpacity>
            )}
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
          {mediaUrls.length > 0 && !isVideo && (
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
                {mediaUrls.map((image, index) => (
                  <RNImage
                    key={index}
                    source={{ uri: image }}
                    style={styles.postImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
              {mediaUrls.length > 1 && (
                <View style={styles.imageIndicator}>
                  <Text style={styles.imageIndicatorText}>
                    {currentImageIndex + 1}/{mediaUrls.length}
                  </Text>
                </View>
              )}
            </View>
          )}
          {isVideo && (mediaUrls[0] || post.coverImageUrl) && (
            <View style={styles.imageContainer}>
              <RNImage
                source={{ uri: post.coverImageUrl || mediaUrls[0] }}
                style={styles.postImage}
                resizeMode="cover"
              />
              <View style={styles.videoOverlay}>
                <Ionicons name="play" size={40} color="#fff" />
              </View>
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

            <View style={styles.postActions}>
              <TouchableOpacity style={styles.postActionBtn} onPress={() => likeMutation.mutate()}>
                <Ionicons
                  name={interactionStatus?.isLiked ? 'thumbs-up' : 'thumbs-up-outline'}
                  size={21}
                  color={interactionStatus?.isLiked ? '#FF6B6B' : '#999'}
                />
                <Text style={styles.postActionText}>{post.likeCount}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.postActionBtn} onPress={handleShare}>
                <Ionicons name="share-social-outline" size={21} color="#999" />
                <Text style={styles.postActionText}>{post.shareCount}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 评论区域 */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>评论 {comments.length}</Text>

            {comments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <RNImage
                  source={getAvatarSource(comment.user?.avatarUrl)}
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
                        <Ionicons
                          name={commentLikeStatusMap[comment.id] ? 'heart' : 'heart-outline'}
                          size={16}
                          color={commentLikeStatusMap[comment.id] ? '#FF6B6B' : '#999'}
                        />
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
  followButtonFollowing: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ffd0d0',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  followButtonTextFollowing: {
    color: '#FF6B6B',
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
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
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
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
  },
  postActionBtn: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postActionText: {
    fontSize: 14,
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
