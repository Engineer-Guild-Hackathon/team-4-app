import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { TopicManageView } from './TopicManageView';
import PagerView from 'react-native-pager-view';
import { TopicPageIndicator } from './TopicPageIndicator';

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
    setCurrentIndex(index);
    pagerRef.current?.setPage(index);
  };

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
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        scrollEnabled={false}
        initialPage={currentIndex}
        onPageSelected={e => setCurrentIndex(e.nativeEvent.position)}
        key={topics.length + 1}
      >
        <View key="manage" style={styles.pageView}>
          <TopicManageView onBack={() => refreshMyTopics(true)} />
        </View>

        {topics.map(topic => (
          <View key={topic.id} style={styles.pageView}>
            <View style={styles.descriptionContainer}>
              <Text style={styles.topicTitle}>{topic.title}</Text>
              <Text style={styles.topicDescription}>{topic.description}</Text>
            </View>
            <View style={styles.userStripContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {topic.mentor && (
                  <TouchableOpacity
                    style={styles.userIconContainer}
                    onPress={() => onUserPress(topic.id, topic.mentor!.id)}
                  >
                    <Image source={{ uri: topic.mentor.avatarUrl }} style={styles.avatar} />
                    <Text style={styles.userName}>{topic.mentor.name}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.userIconContainer}
                  onPress={() => onUserPress(topic.id, selfUser.id)}
                >
                  <Image
                    source={{ uri: selfUser.avatarUrl }}
                    style={[styles.avatar, styles.selfAvatar]}
                  />
                  <Text style={styles.userName}>{selfUser.name}</Text>
                </TouchableOpacity>
                {topic.mentees?.map(mentee => (
                  <TouchableOpacity
                    key={mentee.id}
                    style={styles.userIconContainer}
                    onPress={() => onUserPress(topic.id, mentee.id)}
                  >
                    <Image source={{ uri: mentee.avatarUrl }} style={styles.avatar} />
                    <Text style={styles.userName}>{mentee.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        ))}
      </PagerView>

      <View style={styles.indicatorContainer}>
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
