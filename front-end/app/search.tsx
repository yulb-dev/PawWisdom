import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image as RNImage,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// 模拟数据
const SEARCH_HISTORY = ['春游', 'Teddy', 'Toy', 'Show MOE', '狗狗不喜欢吃饭']
const TOP_SEARCHES = ['狗粮', '圈子', '走失狗狗启示']
const HOT_CIRCLES = [
  {
    id: '1',
    name: '金毛',
    image:
      'https://images.unsplash.com/photo-1633545863581-4c2d7b1f8e9c?w=200&h=200&fit=crop',
  },
  {
    id: '2',
    name: '狗头背影',
    image:
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop',
  },
  {
    id: '3',
    name: '领养',
    image:
      'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=200&h=200&fit=crop',
  },
  {
    id: '4',
    name: '拉布拉多',
    image:
      'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=200&h=200&fit=crop',
  },
]

const POPULAR_QA = [
  {
    id: '1',
    question: '狗狗为什么不喜欢吃饭？',
    answers: 132,
    image:
      'https://images.unsplash.com/photo-1598133893933-2fd4e5a2c0f7?w=200&h=200&fit=crop',
  },
  {
    id: '2',
    question: '狗狗第一次发烧怎么办？',
    answers: 2356,
    image:
      'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=200&h=200&fit=crop',
  },
]

export default function SearchScreen() {
  const router = useRouter()
  const [searchText, setSearchText] = useState('')

  const handleSearch = () => {
    if (searchText.trim()) {
      // TODO: 实际搜索逻辑
      console.log('搜索:', searchText)
    }
  }

  const clearHistory = () => {
    // TODO: 清除搜索历史
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 搜索栏 */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={23} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="发现更多..."
            placeholderTextColor="#bcbcbc"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            autoFocus
            returnKeyType="search"
          />
          <TouchableOpacity onPress={() => {}}>
            <Ionicons name="mic" size={23} color="#777777" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>取消</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* 搜索历史 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>搜索历史</Text>
            <TouchableOpacity onPress={clearHistory}>
              <Ionicons name="trash-outline" size={20} color="#999" />
            </TouchableOpacity>
          </View>
          <View style={styles.tagContainer}>
            {SEARCH_HISTORY.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.tag}
                onPress={() => setSearchText(item)}
              >
                <Text style={styles.tagText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 热门搜索 */}
        <View style={styles.section}>
          <View
            style={[styles.sectionHeader, { justifyContent: 'flex-start' }]}
          >
            <Text style={[styles.sectionTitle, { flex: 0 }]}>热门搜索</Text>
            <Ionicons
              name="flame"
              size={20}
              color="#FF6B6B"
              style={[styles.sectionIcon, { marginRight: 0, marginLeft: 4 }]}
            />
          </View>
          <View style={styles.tagContainer}>
            {TOP_SEARCHES.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.tag}
                onPress={() => setSearchText(item)}
              >
                <Text style={styles.tagText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 热门宠物 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>热门宠物</Text>
            <TouchableOpacity>
              <Text style={styles.moreText}>更多</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.circleScroll}
            contentContainerStyle={styles.circleContainer}
          >
            {HOT_CIRCLES.map((circle, index) => (
              <TouchableOpacity
                key={circle.id}
                style={[
                  styles.circleItem,
                  index === 0 && styles.firstCircle,
                  index === HOT_CIRCLES.length - 1 && styles.lastCircle,
                ]}
              >
                <RNImage
                  source={{ uri: circle.image }}
                  style={styles.circleImage}
                />
                <Text style={styles.circleName}>{circle.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 热门问答 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>热门问答</Text>
          {POPULAR_QA.map((qa) => (
            <TouchableOpacity key={qa.id} style={styles.qaItem}>
              <View style={styles.qaContent}>
                <Ionicons name="help-circle" size={16} color="#FF6B6B" />
                <View style={styles.qaTextContainer}>
                  <Text style={styles.qaQuestion}>{qa.question}</Text>
                  <Text style={styles.qaAnswers}>{qa.answers} 条回答</Text>
                </View>
              </View>
              <RNImage source={{ uri: qa.image }} style={styles.qaImage} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 0,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  cancelText: {
    fontSize: 15,
    color: '#777777',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    marginRight: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#050505',
    flex: 1,
  },
  moreText: {
    fontSize: 14,
    color: '#999',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    backgroundColor: '#fafafa',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#505050',
    fontWeight: '500',
  },
  circleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  circleItem: {
    alignItems: 'center',
    width: 90,
    marginRight: 24,
  },
  circleImage: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
  },
  circleScroll: {
    marginHorizontal: -16,
  },
  firstCircle: {
    marginLeft: 18,
  },
  lastCircle: {
    marginRight: 18,
  },
  circleName: {
    fontSize: 12,
    color: '#505050',
    textAlign: 'center',
    fontWeight: '500',
  },
  qaItem: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  qaContent: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  qaTextContainer: {
    flex: 1,
  },
  qaQuestion: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 4,
  },
  qaAnswers: {
    fontSize: 13,
    color: '#999',
  },
  qaImage: {
    width: 110,
    height: 65,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginLeft: 12,
  },
})
