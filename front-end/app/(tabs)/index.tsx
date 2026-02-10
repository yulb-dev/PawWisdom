import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Image as RNImage,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { postService, Post } from '../../services/post.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // 获取推荐动态流
  const {
    data: postsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['posts', 'recommended'],
    queryFn: () => postService.getRecommendedFeed(1, 20),
  });

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // 渲染动态卡片
  const renderPostItem = ({ item }: { item: Post }) => (
    <PostCard post={item} onPress={() => router.push(`/post/${item.id}`)} />
  );

  // 空状态
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="paw" size={64} color="#ddd" />
      <Text style={styles.emptyText}>还没有动态</Text>
      <Text style={styles.emptyHint}>快去发布第一条动态吧！</Text>
    </View>
  );

  // Loading状态
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>首页</Text>
          <TouchableOpacity onPress={() => router.push('/ai-emotion')}>
            <Ionicons name="camera" size={24} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>首页</Text>
        <TouchableOpacity onPress={() => router.push('/ai-emotion')}>
          <Ionicons name="camera" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={postsData?.data || []}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6B6B"
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// 动态卡片组件
function PostCard({ post, onPress }: { post: Post; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.postCard} onPress={onPress}>
      {/* 用户信息 */}
      <View style={styles.postHeader}>
        <RNImage
          source={{
            uri: post.user?.avatarUrl || 'https://via.placeholder.com/40',
          }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.username}>
            {post.user?.nickname || post.user?.username}
          </Text>
          <Text style={styles.postTime}>
            {formatTime(post.createdAt)}
            {post.pet && ` · ${post.pet.name}`}
          </Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      {/* 内容 */}
      <Text style={styles.content} numberOfLines={5}>
        {post.content}
      </Text>

      {/* 图片 */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <View style={styles.imageGrid}>
          {post.mediaUrls.slice(0, 3).map((url, index) => (
            <RNImage
              key={index}
              source={{ uri: url }}
              style={styles.gridImage}
            />
          ))}
        </View>
      )}

      {/* AI情绪标签 */}
      {post.aiAnalysis?.emotion && (
        <View style={styles.emotionTag}>
          <Ionicons name="happy" size={16} color="#FF6B6B" />
          <Text style={styles.emotionText}>{post.aiAnalysis.emotion}</Text>
        </View>
      )}

      {/* 话题标签 */}
      {post.hashtags && post.hashtags.length > 0 && (
        <View style={styles.hashtagContainer}>
          {post.hashtags.slice(0, 3).map((tag) => (
            <Text key={tag.id} style={styles.hashtag}>
              #{tag.name}
            </Text>
          ))}
        </View>
      )}

      {/* 互动按钮 */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="heart-outline" size={20} color="#666" />
          <Text style={styles.actionText}>{post.likeCount || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={20} color="#666" />
          <Text style={styles.actionText}>{post.commentCount || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="arrow-redo-outline" size={20} color="#666" />
          <Text style={styles.actionText}>{post.shareCount || 0}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// 时间格式化
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;

  return date.toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
  });
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 8,
  },
  postCard: {
    backgroundColor: '#fff',
    marginHorizontal: 0,
    marginVertical: 4,
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  postTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginBottom: 12,
  },
  imageGrid: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  gridImage: {
    flex: 1,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  emotionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    marginBottom: 8,
  },
  emotionText: {
    fontSize: 13,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  hashtagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  hashtag: {
    fontSize: 13,
    color: '#FF6B6B',
  },
  actions: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  emptyHint: {
    fontSize: 13,
    color: '#ccc',
    marginTop: 8,
  },
});
