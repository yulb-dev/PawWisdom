import React, { useEffect, useState } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
  Text,
  SafeAreaView
} from 'react-native'
import { VideoView, useVideoPlayer } from 'expo-video'
import { Ionicons } from '@expo/vector-icons'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

interface VideoPlayerProps {
  videoUri: string
  visible: boolean
  onClose: () => void
}

export default function VideoPlayer({ videoUri, visible, onClose }: VideoPlayerProps) {
  const player = useVideoPlayer(videoUri, (videoPlayer) => {
    videoPlayer.loop = false
  })
  const [isPlaying, setIsPlaying] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [duration, setDuration] = useState(0)
  const [position, setPosition] = useState(0)
  const [showControls, setShowControls] = useState(true)

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    if (visible) {
      setIsLoading(true)
      player.currentTime = 0
      player.play()
      setIsPlaying(true)
    } else {
      player.pause()
    }
  }, [player, visible, videoUri])

  useEffect(() => {
    const interval = setInterval(() => {
      const durationMillis = Number.isFinite(player.duration) ? player.duration * 1000 : 0
      const positionMillis = Math.max(0, player.currentTime * 1000)
      const isPlayingNow = player.playing

      setDuration(durationMillis)
      setPosition(positionMillis)
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
  }, [player])

  const handlePlayPause = () => {
    if (isPlaying) {
      player.pause()
    } else {
      player.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleClose = () => {
    player.pause()
    player.currentTime = 0
    onClose()
  }

  const handleScreenPress = () => {
    setShowControls(!showControls)
  }

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={32} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.videoContainer}
          activeOpacity={1}
          onPress={handleScreenPress}
        >
          <VideoView
            player={player}
            style={styles.video}
            contentFit="contain"
          />

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
                <Text style={styles.timeText}>{formatTime(position)}</Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: duration > 0 ? `${(position / duration) * 100}%` : '0%'
                      }
                    ]}
                  />
                </View>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>
            </>
          )}
        </TouchableOpacity>
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
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  playButton: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center'
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
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
  }
})
