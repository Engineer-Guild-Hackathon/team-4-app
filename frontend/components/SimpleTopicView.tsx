import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { TopicManageView } from './TopicManageView';
import { TopicPageIndicator } from './topicPageIndicator';
import PagerView from 'react-native-pager-view';
// ▼▼▼ 1. TreeViewerコンポーネントをインポート ▼▼▼
import { TreeViewer } from './TreeViewer';

// --- Interfaces and Types ---
interface Topic {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface SimpleTopicViewProps {
  topics?: Topic[];
  onUserPress: (topicId: string, userId: number) => void;
}

// --- Component ---
export function SimpleTopicView({ topics: propTopics, onUserPress }: SimpleTopicViewProps) {
  const [currentIndex, setCurrentIndex] = useState(1);
  const pagerRef = useRef<PagerView>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const { authedApi, accessToken } = useAuth();

  const refreshMyTopics = async (switchToLastTopic = false) => {
    try {
      setLoading(true);
      const response = await authedApi('/api/topics/me/');
      const fetchedTopics = response.topics || [];
      setTopics(fetchedTopics);

      if (switchToLastTopic) {
        const lastTopicIndex = fetchedTopics.length;
        pagerRef.current?.setPage(lastTopicIndex);
        setCurrentIndex(lastTopicIndex);
      }
    } catch (error) {
      console.error('トピック取得エラー:', error);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (propTopics) {
      setTopics(propTopics);
      setLoading(false);
      return;
    }
    if (accessToken) {
      refreshMyTopics();
    } else {
      setLoading(false);
    }
  }, [propTopics, accessToken]);

  const handleSelectIndex = (index: number) => {
    pagerRef.current?.setPage(index);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>トピックを読み込み中...</Text>
        </View>
      </View>
    );
  }

  if (topics.length === 0) {
    return <TopicManageView onBack={() => refreshMyTopics(true)} />;
  }

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <PagerView
          ref={pagerRef}
          style={{ flex: 1 }}
          scrollEnabled={false}
          initialPage={currentIndex}
          onPageSelected={e => setCurrentIndex(e.nativeEvent.position)}
          key={topics.length + 1}
        >
          {/* ページ0: 管理画面 */}
          <View key="manage" style={{ flex: 1 }}>
            <TopicManageView onBack={() => refreshMyTopics(true)} />
          </View>
          {/* ページ1以降: 各トピック */}
          {topics.map(topic => (
            <View key={topic.id} style={styles.topicPageContainer}>
              {/* 上部：トピック概要エリア (変更なし) */}
              <View style={styles.descriptionContainer}>
                <Text style={styles.topicTitle}>{topic.title}</Text>
                <Text style={styles.topicDescription}>{topic.description}</Text>
              </View>

              {/* ▼▼▼ 2. 中央のユーザーアイコン表示をTreeViewerに置き換え ▼▼▼ */}
              <View style={styles.treeContainer}>
                <TreeViewer
                  // 表示すべきトピックのIDを渡す
                  topicId={topic.id}
                  // TreeViewer内でアイコンがタップされたら、onUserPressを呼び出す
                  onNodePress={(userId) => {
                    onUserPress(topic.id, userId);
                  }}
                />
              </View>
            </View>
          ))}
        </PagerView>
      </View>
      {/* 下部：トピックインジケーター (変更なし) */}
      <View style={{ paddingBottom: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
        <TopicPageIndicator
          topics={topics}
          currentIndex={currentIndex}
          onSelectIndex={handleSelectIndex}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  topicPageContainer: {
    flex: 1,
  },
  descriptionContainer: {
    flex: 4, // 画面の4割を占める
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  topicTitle: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 34,
    color: '#1f2937',
  },
  topicDescription: {
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 26,
    color: '#6b7280',
    maxWidth: 300,
  },
  // ▼▼▼ 3. TreeViewer用のコンテナスタイルを追加 ▼▼▼
  treeContainer: {
    flex: 6, // 画面の6割を占める
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
  // userStripContainerとそれに関連するスタイルは不要になったため削除
});

