import { useAuth } from '@/hooks/useAuth';
import { getMyTopics } from '@/services/api/topic';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { TopicCarousel } from './TopicCarousel';
import { TopicManageView } from './TopicManageView';
import { TreeViewer } from './TreeViewer';

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

export function SimpleTopicView({ topics: propTopics, onUserPress }: SimpleTopicViewProps) {
  const [currentIndex, setCurrentIndex] = useState(1);
  const pagerRef = useRef<PagerView>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const { accessToken } = useAuth();

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
    setCurrentIndex(index);
    pagerRef.current?.setPage(index);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  if (topics.length === 0 && !propTopics) {
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
            setCurrentIndex(e.nativeEvent.position)
            if (!isPagerScrollEnabled) {
              return;
            }
          }}
          key={topics.length + 1}
        >
          {/* 作成ページを一番左 */}
          <View key="manage" style={{ flex: 1 }}>
            <TopicManageView onBack={() => refreshMyTopics(true)} />
          </View>
          {topics.map(topic => (
            <View key={topic.id} style={styles.topicPageContainer}>
              <View style={styles.treeContainer}>
                <TreeViewer
                  topicId={topic.id}
                  onNodePress={userId => {
                    onUserPress(topic.id, userId);
                  }}
                />
              </View>
              <View style={styles.descriptionContainer} pointerEvents="box-none">
                <Text style={styles.topicTitle}>{topic.title}</Text>
                <Text style={styles.topicDescription}>{topic.description}</Text>
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
  descriptionContainer: {
    position: 'absolute',
    top: 30,
    left: 0,
    right: 0,
    zIndex: 1,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  treeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topicTitle: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textShadowColor: 'rgba(255, 255, 255, 1)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  topicDescription: {
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 26,
    color: '#1f2937',
    maxWidth: 300,
    textShadowColor: 'rgba(255, 255, 255, 0.7)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
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
