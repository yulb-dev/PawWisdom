import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Dimensions
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { petService, Pet } from '../services/pet.service'
import { useDialog } from '../components/ui/DialogProvider'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_MARGIN = 16
const CARD_GAP = 12
const CARD_WIDTH = (SCREEN_WIDTH - CARD_MARGIN * 2 - CARD_GAP) / 2

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
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.title}>我的宠物</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder="搜索宠物名称或品种"
              placeholderTextColor="#9ca3af"
              value={search}
              onChangeText={setSearch}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color="#9ca3af" />
              </TouchableOpacity>
            ) : null}
          </View>
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
              activeOpacity={0.7}
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
                <View style={styles.petSpeciesBadge}>
                  <Text style={styles.petSpeciesBadgeText}>
                    {item.species === 'cat' ? '🐱' : item.species === 'dog' ? '🐶' : '🐾'}
                  </Text>
                </View>
              </View>
              <View style={styles.petInfo}>
                <Text style={styles.petName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.petDetail} numberOfLines={1}>
                  {item.breed || '未知品种'}
                </Text>
                <Text style={styles.petAge}>{getAgeText(item.birthday)}</Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="paw" size={48} color="#ffffff" />
              </View>
              <Text style={styles.emptyTitle}>还没有宠物</Text>
              <Text style={styles.emptyText}>添加你的第一只宠物，开启温馨的养宠生活</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/pets/edit')}
              >
                <Ionicons name="add" size={20} color="#ffffff" />
                <Text style={styles.emptyButtonText}>添加宠物</Text>
              </TouchableOpacity>
            </View>
          }
        />

        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 20 }]}
          onPress={() => router.push('/pets/edit')}
        >
          <Ionicons name="add" size={28} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fafafa'
  },
  container: {
    flex: 1,
    backgroundColor: '#fafafa'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: -0.5
  },
  searchRow: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff'
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f8fa',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937'
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  tabItem: {
    paddingBottom: 4
  },
  tabItemActive: {
    borderBottomWidth: 2.5,
    borderBottomColor: '#f97316'
  },
  tabText: {
    fontSize: 15,
    color: '#9ca3af',
    fontWeight: '600'
  },
  tabTextActive: {
    color: '#f97316'
  },
  listContent: {
    paddingHorizontal: CARD_MARGIN,
    paddingTop: 20,
    paddingBottom: 120
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: CARD_GAP
  },
  petCard: {
    width: CARD_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  petImageWrap: {
    width: '100%',
    aspectRatio: 0.95,
    backgroundColor: '#f3f4f6',
    position: 'relative'
  },
  petImage: {
    width: '100%',
    height: '100%'
  },
  petSpeciesBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3
  },
  petSpeciesBadgeText: {
    fontSize: 16
  },
  petInfo: {
    padding: 12
  },
  petName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4
  },
  petDetail: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6
  },
  petAge: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500'
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3
  },
  emptyCard: {
    marginTop: 60,
    marginHorizontal: 20,
    padding: 32,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f97316',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 24
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8
  }
})
