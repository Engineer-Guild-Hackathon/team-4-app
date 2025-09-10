import React from 'react';
import { StyleSheet } from 'react-native';
import { View } from 'react-native';
import { SimpleTopicView } from '../components/SimpleTopicView';
import { useAuth } from '@/hooks/useAuth';
import { TouchableOpacity, Text } from 'react-native';

export default function HomeScreen() {
  const { logout, accessToken, loading } = useAuth();
  
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
      <SimpleTopicView />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
