import React, { useMemo, useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Platform
} from 'react-native'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView
} from 'react-native-gesture-handler'
import * as VideoThumbnails from 'expo-video-thumbnails'
import { useVideoPlayer } from 'expo-video'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const TIMELINE_HANDLE_WIDTH = 56
const TIMELINE_HEIGHT = 64
const TIMELINE_ITEM_MIN_WIDTH = 36
const MIN_TIMELINE_FRAMES = 6
const MAX_TIMELINE_FRAMES = 24
const MIN_CAPTURE_INTERVAL_MS = 180
const PREVIEW_FRAME_THROTTLE_MS = 60
const CONFIRM_CAPTURE_WAIT_MS = 120
const DURATION_POLL_INTERVAL = 120
const DURATION_POLL_RETRY = 18

interface VideoCoverPickerProps {
  videoUri: string
  onCoverSelected: (coverUri: string) => void
  onClose: () => void
}

export default function VideoCoverPicker({
  videoUri,
  onCoverSelected,
  onClose
}: VideoCoverPickerProps) {
  // 使用 useVideoPlayer 仅用于获取视频元数据（时长），不用于显示
  const player = useVideoPlayer(videoUri, (videoPlayer) => {
    videoPlayer.loop = false
    videoPlayer.pause()
  })
  const [thumbnails, setThumbnails] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [videoDuration, setVideoDuration] = useState(0)
  const [currentPosition, setCurrentPosition] = useState(0)
  const [timelineWidth, setTimelineWidth] = useState(0)
  const [selectorPreviewUri, setSelectorPreviewUri] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const selectorLeft = useSharedValue(0)
  const selectorLeftRef = useRef(0)
  const dragStartLeftRef = useRef(0)
  const draggingGestureRef = useRef(false)
  const framePreviewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const frameRequestIdRef = useRef(0)

  useEffect(() => {
    generateTimelineThumbnails()
  }, [videoUri, timelineWidth])

  useEffect(() => {
    if (videoDuration <= 0 || timelineWidth <= 0 || isDragging) return
    syncSelectorByPosition(currentPosition)
  }, [videoDuration, timelineWidth, currentPosition, isDragging])

  const waitForVideoDuration = async (): Promise<number> => {
    // 使用 expo-video 的 player.duration 获取视频时长
    for (let i = 0; i < DURATION_POLL_RETRY; i += 1) {
      const durationMillis = Number.isFinite(player.duration) ? player.duration * 1000 : 0
      if (durationMillis > 0) {
        return durationMillis
      }
      await new Promise((resolve) => setTimeout(resolve, DURATION_POLL_INTERVAL))
    }
    return 0
  }

  /**
   * 计算时间轴最多可以展示多少帧图片
   * 根据屏幕宽度 / 单帧最小宽度计算
   * 限制在 6-24 帧之间
   */
  const maxTimelineFrameCount = useMemo(() => {
    const availableWidth = timelineWidth > 0 ? timelineWidth : SCREEN_WIDTH - 32
    const countByWidth = Math.floor(availableWidth / TIMELINE_ITEM_MIN_WIDTH)
    return Math.max(MIN_TIMELINE_FRAMES, Math.min(MAX_TIMELINE_FRAMES, countByWidth))
  }, [timelineWidth])

  const timelineItemWidth = useMemo(() => {
    const containerWidth = timelineWidth > 0 ? timelineWidth : SCREEN_WIDTH - 32
    const displayCount =
      thumbnails.length > 0 ? thumbnails.length : Math.max(1, maxTimelineFrameCount)
    return containerWidth / displayCount
  }, [timelineWidth, thumbnails.length, maxTimelineFrameCount])

  const getSelectorMaxLeft = () => Math.max(0, timelineWidth - TIMELINE_HANDLE_WIDTH)

  const clampLeft = (left: number) => Math.max(0, Math.min(getSelectorMaxLeft(), left))
  const clampPosition = (position: number) =>
    Math.max(0, Math.min(videoDuration, position))

  /**
   * 构建时间轴采样点
   * 时间轴仅用于展示，帮助用户快速定位
   * 根据屏幕宽度计算最多展示的帧数，然后均匀采样视频
   * 例如：10秒视频，最多显示10帧，则每隔1秒采样一次
   */
  const buildTimelineTimePoints = (durationMillis: number, frameCount: number) => {
    if (durationMillis <= 0) {
      return [0]
    }
    const durationLimitCount = Math.max(
      1,
      Math.floor(durationMillis / MIN_CAPTURE_INTERVAL_MS)
    )
    const count = Math.max(1, Math.min(frameCount, durationLimitCount))
    const step = durationMillis / count
    // 用每个区间的中心点采样，减少相邻取帧落在同一关键帧上的概率
    const points = Array.from({ length: count }, (_, index) => {
      const centered = (index + 0.5) * step
      return Math.round(Math.max(0, Math.min(durationMillis, centered)))
    })
    return Array.from(new Set(points))
  }

  const generateTimelineThumbnails = async () => {
    try {
      setLoading(true)
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const durationMillis = await waitForVideoDuration()
        setVideoDuration(durationMillis)
        const timePoints = buildTimelineTimePoints(durationMillis, maxTimelineFrameCount)
        const thumbnailPromises = timePoints.map(async (time) => {
          try {
            const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
              time,
              quality: 0.55
            })
            return uri
          } catch (error) {
            console.error(`生成缩略图失败 (${time}ms):`, error)
            return null
          }
        })
        const results = await Promise.all(thumbnailPromises)
        const valid = results.filter((item): item is string => !!item)
        setThumbnails(valid)
        setCurrentPosition(0)
        setSelectorPreviewUri('')
        selectorLeft.value = 0
        selectorLeftRef.current = 0
        await generateSelectorPreviewFrame(0, true, durationMillis)
      }
    } catch (error) {
      console.error('生成缩略图失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateSelectorPreviewFrame = async (
    position: number,
    immediate = false,
    durationOverride?: number
  ) => {
    const activeDuration = durationOverride ?? videoDuration
    if (activeDuration <= 0) return
    const request = async () => {
      const requestId = frameRequestIdRef.current + 1
      frameRequestIdRef.current = requestId
      try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
          time: Math.max(0, Math.min(activeDuration, position)),
          quality: 0.9
        })
        console.log('time', Math.max(0, Math.min(activeDuration, position)))
        if (requestId === frameRequestIdRef.current) {
          console.log('uri', uri)
          setSelectorPreviewUri(uri)
        }
      } catch (error) {
        console.error('生成选中帧预览失败:', error)
      }
    }
    if (immediate) {
      await request()
      return
    }
    if (framePreviewTimeoutRef.current) {
      clearTimeout(framePreviewTimeoutRef.current)
      framePreviewTimeoutRef.current = null
    }
    framePreviewTimeoutRef.current = setTimeout(() => {
      framePreviewTimeoutRef.current = null
      void request()
    }, PREVIEW_FRAME_THROTTLE_MS)
  }

  /**
   * 根据选择框位置更新预览
   * 选择框内容独立于时间轴：
   * 1. 根据选择框在时间轴的位置计算对应的视频时间点
   * 2. 生成该时间点的真实视频帧
   * 3. 同步更新预览区域
   *
   * 时间轴仅用于辅助定位，选择框显示的是精确的视频帧
   */
  const updateSelectionBySelectorLeft = (
    nextLeft: number,
    options?: { updatePreview?: boolean; isDragging?: boolean }
  ) => {
    if (videoDuration <= 0) return
    const clampedLeft = clampLeft(nextLeft)
    selectorLeftRef.current = clampedLeft
    selectorLeft.value = clampedLeft
    const maxLeft = Math.max(1, getSelectorMaxLeft())
    const progress = clampedLeft / maxLeft
    const position = progress * videoDuration
    setCurrentPosition(position)

    // 拖动时也生成真实的视频帧预览（节流处理，避免过于频繁）
    if (options?.isDragging) {
      void generateSelectorPreviewFrame(position, false)
    }
    // 拖动结束时生成高质量预览图
    else if (options?.updatePreview) {
      void generateSelectorPreviewFrame(position, true)
    }
  }

  const syncSelectorByPosition = (position: number) => {
    if (videoDuration <= 0) return
    const maxLeft = getSelectorMaxLeft()
    if (maxLeft <= 0) return
    const progress = Math.max(0, Math.min(1, position / videoDuration))
    const left = progress * maxLeft
    selectorLeftRef.current = left
    selectorLeft.value = left
  }

  useEffect(() => {
    return () => {
      if (framePreviewTimeoutRef.current !== null) {
        clearTimeout(framePreviewTimeoutRef.current)
      }
    }
  }, [])

  const startSelectorDrag = () => {
    setIsDragging(true)
    draggingGestureRef.current = true
    dragStartLeftRef.current = selectorLeftRef.current
  }

  const endSelectorDrag = () => {
    draggingGestureRef.current = false
    const finalLeft = clampLeft(selectorLeftRef.current)
    // 拖动结束时生成高质量预览图
    updateSelectionBySelectorLeft(finalLeft, { updatePreview: true, isDragging: false })
    setIsDragging(false)
  }

  const handleSelectorDragUpdate = (translationX: number) => {
    if (!draggingGestureRef.current) return
    const left = dragStartLeftRef.current + translationX
    // 拖动过程中使用时间轴缩略图实时预览（无闪烁）
    updateSelectionBySelectorLeft(left, { isDragging: true })
  }

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(1)
        .onStart(() => {
          runOnJS(startSelectorDrag)()
        })
        .onUpdate((event) => {
          runOnJS(handleSelectorDragUpdate)(event.translationX)
        })
        .onFinalize(() => {
          runOnJS(endSelectorDrag)()
        }),
    [videoDuration, timelineWidth]
  )

  const selectorAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: selectorLeft.value }]
  }))

  const handleConfirm = async () => {
    try {
      const targetPosition = clampPosition(currentPosition)
      // 生成高质量封面
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: targetPosition,
        quality: 1.0
      })
      if (!uri) {
        throw new Error('生成封面失败')
      }
      onCoverSelected(uri)
      onClose()
    } catch (error) {
      console.error('生成封面失败:', error)
      // 如果生成失败，使用当前预览图作为后备
      if (selectorPreviewUri) {
        onCoverSelected(selectorPreviewUri)
        onClose()
      }
    }
  }

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>选封面</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={onClose}>
              <Text style={styles.exitText}>退出</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerButton, styles.confirmButton]}
              onPress={handleConfirm}
              disabled={loading || videoDuration === 0}
            >
              <Text style={styles.confirmText}>下一步</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 封面预览区域（缩略图预览） */}
        <View style={styles.previewContainer}>
          <View style={styles.previewWrapper}>
            {selectorPreviewUri ? (
              <Image
                source={{ uri: selectorPreviewUri }}
                style={styles.previewImage}
                resizeMode="contain"
                fadeDuration={0}
              />
            ) : (
              <View style={styles.previewPlaceholder}>
                <ActivityIndicator size="large" color="#FF6B6B" />
              </View>
            )}
            {loading ? (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#FF6B6B" />
                <Text style={styles.loadingText}>正在加载视频...</Text>
              </View>
            ) : null}
            <View style={styles.timeDisplay}>
              <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>
            </View>
          </View>
        </View>

        {/* 封面时间轴区域 */}
        {!loading && videoDuration > 0 && (
          <View style={styles.timelineSection}>
            <Text style={styles.sectionTitle}>拖动方框左右滑动，选择最优封面帧</Text>
            <View
              style={styles.timelineContainer}
              onLayout={(event) => {
                const width = event.nativeEvent.layout.width
                setTimelineWidth(width)
                syncSelectorByPosition(currentPosition)
              }}
            >
              <View style={styles.timelineTrack}>
                <View style={styles.timelineContent}>
                  {thumbnails.map((thumbnail, index) => (
                    <View
                      key={index}
                      style={[styles.timelineItem, { width: timelineItemWidth }]}
                    >
                      <Image
                        source={{ uri: thumbnail }}
                        style={styles.timelineThumbnail}
                        resizeMode="cover"
                        fadeDuration={0}
                      />
                    </View>
                  ))}
                </View>
                <GestureDetector gesture={panGesture}>
                  <Animated.View style={[styles.timelineSelector, selectorAnimatedStyle]}>
                    {selectorPreviewUri ? (
                      <Image
                        source={{ uri: selectorPreviewUri }}
                        style={styles.timelineSelectorImage}
                        resizeMode="cover"
                        fadeDuration={0}
                      />
                    ) : (
                      <View style={styles.timelineSelectorPlaceholder} />
                    )}
                  </Animated.View>
                </GestureDetector>
              </View>
            </View>

            <View style={styles.timeInfo}>
              <Text style={styles.timeInfoText}>{formatTime(currentPosition)}</Text>
              <Text style={styles.timeInfoText}>{formatTime(videoDuration)}</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1
  },
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a'
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff'
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20
  },
  confirmButton: {
    backgroundColor: '#FF6B6B'
  },
  exitText: {
    fontSize: 15,
    color: '#fff'
  },
  confirmText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600'
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000'
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    gap: 16
  },
  loadingText: {
    fontSize: 14,
    color: '#999'
  },
  previewWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  previewImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.33,
    backgroundColor: '#000'
  },
  previewPlaceholder: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.33,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center'
  },
  timeDisplay: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  timeText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500'
  },
  timelineSection: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 20,
    paddingHorizontal: 16
  },
  sectionTitle: {
    fontSize: 13,
    color: '#999',
    paddingHorizontal: 0,
    marginBottom: 16,
    textAlign: 'center'
  },
  timelineContainer: {
    width: '100%',
    paddingHorizontal: 0
  },
  timelineTrack: {
    width: '100%',
    height: TIMELINE_HEIGHT,
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#2a2a2a'
  },
  timelineContent: {
    height: '100%',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch'
  },
  timelineItem: {
    height: '100%'
  },
  timelineThumbnail: {
    width: '100%',
    height: '100%'
  },
  timelineSelector: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: TIMELINE_HANDLE_WIDTH,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5
  },
  timelineSelectorImage: {
    width: '100%',
    height: '100%'
  },
  timelineSelectorPlaceholder: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10
  },
  timeInfoText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500'
  }
  // 保留样式尾部，便于后续扩展
})
