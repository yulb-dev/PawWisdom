import { useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useDialog } from '../components/ui/DialogProvider'

// 动态导入 expo-camera，避免在 Web 平台出错
let CameraView: any = null
let useCameraPermissions: any = null
let BarcodeScanningResult: any = null

if (Platform.OS !== 'web') {
  try {
    const Camera = require('expo-camera')
    CameraView = Camera.CameraView
    useCameraPermissions = Camera.useCameraPermissions
    BarcodeScanningResult = Camera.BarcodeScanningResult
  } catch (error) {
    console.warn('Failed to load expo-camera:', error)
  }
}

export default function ScanScreen() {
  const { showDialog } = useDialog()

  // Web 平台不支持相机
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.tip}>Web 平台暂不支持扫码功能</Text>
          <Text style={styles.subtitle}>请在移动设备上使用此功能</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={() => router.back()}>
            <Text style={styles.permissionText}>返回</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // 原生平台使用相机
  return <CameraScanScreen showDialog={showDialog} />
}

function CameraScanScreen({ showDialog }: { showDialog: any }) {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)

  const handleBarCodeScanned = ({ data }: any) => {
    if (scanned) return
    setScanned(true)
    showDialog({ title: '扫码结果', message: data })
  }

  if (!permission) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.tip}>正在检查相机权限...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.tip}>需要相机权限才能扫码</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionText}>授权相机</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />
        <View style={styles.overlay}>
          <Text style={styles.scanText}>对准二维码即可自动识别</Text>
          {scanned && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.resetText}>重新扫码</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000'
  },
  container: {
    flex: 1
  },
  camera: {
    flex: 1
  },
  overlay: {
    position: 'absolute',
    bottom: 32,
    left: 20,
    right: 20,
    alignItems: 'center'
  },
  scanText: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 16
  },
  resetButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    borderColor: '#ffffff'
  },
  resetText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600'
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#ffffff'
  },
  tip: {
    fontSize: 15,
    color: '#111111',
    marginBottom: 8,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 20,
    textAlign: 'center'
  },
  permissionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#f96853'
  },
  permissionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600'
  }
})
