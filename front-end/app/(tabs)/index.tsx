import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Image as RNImage,
  Dimensions,
  Animated,
  Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Image as ExpoImage } from 'expo-image'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { postService, Post } from '../../services/post.service'
import { followService } from '../../services/follow.service'
import { useAuthStore } from '../../store/auth.store'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_HORIZONTAL = 16
const CARD_WIDTH = SCREEN_WIDTH - CARD_HORIZONTAL * 2
const CARD_LIST_HORIZONTAL_PADDING = 10
const CARD_MEDIA_HORIZONTAL_PADDING = 12
const GRID_GAP = 6
const GRID_CONTENT_WIDTH =
  SCREEN_WIDTH - CARD_LIST_HORIZONTAL_PADDING * 2 - CARD_MEDIA_HORIZONTAL_PADDING * 2
const GRID_SIZE = Math.floor((GRID_CONTENT_WIDTH - GRID_GAP * 2) / 3)

type TabType = 'discover' | 'local'
type InteractionMap = Record<
  string,
  { isLiked: boolean; isFavorited: boolean; isFollowingAuthor: boolean }
>

export default function HomeScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('discover')
  const [interactionMap, setInteractionMap] = useState<InteractionMap>({})
  const scrollY = useRef(new Animated.Value(0)).current
  const { isAuthenticated, user } = useAuthStore()

  const {
    data: postsData,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['posts', 'recommended', activeTab],
    queryFn: () =>
      activeTab === 'discover'
        ? postService.getRecommendedFeed(1, 20)
        : postService.getFollowingFeed(1, 20)
  })

  const posts = useMemo(() => postsData?.data || [], [postsData?.data])

  useEffect(() => {
    if (!isAuthenticated || posts.length === 0) {
      setInteractionMap({})
      return
    }

    let cancelled = false
    const loadInteractions = async () => {
      const entries = await Promise.all(
        posts.map(async (post) => {
          try {
            const status = await postService.getInteractionStatus(post.id)
            return [post.id, status] as const
          } catch {
            return [
              post.id,
              { isLiked: false, isFavorited: false, isFollowingAuthor: false }
            ] as const
          }
        })
      )
      if (!cancelled) {
        setInteractionMap(Object.fromEntries(entries))
      }
    }
    loadInteractions()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, posts])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  const likeMutation = useMutation({
    mutationFn: async (post: Post) => {
      const state = interactionMap[post.id]?.isLiked || false
      if (state) {
        await postService.unlikePost(post.id)
      } else {
        await postService.likePost(post.id)
      }
      return { postId: post.id, nextLiked: !state }
    },
    onSuccess: ({ postId, nextLiked }) => {
      setInteractionMap((prev) => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          isLiked: nextLiked
        }
      }))
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
    onError: (error: any) => {
      Alert.alert('操作失败', error?.response?.data?.message || '请稍后重试')
    }
  })

  const followMutation = useMutation({
    mutationFn: async (post: Post) => {
      if (!post.user?.id) {
        return { postId: post.id, authorId: '', nextFollowing: false }
      }

      const state = interactionMap[post.id]?.isFollowingAuthor || false
      if (state) {
        await followService.unfollowUser(post.user.id)
      } else {
        await followService.followUser(post.user.id)
      }
      return { postId: post.id, authorId: post.user.id, nextFollowing: !state }
    },
    onSuccess: ({ authorId, nextFollowing }) => {
      if (!authorId) return

      setInteractionMap((prev) => {
        const next = { ...prev }
        posts.forEach((item) => {
          if (item.user?.id === authorId) {
            next[item.id] = {
              ...next[item.id],
              isFollowingAuthor: nextFollowing,
              isLiked: next[item.id]?.isLiked || false,
              isFavorited: next[item.id]?.isFavorited || false
            }
          }
        })
        return next
      })
    },
    onError: (error: any) => {
      Alert.alert('操作失败', error?.response?.data?.message || '请稍后重试')
    }
  })

  const handleLike = (post: Post) => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }
    likeMutation.mutate(post)
  }

  const handleFollow = (post: Post) => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }
    followMutation.mutate(post)
  }

  const handleShare = async (post: Post) => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }
    try {
      await postService.sharePost(post.id)
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      Alert.alert('提示', '已转发该动态')
    } catch (error: any) {
      Alert.alert('转发失败', error?.response?.data?.message || '请稍后重试')
    }
  }

  const renderPostItem = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      currentUserId={user?.id}
      interactions={interactionMap[item.id]}
      onPress={() => router.push(`/post-detail?id=${item.id}`)}
      onLike={() => handleLike(item)}
      onComment={() => router.push(`/post-detail?id=${item.id}`)}
      onShare={() => handleShare(item)}
      onFollow={() => handleFollow(item)}
    />
  )

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="paw" size={64} color="#ddd" />
      <Text style={styles.emptyText}>还没有动态</Text>
      <Text style={styles.emptyHint}>快去发布第一条动态吧！</Text>
    </View>
  )

  const searchBarOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  })
  const searchIconOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  })

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.headerContainer}>
        <View style={styles.topBar}>
          <View style={styles.leftPlaceholder} />
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={styles.tabButton}
              onPress={() => setActiveTab('discover')}
            >
              <View style={styles.tabInner}>
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'discover' && styles.tabTextActive
                  ]}
                >
                  发现
                </Text>
                <View style={styles.tabIndicatorWrapper}>
                  <View
                    style={[
                      styles.tabIndicator,
                      activeTab === 'discover' && styles.tabIndicatorActive
                    ]}
                  />
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tabButton}
              onPress={() => setActiveTab('local')}
            >
              <View style={styles.tabInner}>
                <Text
                  style={[styles.tabText, activeTab === 'local' && styles.tabTextActive]}
                >
                  关注
                </Text>
                <View style={styles.tabIndicatorWrapper}>
                  <View
                    style={[
                      styles.tabIndicator,
                      activeTab === 'local' && styles.tabIndicatorActive
                    ]}
                  />
                </View>
              </View>
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
      </View>

      <Animated.FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Animated.View
            style={[styles.searchBarContainer, { opacity: searchBarOpacity }]}
          >
            <TouchableOpacity
              style={styles.searchBar}
              onPress={() => router.push('/search')}
              activeOpacity={0.8}
            >
              <Ionicons name="search-outline" size={23} color="#bebebe" />
              <Text style={styles.searchPlaceholder}>发现更多...</Text>
              <Ionicons name="mic" size={23} color="#777777" />
            </TouchableOpacity>
          </Animated.View>
        }
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
          useNativeDriver: true
        })}
        scrollEventThrottle={16}
      />
    </SafeAreaView>
  )
}

