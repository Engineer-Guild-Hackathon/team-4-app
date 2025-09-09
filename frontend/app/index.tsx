import React from 'react';
import { StyleSheet } from 'react-native';
import { View } from 'react-native';
import { SimpleTopicView } from '../components/SimpleTopicView';
import { useAuth } from '@/hooks/useAuth';
import { TouchableOpacity, Text } from 'react-native';

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
  return (
    <View style={styles.container}>
      <SimpleTopicView topics={mockTopics} />
      {/* 右下に色付きログアウトボタン */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={logout}
        activeOpacity={0.8}
      >
        <Text style={styles.logoutText}>ログアウト</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fffff',
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
