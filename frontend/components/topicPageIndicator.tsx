import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface TopicPageIndicatorProps {
  topics: { id: string; title: string }[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
}

export const TopicPageIndicator: React.FC<TopicPageIndicatorProps> = ({ topics, currentIndex, onSelectIndex }) => (
  <View style={styles.topicsContainer}>
    {/* 左端: 作成ページ（index=0） */}
    <TouchableOpacity style={styles.topicIconWrapper} onPress={() => onSelectIndex(0)}>
      <View style={[styles.topicIcon, currentIndex === 0 && styles.topicIconActive]}>
        <Text
          style={[
            styles.topicIconText,
            currentIndex === 0 && styles.topicIconTextActive,
          ]}
        >
          +
        </Text>
      </View>
    </TouchableOpacity>
    {/* トピック: index=1~ */}
    {topics.map((topic, index) => (
      <TouchableOpacity key={topic.id} style={styles.topicIconWrapper} onPress={() => onSelectIndex(index + 1)}>
        <View style={[styles.topicIcon, currentIndex === index + 1 && styles.topicIconActive]}>
          <Text
            style={[
              styles.topicIconText,
              currentIndex === index + 1 && styles.topicIconTextActive,
            ]}
          >
            {topic.title.charAt(0)}
          </Text>
        </View>
      </TouchableOpacity>
    ))}
  </View>
);

const styles = StyleSheet.create({
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
});
