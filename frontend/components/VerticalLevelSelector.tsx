import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

interface VerticalLevelSelectorProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}

// ★ 1. 定数を調整
const BAR_HEIGHT = 300;
const BAR_WIDTH = 24; // 棒の幅を細く
const KNOB_HEIGHT = 48; // つまみのサイズを調整
const KNOB_WIDTH = 48; // つまみのサイズを調整

export const VerticalLevelSelector: React.FC<VerticalLevelSelectorProps> = ({
  min,
  max,
  value,
  onChange,
}) => {
  const panY = useRef(new Animated.Value(0)).current;
  const gestureStartPosition = useRef(0);
  const lastNotifiedLevel = useRef(value);

  const valueToY = (level: number) => {
    const range = max - min;
    if (range === 0) return 0;
    const percentage = (max - level) / range;
    return percentage * (BAR_HEIGHT - KNOB_HEIGHT);
  };

  const yToValue = (y: number) => {
    const percentage = y / (BAR_HEIGHT - KNOB_HEIGHT);
    const invertedValue = max - percentage * (max - min);
    return Math.max(min, Math.min(max, Math.round(invertedValue)));
  };

  useEffect(() => {
    const newY = valueToY(value);
    lastNotifiedLevel.current = value;
    Animated.spring(panY, {
      toValue: newY,
      tension: 100,
      friction: 20,
      useNativeDriver: false,
    }).start();
  }, [value, min, max]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        gestureStartPosition.current = (panY as any)._value;
      },
      onPanResponderMove: (_, gestureState) => {
        const newY = gestureStartPosition.current + gestureState.dy;
        const clampedY = Math.max(0, Math.min(BAR_HEIGHT - KNOB_HEIGHT, newY));
        const newLevel = yToValue(clampedY);
        if (newLevel !== lastNotifiedLevel.current) {
          onChange(newLevel);
          if (newLevel % 5 === 0) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          lastNotifiedLevel.current = newLevel;
        }
        panY.setValue(clampedY);
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <View style={styles.barBackground}>
        <View style={styles.barTrack} />
      </View>

      <Animated.View style={[styles.knobContainer, { top: panY }]} {...panResponder.panHandlers}>
        <LinearGradient
          colors={['#000000ff', '#000000ff']} // グラデーションを少し変更
          style={styles.knobGradient}
        >
          <Text style={styles.levelText}></Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

// ★ 2. スタイルシートを修正
const styles = StyleSheet.create({
  container: {
    width: KNOB_WIDTH, // コンテナの幅を、より広い「つまみ」の幅に合わせる
    height: BAR_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center', // これにより、細いバーがコンテナの中央に配置される
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  barBackground: {
    width: BAR_WIDTH, // 棒はコンテナより細い
    height: BAR_HEIGHT,
    backgroundColor: '#e5e7eb',
    borderRadius: BAR_WIDTH / 2,
  },
  barTrack: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#d1d5db',
    margin: 3,
    borderRadius: (BAR_WIDTH - 6) / 2,
  },
  knobContainer: {
    position: 'absolute',
    left: 0, // コンテナの左端に合わせる（コンテナ自体が中央揃えの基準）
    width: KNOB_WIDTH,
    height: KNOB_HEIGHT,
    borderRadius: KNOB_HEIGHT / 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  knobGradient: {
    flex: 1,
    borderRadius: KNOB_HEIGHT / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18, // 少し小さく調整
  },
});
