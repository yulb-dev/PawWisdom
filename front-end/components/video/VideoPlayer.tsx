import React, { useEffect, useState } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
  Text,
  SafeAreaView,
  Pressable
} from 'react-native'
import { VideoView, useVideoPlayer } from 'expo-video'
import { Ionicons } from '@expo/vector-icons'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

interface VideoPlayerProps {
  videoUri: string
  visible: boolean
  initialPositionMs?: number
  onClose: (positionMs: number) => void
}

export default function VideoPlayer({
  videoUri,
  visible,
  initialPositionMs = 0,
  onClose
}: VideoPlayerProps) {
  const player = useVideoPlayer(videoUri, (videoPlayer) => {
    videoPlayer.loop = false
  })
  const [isPlaying, setIsPlaying] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [duration, setDuration] = useState(0)
  const [position, setPosition] = useState(0)
  const [seekPosition, setSeekPosition] = useState(0)
  const [isSeeking, setIsSeeking] = useState(false)
  const [resumeAfterSeek, setResumeAfterSeek] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [progressBarWidth, setProgressBarWidth] = useState(0)

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    if (visible) {
      setIsLoading(true)
      const startPosition = Math.max(0, initialPositionMs)
      player.currentTime = startPosition / 1000
      setPosition(startPosition)
      setSeekPosition(startPosition)
      player.play()
      setIsPlaying(true)
      setShowControls(true)
    } else {
      player.pause()
      setIsSeeking(false)
      setResumeAfterSeek(false)
      setIsFullscreen(false)
    }
  }, [initialPositionMs, player, visible, videoUri])

  useEffect(() => {
    const interval = setInterval(() => {
      const durationMillis = Number.isFinite(player.duration) ? player.duration * 1000 : 0
      const positionMillis = Math.max(0, player.currentTime * 1000)
      const isPlayingNow = player.playing

      setDuration(durationMillis)
      if (!isSeeking) {
        setPosition(positionMillis)
        setSeekPosition(positionMillis)
      }
      setIsPlaying(isPlayingNow)

      if (durationMillis > 0) {
        setIsLoading(false)
      }

      if (durationMillis > 0 && positionMillis >= durationMillis - 100) {
        setIsPlaying(false)
      }
    }, 200)

    return () => {
      clearInterval(interval)
    }
  }, [isSeeking, player])

  const handlePlayPause = () => {
    if (isPlaying) {
      player.pause()
    } else {
      player.play()
    }
    setIsPlaying(!isPlaying)
  }

  const getSeekPositionFromTouch = (locationX: number, barWidth: number) => {
    if (barWidth <= 0 || duration <= 0) return 0
    const ratio = Math.min(Math.max(locationX / barWidth, 0), 1)
    return ratio * duration
  }

  const handleSeekStart = (locationX: number, barWidth: number) => {
    const nextPosition = getSeekPositionFromTouch(locationX, barWidth)
    setResumeAfterSeek(player.playing)
    player.pause()
    setIsSeeking(true)
    setSeekPosition(nextPosition)
    setPosition(nextPosition)
  }

  const handleSeeking = (locationX: number, barWidth: number) => {
    if (!isSeeking) return
    const nextPosition = getSeekPositionFromTouch(locationX, barWidth)
    setSeekPosition(nextPosition)
    setPosition(nextPosition)
  }

  const handleSeekEnd = (locationX: number, barWidth: number) => {
    if (!isSeeking) return
    const nextPosition = getSeekPositionFromTouch(locationX, barWidth)
    setSeekPosition(nextPosition)
    setPosition(nextPosition)
    player.currentTime = nextPosition / 1000
    if (resumeAfterSeek) {
      player.play()
    }
    setIsSeeking(false)
    setResumeAfterSeek(false)
  }

  const handleClose = () => {
    player.pause()
    const currentPosition = Math.max(0, player.currentTime * 1000)
    const shouldResetToStart = duration > 0 && currentPosition >= duration - 300
    onClose(shouldResetToStart ? 0 : currentPosition)
  }

  const handleScreenPress = () => {
    setShowControls(!showControls)
  }

  const currentProgress = isSeeking ? seekPosition : position

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={32} color="#fff" />
        </TouchableOpacity>

        <View style={styles.videoContainer}>
          <VideoView
            player={player}
            style={[styles.video, isFullscreen && styles.videoFullscreen]}
            contentFit={isFullscreen ? 'cover' : 'contain'}
            nativeControls={false}
          />

          <Pressable style={styles.touchLayer} onPress={handleScreenPress} />

          {/* 加载指示器 */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}

          {/* 播放控制 */}
          {!isLoading && showControls && (
            <>
              <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
                <Ionicons
                  name={isPlaying ? 'pause-circle' : 'play-circle'}
                  size={64}
                  color="rgba(255, 255, 255, 0.9)"
                />
              </TouchableOpacity>

              {/* 进度条 */}
              <View style={styles.controlsContainer}>
                <Text style={styles.timeText}>{formatTime(currentProgress)}</Text>
                <View
                  style={styles.progressBar}
                  onStartShouldSetResponder={() => true}
                  onMoveShouldSetResponder={() => true}
                  onLayout={(event) => setProgressBarWidth(event.nativeEvent.layout.width)}
                  onResponderGrant={(event) =>
                    handleSeekStart(event.nativeEvent.locationX, progressBarWidth)
                  }
                  onResponderMove={(event) =>
                    handleSeeking(event.nativeEvent.locationX, progressBarWidth)
                  }
                  onResponderRelease={(event) =>
                    handleSeekEnd(event.nativeEvent.locationX, progressBarWidth)
                  }
                  onResponderTerminate={(event) =>
                    handleSeekEnd(event.nativeEvent.locationX, progressBarWidth)
                  }
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: duration > 0 ? `${(currentProgress / duration) * 100}%` : '0%'
                      }
                    ]}
                  />
                </View>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
                <TouchableOpacity
                  onPress={() => setIsFullscreen(!isFullscreen)}
                  style={styles.fullscreenButton}
                >
                  <Ionicons
                    name={isFullscreen ? 'contract-outline' : 'expand-outline'}
                    size={18}
                    color="#fff"
                  />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center'
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center'
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT
  },
  videoFullscreen: {
    width: SCREEN_HEIGHT,
    height: SCREEN_WIDTH,
    transform: [{ rotate: '90deg' }]
  },
  touchLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 2
  },
  playButton: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 3
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 2
  },
  timeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500'
  },
  fullscreenButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center'
  }
})
