import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';

interface TopicPageIndicatorProps {
  topics: { id: string; title: string }[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
}

export const TopicPageIndicator: React.FC<TopicPageIndicatorProps> = ({
  topics,
  currentIndex,
  onSelectIndex,
}) => {
  const [isSnapping, setIsSnapping] = useState(false);
  // スクロール終了時に中央判定してスナップ（e引数ありで統一）
  const handleScrollEnd = (e: any) => {
    return;
    if (isSnapping) return;
    let x = 0;
    if (e && e.nativeEvent && e.nativeEvent.contentOffset) {
      x = e.nativeEvent.contentOffset.x;
    } else if (scrollRef.current) {
      // ScrollViewの現在位置を取得
      // @ts-ignore: scrollRef.current._scrollAnimatedValue._value は内部API
      x = scrollRef.current._scrollAnimatedValue?._value ?? 0;
    }
    // スクロール位置から中央座標を算出
    const centerX = x + screenWidth / 2 - itemWidth * 2;
    // topicCenters: 各トピックの中心座標
    const topicCenters = Array.from(
      { length: topics.length + 1 },
      (_, i) => itemWidth * i + itemWidth / 2
    );
    // 中央座標に最も近いトピックのインデックス
    const closestIdx = topicCenters.reduce(
      (closestIdx, center, i) =>
        Math.abs(center - centerX) < Math.abs(topicCenters[closestIdx] - centerX) ? i : closestIdx,
      0
    );
    setIsSnapping(true);
    fixToCenter(closestIdx);
    setSelectedIndex(closestIdx);
    onSelectIndex(closestIdx);
    setTimeout(() => setIsSnapping(false), 400); // スナップ完了後に解除
  };
  // 選択中トピックを中央にフィックス
  const fixToCenter = (idx: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        x: itemWidth * idx - screenWidth / 2 + itemWidth / 2,
        animated: true,
      });
    }
  };
  const scrollRef = useRef<ScrollView>(null);
  const [selectedIndex, setSelectedIndex] = useState(currentIndex);
  const itemWidth = 80; // トピック表示幅
  const screenWidth = Dimensions.get('window').width;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const centerX = x + screenWidth / 2 - itemWidth * 2;
    const topicCenters = Array.from(
      { length: topics.length + 1 },
      (_, i) => itemWidth * i + itemWidth / 2
    );
    const idx = topicCenters.reduce(
      (closestIdx, center, i) =>
        Math.abs(center - centerX) < Math.abs(topicCenters[closestIdx] - centerX) ? i : closestIdx,
      0
    );
    // itemWidth以上移動した場合のみ反応
    const prevCenter = topicCenters[selectedIndex];
    if (
      idx >= 0 &&
      idx < topics.length + 1 &&
      idx !== selectedIndex &&
      Math.abs(topicCenters[idx] - prevCenter) >= itemWidth
    ) {
      setSelectedIndex(idx);
      onSelectIndex(idx);
    }
  };

  // タップで中央に移動
  // タップで中央にアニメーション付きで移動＆選択
  const handleTap = (idx: number) => {
    setSelectedIndex(idx);
    onSelectIndex(idx);
    if (scrollRef.current) {
      // centerXの計算式に合わせて中央に来るようにスクロール
      const scrollX = itemWidth * idx - screenWidth / 2 + itemWidth * 2 + 30;
      scrollRef.current.scrollTo({ x: scrollX, animated: true });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  return (
    <View style={{ alignItems: 'center', width: '100%', marginBottom: 24 }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ width: '100%' }}
        contentContainerStyle={{
          alignItems: 'center',
          paddingHorizontal: screenWidth / 2 - itemWidth / 2,
        }}
        onScroll={handleScroll}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
      >
        {/* 作成ページ（index=0） */}
        <Pressable style={{ width: itemWidth, alignItems: 'center' }} onPress={() => handleTap(0)}>
          <View style={[styles.topicIcon, selectedIndex === 0 && styles.topicIconActive]}>
            <Text style={[styles.topicIconText, selectedIndex === 0 && styles.topicIconTextActive]}>
              +
            </Text>
          </View>
        </Pressable>
        {/* トピック: index=1~ */}
        {topics.map((topic, index) => (
          <Pressable
            key={topic.id}
            style={{ width: itemWidth, alignItems: 'center' }}
            onPress={() => handleTap(index + 1)}
          >
            {selectedIndex === index + 1 ? (
              <View style={styles.topicRectActive}>
                <Text style={styles.topicRectTextActive}>{topic.title.slice(0, 8)}</Text>
              </View>
            ) : (
              <View style={styles.topicDot} />
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};
// ...existing code...
// ...existing code...

const styles = StyleSheet.create({
  topicsContainer: {
    flexDirection: 'row',
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
  topicRectActive: {
    minWidth: 80,
    maxWidth: 120,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    borderColor: '#1d4ed8',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  topicRectTextActive: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  topicDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#d1d5db',
    marginHorizontal: 21,
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  topicIconTextActive: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  topicIconTextActiveFull: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
});
