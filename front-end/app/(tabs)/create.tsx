import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function CreateScreen() {
  // 这个页面不会被显示，因为在 _layout.tsx 中拦截了 tabPress 事件
  // 保留这个文件是为了满足 expo-router 的路由要求
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
