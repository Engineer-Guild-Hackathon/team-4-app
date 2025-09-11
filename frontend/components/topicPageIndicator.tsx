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

interface Topic {
  id: string;
  title: string;
}

interface TopicPageIndicatorProps {
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

export const TopicPageIndicator: React.FC<TopicPageIndicatorProps> = ({
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
    paddingBottom: 10,
    paddingTop: 10,
    // backgroundColor: '#ff0000',
    // 影が見切れないように上下のpaddingをさらに増やす // 以前の20から30に増やす
  },
  topicIconWrapper: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT + 30,
    marginHorizontal: ITEM_SPACING / 2,
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: '#0000ff'
  },
  topicIcon: {
    width: '100%',
    height: ITEM_HEIGHT,
    borderRadius: 25,
    backgroundColor: '#1f2937', // ダークグレー
    borderWidth: 2,
    borderColor: '#374151', // 少し明るいグレー
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    // 非アクティブ時の影を追加
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, // 上下にもしっかりとグローが出るように
    shadowOpacity: 0.6, // 影の濃さを少し濃く
    shadowRadius: 5, // 影の広がりを大きく
    elevation: 5, // Android用の影の強さ
  },
  topicIconActive: {
    backgroundColor: '#374151', // 少し明るいグレー
    borderColor: '#374151', // アクティブな青のボーダー
    shadowColor: '#374151', // 影の色を青に
    shadowOffset: { width: 0, height: 4 }, // 上下にもしっかりとグローが出るように
    shadowOpacity: 0.6, // 影の濃さを少し濃く
    shadowRadius: 5, // 影の広がりを大きく
    elevation: 5, // Android用の影の強さ
  },
  topicIconText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9ca3af', // ライトグレー
  },
  topicIconTextActive: {
    color: '#ffffff',
  },
});
