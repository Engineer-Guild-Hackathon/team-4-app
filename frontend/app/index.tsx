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

// モックデータ
const mockTopics: Topic[] = [
  {
    id: 1,
    title: 'プログラミング',
    description: 'コードの書き方',
  },
  {
    id: 2,
    title: 'デザイン',
    description: 'UI/UXの基礎',
  },
  {
    id: 3,
    title: 'データベース',
    description: 'SQLの基本操作',
  },
  {
    id: 4,
    title: 'ネットワーク',
    description: 'HTTP通信の仕組み',
  },
  {
    id: 5,
    title: 'セキュリティ',
    description: '暗号化と認証',
  },
];

export default function HomeScreen() {
  const { logout } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  return (
    <View style={styles.container}>
      <SimpleTopicView topics={mockTopics} />
      {/* 投稿一覧モーダルを開くボタン */}
      <TouchableOpacity
        style={styles.postsButton} // ログアウトボタンと区別するスタイル
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.postsButtonText}>投稿を見る</Text>
      </TouchableOpacity>

      {/* 右下に色付きログアウトボタン */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={logout}
        activeOpacity={0.8}
      >
        <Text style={styles.logoutText}>ログアウト</Text>
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
    backgroundColor: '#fffff',
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
  logoutButton: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: '#e11d48', // ピンク系
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 32,
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1,
  },
});
