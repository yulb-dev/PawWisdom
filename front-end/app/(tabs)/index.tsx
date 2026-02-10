import React, { useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Image as RNImage,
  Dimensions,
  Animated
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { postService, Post } from '../../services/post.service'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const HEADER_HEIGHT = 100
const SEARCH_BAR_HEIGHT = 50

type TabType = 'discover' | 'local'

export default function HomeScreen() {
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('discover')
  const scrollY = useRef(new Animated.Value(0)).current

  // 获取推荐动态流
  const {
    data: postsData,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['posts', 'recommended', activeTab],
    queryFn: () => postService.getRecommendedFeed(1, 20)
  })

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  // 渲染动态卡片 - 瀑布流布局
  const renderPostItem = ({ item, index }: { item: Post; index: number }) => (
    <PostCard post={item} onPress={() => router.push(`/post-detail?id=${item.id}`)} />
  )

  // 空状态
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="paw" size={64} color="#ddd" />
      <Text style={styles.emptyText}>还没有动态</Text>
      <Text style={styles.emptyHint}>快去发布第一条动态吧！</Text>
    </View>
  )

  // 搜索框隐藏动画
  const searchBarHeight = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [56, 0],
    extrapolate: 'clamp'
  })

  const searchBarOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  })

  // 搜索图标显示动画
  const searchIconOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  })

  // Loading状态
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style="dark" />
        <View style={styles.headerContainer}>
          <View style={styles.topBar}>
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={styles.tabButton}
                onPress={() => setActiveTab('discover')}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'discover' && styles.tabTextActive
                  ]}
                >
                  发现
                </Text>
                {activeTab === 'discover' && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.tabButton}
                onPress={() => setActiveTab('local')}
              >
                <Text
                  style={[styles.tabText, activeTab === 'local' && styles.tabTextActive]}
                >
                  同城
                </Text>
                {activeTab === 'local' && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => router.push('/message')}>
              <Ionicons name="notifications-outline" size={26} color="#111827" />
            </TouchableOpacity>
          </View>
          <View style={styles.searchBarContainer}>
            <TouchableOpacity
              style={styles.searchBar}
              onPress={() => router.push('/search')}
              activeOpacity={0.8}
            >
              <Ionicons name="search-outline" size={20} color="#999" />
              <Text style={styles.searchPlaceholder}>发现更多...</Text>
              <Ionicons name="mic-outline" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      {/* 固定顶部 */}
      <View style={styles.headerContainer}>
        <View style={styles.topBar}>
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={styles.tabButton}
              onPress={() => setActiveTab('discover')}
            >
              <Text
                style={[styles.tabText, activeTab === 'discover' && styles.tabTextActive]}
              >
                发现
              </Text>
              {activeTab === 'discover' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tabButton}
              onPress={() => setActiveTab('local')}
            >
              <Text
                style={[styles.tabText, activeTab === 'local' && styles.tabTextActive]}
              >
                同城
              </Text>
              {activeTab === 'local' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          </View>
          <View style={styles.rightIcons}>
            <Animated.View style={{ opacity: searchIconOpacity }}>
              <TouchableOpacity onPress={() => router.push('/search')}>
                <Ionicons name="search-outline" size={24} color="#111827" />
              </TouchableOpacity>
            </Animated.View>
            <TouchableOpacity onPress={() => router.push('/message')}>
              <Ionicons name="notifications-outline" size={26} color="#111827" />
            </TouchableOpacity>
          </View>
        </View>

        <Animated.View
          style={[
            styles.searchBarContainer,
            {
              height: searchBarHeight,
              opacity: searchBarOpacity
            }
          ]}
        >
          <TouchableOpacity
            style={styles.searchBar}
            onPress={() => router.push('/search')}
            activeOpacity={0.8}
          >
            <Ionicons name="search-outline" size={20} color="#999" />
            <Text style={styles.searchPlaceholder}>发现更多...</Text>
            <Ionicons name="mic-outline" size={20} color="#999" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      <Animated.FlatList
        data={postsData?.data || []}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
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
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false
        })}
        scrollEventThrottle={16}
      />
    </SafeAreaView>
  )
}

