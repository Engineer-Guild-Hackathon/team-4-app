import { useAuth } from '@/hooks/useAuth';
import { checkMentorSelectionRequired } from '@/services/api/mentorship';
import { getMyTopics } from '@/services/api/topic';
import React, { useEffect, useRef, useState } from 'react';
// ★ 修正点 1: ActivityIndicator をインポート
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { TopicCarousel } from './TopicCarousel';
import { TopicManageView } from './TopicManageView';
import { TreeViewer } from './TreeViewer/TreeViewer';

interface Topic {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface SimpleTopicViewProps {
  onUserPress: (topicId: string, userId: number) => void;
  onMentorSelectionRequired?: (topicId: string) => void;
  onTopicChange?: (topicId: string | null) => void;
}

export function SimpleTopicView({
  onUserPress,
  onMentorSelectionRequired,
  onTopicChange,
}: SimpleTopicViewProps) {
  const [currentIndex, setCurrentIndex] = useState(1);
  const pagerRef = useRef<PagerView>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const checkMentorSelection = async (topicId: string) => {
    try {
      const response = (await checkMentorSelectionRequired(topicId)) as { required: boolean };
      if (response.required) {
        onMentorSelectionRequired?.(topicId);
      }
    } catch (error) {
      console.error('師匠選択判定エラー:', error);
    }
  };

  const refreshMyTopics = async (switchToLastTopic = false) => {
    try {
      setLoading(true);
      const response = await getMyTopics();
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
    refreshMyTopics();
  }, []);

  const handleSelectIndex = (index: number) => {
    setCurrentIndex(index);
    pagerRef.current?.setPage(index);

    if (index > 0 && topics[index - 1]) {
      const topicId = topics[index - 1].id;
      checkMentorSelection(topicId);
      onTopicChange?.(topicId);
    } else {
      onTopicChange?.(null);
    }
  };

  const [isPagerScrollEnabled, setIsPagerScrollEnabled] = useState(true);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setIsPagerScrollEnabled(false);
      }, 136);

      return () => clearTimeout(timer);
    }
  }, [loading]);

  useEffect(() => {
    if (topics.length > 0 && currentIndex > 0 && topics[currentIndex - 1]) {
      const topicId = topics[currentIndex - 1].id;
      checkMentorSelection(topicId);
      onTopicChange?.(topicId);
    } else if (topics.length > 0) {
      // トピックはあるが、管理ページにいる場合
      onTopicChange?.(null);
    }
  }, [topics, currentIndex]);

  // ★ 修正点 2: ローディング中の表示を先に行う
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6b7280" />
      </View>
    );
  }

  // ★ 修正点 3: ローディング完了後にtopicsが空の場合のみ、管理ビューを表示
  if (topics.length === 0) {
    return <TopicManageView onBack={() => refreshMyTopics(true)} />;
  }

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <PagerView
          ref={pagerRef}
          style={{ flex: 1 }}
          scrollEnabled={isPagerScrollEnabled}
          initialPage={currentIndex}
          onPageSelected={e => {
            setCurrentIndex(e.nativeEvent.position);
            if (!isPagerScrollEnabled) {
              return;
            }
          }}
          key={topics.length + 1}
        >
          <View key="manage" style={{ flex: 1 }}>
            <TopicManageView onBack={() => refreshMyTopics(true)} />
          </View>
          {topics.map(topic => (
            <View key={topic.id} style={styles.topicPageContainer}>
              <View style={styles.treeContainer}>
                <TreeViewer
                  userId={user?.id}
                  topicId={topic.id}
                  onNodePress={userId => {
                    onUserPress(topic.id, userId);
                  }}
                />
              </View>
            </View>
          ))}
        </PagerView>
      </View>
      <View style={styles.indicatorContainer}>
        <TopicCarousel
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
    backgroundColor: 'transparent',
  },
  pageView: {
    flex: 1,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  topicPageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  treeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // ★ 修正点 4: ローディングコンテナ用のスタイルを追加
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff', // 必要に応じて背景色を設定
  },
  loadingText: {
    fontSize: 18,
    color: '#6b7280',
  },
});
