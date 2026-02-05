import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { petService, Pet } from '../services/pet.service'
import { useDialog } from '../components/ui/DialogProvider'

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'cat', label: '猫' },
  { key: 'dog', label: '狗' },
  { key: 'other', label: '其他' }
] as const

type SpeciesTab = (typeof TABS)[number]['key']

export default function PetsScreen() {
  const { action } = useLocalSearchParams<{ action?: string }>()
  const { showDialog } = useDialog()
  const insets = useSafeAreaInsets()
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedTab, setSelectedTab] = useState<SpeciesTab>('all')
  const hasMounted = useRef(false)

  useEffect(() => {
    if (action === 'add') {
      router.replace('/pets/edit')
    }
  }, [action])

  useEffect(() => {
    loadPets()
  }, [])

  useFocusEffect(
    useCallback(() => {
      if (hasMounted.current) {
        refreshPets()
      } else {
        hasMounted.current = true
      }
    }, [])
  )

  const loadPets = async () => {
    try {
      const data = await petService.getMyPets()
      setPets(data)
    } catch (error) {
      showDialog({ title: '错误', message: '加载宠物列表失败' })
    } finally {
      setLoading(false)
    }
  }

  const refreshPets = async () => {
    setRefreshing(true)
    try {
      const data = await petService.getMyPets()
      setPets(data)
    } catch (error) {
      showDialog({ title: '错误', message: '刷新宠物列表失败' })
    } finally {
      setRefreshing(false)
    }
  }

  const handleDelete = (pet: Pet) => {
    showDialog({
      title: '删除宠物',
      message: `确定要删除 ${pet.name} 吗？`,
      confirmText: '删除',
      cancelText: '取消',
      showCancel: true,
      onConfirm: async () => {
        try {
          await petService.deletePet(pet.id)
          refreshPets()
        } catch (error) {
          showDialog({ title: '错误', message: '删除宠物失败' })
        }
      }
    })
  }

  const filteredPets = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return pets.filter((pet) => {
      const matchesTab = selectedTab === 'all' ? true : pet.species === selectedTab
      const matchesSearch = keyword
        ? `${pet.name}${pet.breed || ''}`.toLowerCase().includes(keyword)
        : true
      return matchesTab && matchesSearch
    })
  }, [pets, search, selectedTab])

  const getAgeText = (birthday?: string) => {
    if (!birthday) return '年龄未知'
    const birthDate = new Date(birthday)
    if (Number.isNaN(birthDate.getTime())) return '年龄未知'

    const now = new Date()
    let years = now.getFullYear() - birthDate.getFullYear()
    let months = now.getMonth() - birthDate.getMonth()
    const days = now.getDate() - birthDate.getDate()

    if (days < 0) {
      months -= 1
    }
    if (months < 0) {
      years -= 1
      months += 12
    }

    if (years > 0) {
      return months > 0 ? `${years}岁${months}个月` : `${years}岁`
    }
    if (months > 0) {
      return `${months}个月`
    }
    return '不到1个月'
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#b65bff" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>宠物档案</Text>
        </View>

        <View style={styles.searchRow}>
          <Ionicons name="search" size={20} color="#b0b6bf" />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索宠物"
            placeholderTextColor="#b0b6bf"
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity style={styles.filterButton} onPress={() => setSearch('')}>
            <Ionicons name="options-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, selectedTab === tab.key && styles.tabItemActive]}
              onPress={() => setSelectedTab(tab.key)}
            >
              <Text
                style={[styles.tabText, selectedTab === tab.key && styles.tabTextActive]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filteredPets}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refreshPets} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.petCard}
              onPress={() =>
                router.push({ pathname: '/pets/edit', params: { id: item.id } })
              }
              onLongPress={() => handleDelete(item)}
            >
              <View style={styles.petImageWrap}>
                <Image
                  source={
                    item.avatarUrl
                      ? { uri: item.avatarUrl }
                      : require('../assets/images/default_avatar.webp')
                  }
                  style={styles.petImage}
                  contentFit="cover"
                />
              </View>
              <View style={styles.petInfo}>
                <Text style={styles.petName}>{item.name}</Text>
                <Text style={styles.petAge}>{getAgeText(item.birthday)}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Ionicons name="paw-outline" size={56} color="#cbd5f5" />
              <Text style={styles.emptyText}>还没有宠物档案</Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push('/pets/edit')}
              >
                <Text style={styles.primaryButtonText}>添加第一只宠物</Text>
              </TouchableOpacity>
            </View>
          }
        />

        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 24 }]}
          onPress={() => router.push('/pets/edit')}
        >
          <Ionicons name="add" size={26} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f6fb'
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f6fb',
    paddingHorizontal: 16
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fb'
  },
  header: {
    paddingVertical: 16
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827'
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827'
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#d59cff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabRow: {
    flexDirection: 'row',
    gap: 20,
    paddingVertical: 18
  },
  tabItem: {
    paddingBottom: 6
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#111827'
  },
  tabText: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '500'
  },
  tabTextActive: {
    color: '#111827'
  },
  listContent: {
    paddingBottom: 120
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16
  },
  petCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 12,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3
  },
  petImageWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6'
  },
  petImage: {
    width: '100%',
    height: '100%'
  },
  petInfo: {
    paddingTop: 10
  },
  petName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827'
  },
  petAge: {
    marginTop: 4,
    fontSize: 13,
    color: '#9ca3af'
  },
  emptyCard: {
    marginTop: 40,
    padding: 24,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 20
  },
  primaryButton: {
    backgroundColor: '#b65bff',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 16
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600'
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#b65bff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6
  }
})
