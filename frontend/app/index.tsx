import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { TreeViewer } from '../components/TreeViewer';

export default function HomeScreen() {
  const { accessToken, loading } = useAuth();

  // ローディング中は何も表示しない
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </View>
    );
  }

  // 認証されていない場合はログイン画面にリダイレクト
  if (!accessToken) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>ログインが必要です</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TreeViewer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 50, // Add padding to avoid overlap with status bar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#6b7280',
  },
});