function PostCard({
  post,
  currentUserId,
  interactions,
  onPress,
  onLike,
  onComment,
  onShare,
  onFollow
}: {
  post: Post
  currentUserId?: string
  interactions?: { isLiked: boolean; isFavorited: boolean; isFollowingAuthor: boolean }
  onPress: () => void
  onLike: () => void
  onComment: () => void
  onShare: () => void
  onFollow: () => void
}) {
  const mediaUrls = useMemo(
    () =>
      (Array.isArray(post.mediaUrls) ? post.mediaUrls : [])
        .filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
        .slice(0, 6),
    [post.mediaUrls]
  )

  const isVideo = post.mediaType === 'video'
  const hasMedia = mediaUrls.length > 0 || !!post.coverImageUrl
  const subtitle = `${post.pet?.name || '未关联宠物'} · ${formatTime(post.createdAt)}`
  const showFollow = !!post.user?.id && post.user.id !== currentUserId

  return (
    <TouchableOpacity style={styles.postCard} onPress={onPress} activeOpacity={0.92}>
      <View style={styles.cardHeader}>
        <View style={styles.authorWrap}>
          <RNImage
            source={
              post.user?.avatarUrl
                ? { uri: post.user.avatarUrl }
                : require('../../assets/images/default_avatar.webp')
            }
            style={styles.avatar}
          />
          <View style={styles.authorTextWrap}>
            <Text style={styles.authorName} numberOfLines={1}>
              {post.user?.nickname || post.user?.username || '未知用户'}
            </Text>
            <Text style={styles.authorMeta} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </View>
        {showFollow && (
          <TouchableOpacity style={styles.followBtn} onPress={onFollow}>
            <Text style={styles.followText}>
              {interactions?.isFollowingAuthor ? '已关注' : '关注'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {!!post.content && (
        <Text style={styles.postContent} numberOfLines={3}>
          {post.content}
        </Text>
      )}

      {hasMedia && (
        <View style={styles.mediaWrap}>
          {isVideo ? (
            <View style={styles.videoContainer}>
              <RNImage
                source={{ uri: post.coverImageUrl || mediaUrls[0] }}
                style={styles.videoCover}
                resizeMode="cover"
              />
              <View style={styles.videoOverlay}>
                <Ionicons name="play" size={30} color="#fff" />
              </View>
            </View>
          ) : mediaUrls.length <= 1 ? (
            <RNImage
              source={{ uri: post.coverImageUrl || mediaUrls[0] }}
              style={styles.singleImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.gridWrap}>
              {mediaUrls.map((url, index) => (
                <RNImage
                  key={`${url}-${index}`}
                  source={{ uri: url }}
                  style={styles.gridImage}
                />
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={onLike}>
          {interactions?.isLiked ? (
            <ExpoImage
              source={require('../../assets/icons/like_active.svg')}
              style={[styles.actionIcon, styles.actionIconActive]}
              contentFit="contain"
            />
          ) : (
            <ExpoImage
              source={require('../../assets/icons/like.svg')}
              style={[styles.actionIcon]}
              contentFit="contain"
            />
          )}

          <Text style={styles.actionText}>{formatCount(post.likeCount)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onComment}>
          <ExpoImage
            source={require('../../assets/icons/comment.svg')}
            style={styles.actionIcon}
            contentFit="contain"
          />
          <Text style={styles.actionText}>{formatCount(post.commentCount)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onShare}>
          <ExpoImage
            source={require('../../assets/icons/share.svg')}
            style={styles.actionIcon}
            contentFit="contain"
          />
          <Text style={styles.actionText}>{formatCount(post.shareCount)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreBtn} onPress={onPress}>
          <Ionicons name="ellipsis-horizontal" size={22} color="#bbb" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

function formatCount(count: number): string {
  if (!count) return '0'
  if (count >= 10000) return `${(count / 10000).toFixed(1)}万`
  return `${count}`
}

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
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  headerContainer: { backgroundColor: '#fff' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12
  },
  leftPlaceholder: { width: 80 },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: 24
  },
  tabButton: { alignItems: 'center', paddingVertical: 4 },
  tabInner: { alignItems: 'center', position: 'relative', paddingBottom: 10 },
  tabText: { fontSize: 20, lineHeight: 28, fontWeight: '600', color: '#999' },
  tabTextActive: { fontWeight: '700', color: '#111827' },
  tabIndicatorWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 10,
    justifyContent: 'flex-start',
    alignItems: 'center',
    overflow: 'hidden'
  },
  tabIndicator: {
    width: 26,
    height: 10,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    borderRadius: 999
  },
  tabIndicatorActive: { borderBottomColor: '#FF6B6B' },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: 80,
    justifyContent: 'flex-end'
  },
  searchBarContainer: { paddingHorizontal: 16, overflow: 'hidden', marginBottom: 10 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8
  },
  searchPlaceholder: { flex: 1, fontSize: 14, color: '#bcbcbc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 10, paddingBottom: 20 },
  postCard: {
    paddingTop: 12,
    marginBottom: 12,
    overflow: 'hidden'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    gap: 12
  },
  authorWrap: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f0f0' },
  authorTextWrap: { marginLeft: 10, flex: 1 },
  authorName: { fontSize: 15, fontWeight: '700', color: '#030303' },
  authorMeta: { marginTop: 2, fontSize: 13, color: '#999999' },
  followBtn: {
    height: 35,
    borderRadius: 6,
    backgroundColor: '#fb6650',
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  followText: { color: '#fff', fontSize: 14 },
  postContent: {
    marginTop: 10,
    paddingHorizontal: 12,
    color: '#4f4f4f',
    fontSize: 16,
    lineHeight: 25
  },
  mediaWrap: { marginTop: 12, paddingHorizontal: 12 },
  singleImage: {
    width: '100%',
    height: CARD_WIDTH * 0.62,
    borderRadius: 12,
    backgroundColor: '#f0f0f0'
  },
  videoContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative'
  },
  videoCover: {
    width: '100%',
    height: CARD_WIDTH * 0.62,
    backgroundColor: '#f0f0f0'
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)'
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP
  },
  gridImage: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    borderRadius: 10,
    backgroundColor: '#f0f0f0'
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 16
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, marginRight: 8 },
  actionIcon: {
    width: 18,
    height: 18,
    tintColor: '#999999'
  },
  actionIconActive: {
    tintColor: '#fb6650'
  },
  actionText: { color: '#999999', fontSize: 16 },
  moreBtn: {
    marginLeft: 'auto',
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    width: SCREEN_WIDTH - CARD_HORIZONTAL * 2
  },
  emptyText: { fontSize: 16, color: '#999', marginTop: 16 },
  emptyHint: { fontSize: 13, color: '#ccc', marginTop: 8 }
})
