import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

type VerificationCodeInputProps = {
  code: string
  length?: number
}

type NumericKeypadProps = {
  onPressNumber: (value: string) => void
  onBackspace: () => void
}

export function VerificationCodeInput({ code, length = 4 }: VerificationCodeInputProps) {
  const activeIndex = Math.min(code.length, length - 1)

  return (
    <View>
      <View style={styles.codeRow}>
        {Array.from({ length }).map((_, index) => {
          const isActive = index === activeIndex
          const hasValue = index < code.length
          return (
            <View
              key={`${index}-code`}
              style={[styles.codeBox, isActive && styles.codeBoxActive]}
            >
              <Text style={styles.codeText}>{hasValue ? code[index] : ''}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

export function NumericKeypad({ onPressNumber, onBackspace }: NumericKeypadProps) {
  return (
    <View style={styles.keypad}>
      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'].map((key) => {
        if (key === 'back') {
          return (
            <TouchableOpacity key={key} style={styles.keypadButton} onPress={onBackspace}>
              <Ionicons name="backspace-outline" size={24} color="#111827" />
            </TouchableOpacity>
          )
        }
        if (key === '.') {
          return (
            <View key={key} style={[styles.keypadButton, styles.keypadButtonDisabled]}>
              <Text style={styles.keypadText}>·</Text>
            </View>
          )
        }
        return (
          <TouchableOpacity
            key={key}
            style={styles.keypadButton}
            onPress={() => onPressNumber(key)}
          >
            <Text style={styles.keypadText}>{key}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  codeRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 12,
    marginBottom: 16
  },
  codeBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff'
  },
  codeBoxActive: {
    borderColor: '#455af7'
  },
  codeText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827'
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  keypadButton: {
    width: '30%',
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14
  },
  keypadButtonDisabled: {
    opacity: 0.3
  },
  keypadText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111827'
  }
})
