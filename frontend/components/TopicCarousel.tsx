import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { theme } from '@/styles/theme';

interface Topic {
  id: string;
  title: string;
}

interface TopicCarouselProps {
  topics: Topic[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = 120;
const ITEM_HEIGHT = 50;
const ITEM_SPACING = 8;
const ITEM_FULL_WIDTH = ITEM_WIDTH + ITEM_SPACING;
const SPACER_ITEM_WIDTH = (SCREEN_WIDTH - ITEM_WIDTH) / 2;

export const TopicCarousel: React.FC<TopicCarouselProps> = ({
  topics,
  currentIndex,
  onSelectIndex,
}) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const displayData = [
    { id: 'left-spacer' },
    { id: 'manage', title: '+' },
    ...topics,
    { id: 'right-spacer' },
  ];

  useEffect(() => {
    if (flatListRef.current) {
      const targetIndex = currentIndex + 1;
      flatListRef.current.scrollToIndex({
        index: targetIndex,
        animated: true,
        viewPosition: 0.5,
      });
    }
  }, [currentIndex]);

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    if (!item.title) {
      return <View style={{ width: SPACER_ITEM_WIDTH }} />;
    }

    const pageIndex = index - 1;

    const inputRange = [
      (index - 2) * ITEM_FULL_WIDTH,
      (index - 1) * ITEM_FULL_WIDTH,
      index * ITEM_FULL_WIDTH,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.7, 1.1, 0.7],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [1, 1, 1],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity onPress={() => onSelectIndex(pageIndex)}>
        <Animated.View style={[styles.topicIconWrapper, { transform: [{ scale }], opacity }]}>
          <View style={[styles.topicIcon, currentIndex === pageIndex && styles.topicIconActive]}>
            <Text
              style={[
                styles.topicIconText,
                currentIndex === pageIndex && styles.topicIconTextActive,
              ]}
              numberOfLines={1}
            >
              {item.title === '+' ? '+' : item.title.substring(0, 8)}
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={displayData}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_FULL_WIDTH}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: ITEM_FULL_WIDTH,
          offset: ITEM_FULL_WIDTH * index,
          index,
        })}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: true,
        })}
        onMomentumScrollEnd={e => {
          const newPageIndex = Math.round(e.nativeEvent.contentOffset.x / ITEM_FULL_WIDTH);
          if (newPageIndex !== currentIndex) {
            onSelectIndex(newPageIndex);
          }
        }}
        scrollEventThrottle={16}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.md,
  },
  topicIconWrapper: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT + 30,
    marginHorizontal: theme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicIcon: {
    width: '100%',
    height: ITEM_HEIGHT,
    borderRadius: theme.layout.radius.full,
    backgroundColor: theme.colors.textDark,
    borderWidth: 2,
    borderColor: theme.colors.borderMedium,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    ...theme.shadows.lg,
    shadowOpacity: 0.6, // Keep custom opacity
  },
  topicIconActive: {
    backgroundColor: theme.colors.textMedium,
    borderColor: theme.colors.textMedium,
    shadowColor: theme.colors.textMedium,
  },
  topicIconText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.textLightGray,
  },
  topicIconTextActive: {
    color: theme.colors.white,
  },
});
