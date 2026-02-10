import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>首页</Text>
          <View style={styles.logoWrap}>
            <Image source={require('../../assets/icons/logo.svg')} style={styles.logo} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>欢迎回来</Text>
          <Text style={styles.cardText}>今天也要好好照顾你的宠物哦</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>快捷入口</Text>
          <Text style={styles.cardText}>在「宠物」里新增、管理和记录宠物信息</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827'
  },
  logoWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  logo: {
    width: 22,
    height: 22
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6
  },
  cardText: {
    fontSize: 14,
    color: '#6b7280'
  }
})
