import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
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

interface User {
  id: number;
  name: string;
  avatarUrl: string;
}

interface Topic {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  mentor?: User;
  mentees?: User[];
}

interface SimpleTopicViewProps {
  topics?: Topic[];
  onUserPress: (topicId: string, userId: number) => void;
}

const selfUser: User = {
  id: 1,
  name: '自分',
  avatarUrl: 'https://placehold.co/64x64/a9a9a9/ffffff?text=Me',
};

export function SimpleTopicView({
  topics: propTopics,
  onUserPress,
}: SimpleTopicViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const translateX = useSharedValue(0);
  const { authedApi, accessToken } = useAuth();

  const refreshMyTopics = async (switchToLastTopic = false) => {
    try {
      setLoading(true);
      const response = await authedApi('/api/topics/me/');
      let fetchedTopics = response.topics || [];

      setTopics(fetchedTopics);
      
      if (switchToLastTopic) {
        setCurrentIndex(Math.max(0, fetchedTopics.length - 1));
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


  const panGesture = Gesture.Pan()
    .onStart(() => { 'worklet'; })
    .onUpdate(event => { translateX.value = event.translationX; })
    .onEnd(event => {
      'worklet';
      const threshold = screenWidth * 0.2;
      const velocity = event.velocityX;

      if (Math.abs(event.translationX) > threshold || Math.abs(velocity) > 300) {
        if (event.translationX > 0) { // 右にスワイプ
          if (currentIndex > 0) {
            // 前のトピックへ
            runOnJS(setCurrentIndex)(currentIndex - 1);
          } else {
            // 最初のトピックから右スワイプで管理画面へ
            runOnJS(setCurrentIndex)(topics.length);
          }
        } else if (event.translationX < 0) { // 左にスワイプ
          // --- ▼▼▼ このブロックを修正 ▼▼▼ ---
          if (currentIndex < topics.length - 1) {
            // 最後のトピックでなければ、次のトピックへ
            runOnJS(setCurrentIndex)(currentIndex + 1);
          } else if (currentIndex === topics.length) {
            // 管理画面から左スワイプで最初のトピックへ
            runOnJS(setCurrentIndex)(0);
          }
          // 最後のトピック (currentIndex === topics.length - 1) の場合は何もしない
          // --- ▲▲▲ ここまで修正 ▲▲▲ ---
        }
      }
      // 位置を元に戻すアニメーション
      translateX.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const currentTopic = topics[currentIndex];
  const isManageMode = currentIndex === topics.length;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>トピックを読み込み中...</Text>
        </View>
      </View>
    );
  }

  if (isManageMode) {
    return (
      <TopicManageView 
        onBack={() => {
          refreshMyTopics(true);
        }} 
      />
    );
  }
  
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
        <View style={styles.descriptionContainer}>
          <Text style={styles.topicTitle}>{currentTopic?.title}</Text>
          <Text style={styles.topicDescription}>{currentTopic?.description}</Text>
        </View>

        <View style={styles.userStripContainer}>
          {currentTopic && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {currentTopic.mentor && (
                <TouchableOpacity
                  style={styles.userIconContainer}
                  onPress={() => onUserPress(currentTopic.id, currentTopic.mentor!.id)}
                >
                  <Image source={{ uri: currentTopic.mentor.avatarUrl }} style={styles.avatar} />
                  <Text style={styles.userName}>{currentTopic.mentor.name}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.userIconContainer}
                onPress={() => onUserPress(currentTopic.id, selfUser.id)}
              >
                <Image source={{ uri: selfUser.avatarUrl }} style={[styles.avatar, styles.selfAvatar]} />
                <Text style={styles.userName}>{selfUser.name}</Text>
              </TouchableOpacity>
              {currentTopic.mentees?.map((mentee) => (
                <TouchableOpacity
                  key={mentee.id}
                  style={styles.userIconContainer}
                  onPress={() => onUserPress(currentTopic.id, mentee.id)}
                >
                  <Image source={{ uri: mentee.avatarUrl }} style={styles.avatar} />
                  <Text style={styles.userName}>{mentee.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.topicsContainer}>
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
                  {topic.title.charAt(0)}
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
  userStripContainer: {
    height: 100,
    paddingLeft: 16,
    marginBottom: 20,
  },
  userIconContainer: {
    alignItems: 'center',
    marginRight: 20,
    width: 70,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
  },
  selfAvatar: {
    borderWidth: 3,
    borderColor: '#3b82f6',
  },
  userName: {
    fontSize: 12,
  },
});