// 动态卡片组件 - 瀑布流样式
function PostCard({ post, onPress }: { post: Post; onPress: () => void }) {
  // 计算图片高度（随机化，模拟瀑布流效果）
  const imageHeight = 200 + Math.random() * 100

  return (
    <TouchableOpacity style={styles.postCard} onPress={onPress} activeOpacity={0.98}>
      {/* 图片 */}
      {post.mediaUrls && post.mediaUrls.length > 0 ? (
        <View style={styles.imageContainer}>
          <RNImage
            source={{ uri: post.coverImageUrl || post.mediaUrls[0] }}
            style={[styles.postImage, { height: imageHeight }]}
            resizeMode="cover"
          />
          {/* 三点菜单 */}
          <BlurView intensity={95} tint="light" style={styles.moreMenu}>
            <View style={styles.menuDot} />
            <View style={styles.menuDot} />
            <View style={styles.menuDot} />
          </BlurView>
          {/* 底部渐变遮罩 */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.imageOverlay}
          />
          {/* 互动按钮 */}
          <View style={styles.overlayActions}>
            <BlurView intensity={50} tint="light" style={styles.actionItem}>
              <Ionicons name="heart-outline" size={13} color="#fff" />
              <Text style={styles.overlayActionText}>
                {post.likeCount >= 1000
                  ? `${(post.likeCount / 1000).toFixed(1)}k`
                  : post.likeCount || 0}
              </Text>
            </BlurView>
            <BlurView intensity={50} tint="light" style={styles.actionItem}>
              <Ionicons name="chatbubble-outline" size={13} color="#fff" />
              <Text style={styles.overlayActionText}>{post.commentCount || 0}</Text>
            </BlurView>
          </View>
        </View>
      ) : (
        <View
          style={[styles.postImage, { height: imageHeight, backgroundColor: '#f0f0f0' }]}
        />
      )}

      {/* 标题/内容 */}
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {post.title || post.content}
        </Text>
        <View style={styles.userRow}>
          <RNImage
            source={
              post.user?.avatarUrl
                ? { uri: post.user.avatarUrl }
                : require('../../assets/images/default_avatar.webp')
            }
            style={styles.miniAvatar}
          />
          <Text style={styles.miniUsername} numberOfLines={1}>
            {post.user?.nickname || post.user?.username || '未知用户'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

// 时间格式化
function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  return date.toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric'
  })
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff'
  },
  headerContainer: {
    backgroundColor: '#fff'
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12
  },
  selectText: {
    fontSize: 18,
    color: '#999',
    fontWeight: '400',
    width: 80
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    flex: 1,
    justifyContent: 'center'
  },
  tabButton: {
    alignItems: 'center',
    paddingVertical: 4
  },
  tabText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#999'
  },
  tabTextActive: {
    fontWeight: '700',
    color: '#111827'
  },
  tabIndicator: {
    width: 30,
    height: 3,
    backgroundColor: '#FF6B6B',
    borderRadius: 2,
    marginTop: 4
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: 80,
    justifyContent: 'flex-end'
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    overflow: 'hidden'
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: '#999'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  listContent: {
    paddingTop: 4,
    paddingHorizontal: 18
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 18
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    width: (SCREEN_WIDTH - 54) / 2,
    overflow: 'hidden'
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden'
  },
  postImage: {
    width: '100%',
    backgroundColor: '#f0f0f0'
  },
  moreMenu: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 2,
    overflow: 'hidden'
  },
  menuDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: '#666'
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70
  },
  overlayActions: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    gap: 10
  },
  actionItem: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    overflow: 'hidden'
  },
  overlayActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  cardInfo: {
    padding: 8
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    lineHeight: 18,
    marginBottom: 8
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  miniAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0'
  },
  miniUsername: {
    fontSize: 11,
    color: '#999',
    flex: 1
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    width: SCREEN_WIDTH
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16
  },
  emptyHint: {
    fontSize: 13,
    color: '#ccc',
    marginTop: 8
  }
})
