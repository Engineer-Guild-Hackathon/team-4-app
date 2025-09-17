import { useAuth } from '@/hooks/useAuth';
import { checkMentorSelectionRequired } from '@/services/api/mentorship';
import { getMyTopics } from '@/services/api/topic';
import { theme } from '@/styles/theme';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { TopicCarousel } from './TopicCarousel';
import { TopicManageView } from './TopicManageView';
import { TreeViewer } from './TreeViewer/TreeViewer';
import { WafuCloud } from './WahuCloud';

// ★ 2. 背景の雲をまとめて配置するためのコンポーネントを定義
const BackgroundClouds = () => {
  // 画像アセットのパスはご自身のプロジェクトに合わせて修正してください
  const goldTexture = require('../assets/images/cloud-texture.png');

  return (
    // zIndex:-1で確実に背景に配置
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
      {/* 上部の雲 */}
      <WafuCloud
        seed={13}
        textureSource={goldTexture}
        duration={24000}
        travelDistance={25}
        style={{ width: 250, height: 120, top: 80, left: -50, opacity: 0.4 }}
      />
      <WafuCloud
        seed={456}
        textureSource={goldTexture}
        duration={42000}
        travelDistance={-20}
        style={{ width: 200, height: 120, top: 110, right: -80, opacity: 0.4 }}
      />
      {/* 下部の雲 */}
      <WafuCloud
        seed={789}
        textureSource={goldTexture}
        duration={38000}
        travelDistance={-22}
        style={{ width: 220, height: 100, bottom: 130, left: -40, opacity: 0.4 }}
      />
      <WafuCloud
        seed={101}
        textureSource={goldTexture}
        duration={30000}
        travelDistance={18}
        style={{ width: 320, height: 150, bottom: 50, right: -100, opacity: 0.4 }}
      />
    </View>
  );
};

// =================================================================
// ここから下がSimpleTopicView本体
// =================================================================

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
      onTopicChange?.(null);
    }
  }, [topics, currentIndex]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6b7280" />
      </View>
    );
  }

  if (topics.length === 0) {
    return (
      <View style={styles.container}>
        <BackgroundClouds />
        <TopicManageView onBack={() => refreshMyTopics(true)} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackgroundClouds />

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

const remToPx = (rem: string) => parseFloat(rem) * 16;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  topicPageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  treeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 100, // Space for TopicCarousel
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  cloudContainer: {
    position: 'absolute',
  },
});
