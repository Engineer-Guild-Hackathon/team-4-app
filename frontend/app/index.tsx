import React from 'react';
import { StyleSheet } from 'react-native';
import { View } from 'react-native';
import { SimpleTopicView } from '../components/SimpleTopicView';

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
  return (
    <View style={styles.container}>
      <SimpleTopicView topics={mockTopics} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fffff',
  },
});
