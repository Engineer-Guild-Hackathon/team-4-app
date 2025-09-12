import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { apiClient } from '@/utils/apiClient';
import { VerticalLevelSelector } from '@/components/VerticalLevelSelector';

const LEVEL_MIN = 1;
const LEVEL_MAX = 100;

export default function SelectLevelMentorScreen() {
  const params = useLocalSearchParams();
  const topicId = params.topicId as string;

  // プログレスバーの値
  const [level, setLevel] = useState(5);

  // post取得
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        // topicIdで1件だけ取得（仮: 最初の1件）
        const res = await apiClient(`/api/posts/?topic_id=${topicId}`);
        setPost(res[0] || null);
      } catch {
        setPost(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [topicId]);

  return (
    <View style={styles.container}>
      {/* 右側レベル選択UI */}
      <View style={styles.rightBarContainer}>
        <VerticalLevelSelector
          min={LEVEL_MIN}
          max={LEVEL_MAX}
          value={level}
          onChange={setLevel}
        />
      </View>
      {/* 中央にpost表示とlevel値 */}
      <View style={styles.centerContent}>
        <Text style={styles.title}>レベル・師匠選択</Text>
        <Text style={styles.topicId}>topicId: {topicId}</Text>
        <Text style={styles.levelDisplay}>選択中のレベル: {level}</Text>
        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 20 }} />
        ) : post ? (
          <View style={styles.postBox}>
            <Text style={styles.postTitle}>投稿: {post.title || 'タイトルなし'}</Text>
            <Text style={styles.postContent}>{post.content || '内容なし'}</Text>
          </View>
        ) : (
          <Text style={{ marginTop: 20 }}>投稿がありません</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
  },
  rightBarContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: 80,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  topicId: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  levelDisplay: {
    fontSize: 18,
    color: '#3b82f6',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  postBox: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    width: 320,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 16,
    color: '#374151',
  },
});
