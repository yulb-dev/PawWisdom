import { createContext, ReactNode, useContext, useMemo, useState } from 'react'
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type DialogOptions = {
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
}

type DialogContextValue = {
  showDialog: (options: DialogOptions) => void
}

const DialogContext = createContext<DialogContextValue | null>(null)

export function DialogProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false)
  const [options, setOptions] = useState<DialogOptions | null>(null)
  const insets = useSafeAreaInsets()

  const showDialog = (nextOptions: DialogOptions) => {
    setOptions({
      confirmText: '知道了',
      cancelText: '取消',
      showCancel: false,
      ...nextOptions
    })
    setVisible(true)
  }

  const handleClose = () => {
    setVisible(false)
  }

  const handleConfirm = async () => {
    handleClose()
    await options?.onConfirm?.()
  }

  const handleCancel = () => {
    handleClose()
    options?.onCancel?.()
  }

  const contextValue = useMemo(() => ({ showDialog }), [])

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        presentationStyle="overFullScreen"
      >
        <View
          style={[
            styles.overlay,
            {
              paddingTop: 24 + insets.top,
              paddingBottom: 24 + insets.bottom,
              paddingLeft: 24 + insets.left,
              paddingRight: 24 + insets.right
            }
          ]}
        >
          <View style={styles.card}>
            <Text style={styles.title}>{options?.title}</Text>
            {!!options?.message && <Text style={styles.message}>{options.message}</Text>}
            <View style={styles.actions}>
              {options?.showCancel && (
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                  <Text style={styles.cancelText}>{options.cancelText}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                <Text style={styles.confirmText}>{options?.confirmText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </DialogContext.Provider>
  )
}

export function useDialog() {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error('useDialog must be used within DialogProvider')
  }
  return context
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingHorizontal: 24,
    paddingVertical: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 20
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12
  },
  message: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
    marginBottom: 20
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center'
  },
  cancelText: {
    color: '#9ca3af',
    fontSize: 15,
    fontWeight: '600'
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#455af7',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center'
  },
  confirmText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600'
  }
})
