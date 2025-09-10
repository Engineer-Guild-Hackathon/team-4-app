import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useAuth } from '@/hooks/useAuth';
import { TopicManageView } from './TopicManageView';

const { width: screenWidth } = Dimensions.get('window');

interface Topic {
  id: string; // UUID as string
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface SimpleTopicViewProps {
  topics?: Topic[];
}

export function SimpleTopicView({ topics: propTopics }: SimpleTopicViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showManageMode, setShowManageMode] = useState(false);
  const translateX = useSharedValue(0);
  const { authedApi, accessToken } = useAuth();

  // 参加しているトピック一覧を取得
  useEffect(() => {
    const fetchMyTopics = async () => {
      try {
        setLoading(true);
        const response = await authedApi('/api/topics/me/');
        setTopics(response.topics || []);
        setCurrentIndex(0);
      } catch (error) {
        console.error('トピック取得エラー:', error);
        setTopics([]);
      } finally {
        setLoading(false);
      }
    };

    if (propTopics) {
      setTopics(propTopics);
      setLoading(false);
      return;
    }
    
    if (accessToken) {
      fetchMyTopics();
    } else {
      setLoading(false);
    }
  }, [propTopics, accessToken]);


  const refreshMyTopics = async () => {
    try {
      const response = await authedApi('/api/topics/me/');
      const newTopics = response.topics || [];
      setTopics(newTopics);
      if (currentIndex >= newTopics.length) {
        setCurrentIndex(Math.max(0, newTopics.length - 1));
      }
    } catch (error) {
      console.error('トピック取得エラー:', error);
    }
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
    })
    .onUpdate(event => {
      translateX.value = event.translationX;
    })
    .onEnd(event => {
      const threshold = screenWidth * 0.2;
      const velocity = event.velocityX;

      if (Math.abs(event.translationX) > threshold || Math.abs(velocity) > 300) {
        if (event.translationX > 0) {
          // 右にスワイプ
          if (currentIndex > 0) {
            // 前のトピック
            runOnJS(setCurrentIndex)(currentIndex - 1);
          } else {
            // 左端からさらに右にスワイプした場合は管理画面に移動
            runOnJS(setCurrentIndex)(topics.length);
          }
          translateX.value = withSpring(0);
        } else if (event.translationX < 0) {
          // 左にスワイプ
          if (currentIndex < topics.length) {
            // 次のトピック
            runOnJS(setCurrentIndex)(currentIndex + 1);
          } else {
            // 管理画面から左にスワイプした場合は最初のトピックに移動
            runOnJS(setCurrentIndex)(0);
          }
          translateX.value = withSpring(0);
        } else {
          // 元の位置に戻す
          translateX.value = withSpring(0);
        }
      } else {
        // 元の位置に戻す
        translateX.value = withSpring(0);
      }
    });
  //アニメーション追加するなら必要
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const currentTopic = topics[currentIndex];

  // 管理画面の表示判定
  const isManageMode = currentIndex === topics.length;

  // ローディング状態
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>トピックを読み込み中...</Text>
        </View>
      </View>
    );
  }

  // 管理画面の表示
  if (isManageMode) {
    return (
      <TopicManageView 
        onBack={() => {
          setCurrentIndex(Math.max(0, topics.length - 1));
          refreshMyTopics();
        }} 
      />
    );
  }

  // トピックが存在しない場合
  if (topics.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>参加しているトピックがありません</Text>
          <Text style={styles.emptySubText}>トピック管理画面で新しいトピックを作成するか、他のユーザーから招待を受けてください</Text>
        </View>
      </View>
    );
  }

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        {/* 説明文（画面上部） */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.topicTitle}>{currentTopic?.title}</Text>
          <Text style={styles.topicDescription}>{currentTopic?.description}</Text>
        </View>

        {/* トピックアイコン（インスタグラムストーリー風） */}
        <View style={styles.topicsContainer}>
          {/* 管理画面アイコン（左端） */}
          <View style={styles.topicIconWrapper}>
            <View style={[styles.topicIcon, isManageMode && styles.topicIconActive]}>
              <Text
                style={[
                  styles.topicIconText,
                  isManageMode && styles.topicIconTextActive,
                ]}
              >
                +
              </Text>
            </View>
          </View>
          {topics.map((topic, index) => (
            <View key={topic.id} style={styles.topicIconWrapper}>
              <View style={[styles.topicIcon, index === currentIndex && styles.topicIconActive]}>
                <Text
                  style={[
                    styles.topicIconText,
                    index === currentIndex && styles.topicIconTextActive,
                  ]}
                >
                  {topic.id}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  topicsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 60,
    gap: 20,
  },
  topicIconWrapper: {
    alignItems: 'center',
  },
  topicIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e5e7eb',
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicIconActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#1d4ed8',
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  topicIconText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  topicIconTextActive: {
    color: '#ffffff',
  },
  descriptionContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});
