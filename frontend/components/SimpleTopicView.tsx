import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get('window');

interface Topic {
  id: number;
  title: string;
  description: string;
}

interface SimpleTopicViewProps {
  topics: Topic[];
}

export function SimpleTopicView({ topics }: SimpleTopicViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      const threshold = screenWidth * 0.2;
      const velocity = event.velocityX;

      if (Math.abs(event.translationX) > threshold || Math.abs(velocity) > 300) {
        if (event.translationX > 0 && currentIndex > 0) {
          // 右にスワイプ（前のトピック）
          runOnJS(setCurrentIndex)(currentIndex - 1);
          translateX.value = withSpring(0);
        } else if (event.translationX < 0 && currentIndex < topics.length - 1) {
          // 左にスワイプ（次のトピック）
          runOnJS(setCurrentIndex)(currentIndex + 1);
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

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        {/* トピックアイコン（インスタグラムストーリー風） */}
        <View style={styles.topicsContainer}>
          {topics.map((topic, index) => (
            <View key={topic.id} style={styles.topicIconWrapper}>
              <View
                style={[
                  styles.topicIcon,
                  index === currentIndex && styles.topicIconActive,
                ]}
              >
                <Text style={[
                  styles.topicIconText,
                  index === currentIndex && styles.topicIconTextActive,
                ]}>
                  {topic.id}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* 説明文（画面中央） */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.topicTitle}>
            {currentTopic?.title}
          </Text>
          <Text style={styles.topicDescription}>
            {currentTopic?.description}
          </Text>
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
    paddingTop: 60,
    paddingBottom: 40,
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
});
