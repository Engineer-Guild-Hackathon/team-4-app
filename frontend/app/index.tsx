import React, { useState } from 'react'; // 1. useStateをインポート
import { StyleSheet } from 'react-native';
import { View } from 'react-native';
import { SimpleTopicView } from '../components/SimpleTopicView';
import { useAuth } from '@/hooks/useAuth';
import { TouchableOpacity, Text } from 'react-native';
import PostListModal from '../components/posts/PostListModal';

interface Topic {
  id: number;
  title: string;
  description: string;
}

export default function HomeScreen() {
  const { logout, accessToken, loading } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);

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
      <SimpleTopicView/>
      {/* 投稿一覧モーダルを開くボタン */}
      <TouchableOpacity
        style={styles.postsButton} // ログアウトボタンと区別するスタイル
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.postsButtonText}>投稿を見る</Text>
      </TouchableOpacity>

      {/* モーダルコンポーネントを配置 */}
      <PostListModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
    postsButton: {
    position: 'absolute',
    right: 24,
    bottom: 112, // ログアウトボタンの上に配置
    backgroundColor: '#3b82f6', // 青系
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 32,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  postsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1,
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
