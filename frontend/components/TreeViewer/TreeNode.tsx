import { theme } from '@/styles/theme';
import { HierarchyPointNode } from 'd3-hierarchy';
import { Image } from 'expo-image'; // ★ expo-image を使用
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { TreeNode as D3TreeNode } from './treeUtils';

interface Props {
  node: HierarchyPointNode<D3TreeNode>;
  onPress: () => void;
  isFocused: boolean;
}

const NODE_RADIUS = 40;

const splitLabelByParentheses = (label: string): [string, string] => {
  const match = label.match(/^(.*?)\s*(\([^)]*\)|（[^））]*）)?$/);
  return match ? [match[1].trim(), (match[2] || '').trim()] : [label, ''];
};

export const TreeNodeView: React.FC<Props> = ({ node, onPress, isFocused }) => {
  const focusAnimation = useSharedValue(0);

  useEffect(() => {
    focusAnimation.value = withTiming(isFocused ? 1 : 0, { duration: 300 });
  }, [isFocused, focusAnimation]);

  const animatedBorderStyle = useAnimatedStyle(() => {
    return {
      borderColor: interpolateColor(
        focusAnimation.value,
        [0, 1],
        [theme.colors.secondary.active, theme.colors.text.link]
      ),
      borderWidth: 2 + focusAnimation.value * 1.5,
    };
  });

  const [mainLabel, subLabel] = splitLabelByParentheses(node.data.username);

  const initialCharacter = node.data.username
    ? encodeURIComponent(node.data.username.charAt(0))
    : 'P';
  const imageSize = NODE_RADIUS * 2;
  const placeholderUrl = `https://placehold.co/${imageSize}x${imageSize}/e0e0e0/555555?text=${initialCharacter}`;

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <Animated.View style={[styles.avatarContainer, animatedBorderStyle]}>
        <Image
          source={{ uri: node.data.avatar || placeholderUrl }}
          style={styles.avatar}
          contentFit="cover"
          transition={300}
        />
      </Animated.View>

      <Text style={styles.mainLabel} numberOfLines={1}>
        {mainLabel}
      </Text>
      <Text style={styles.subLabel} numberOfLines={1}>
        {subLabel}
      </Text>
    </TouchableOpacity>
  );
};

export const NODE_WIDTH = 90; // 親コンポーネントが中央揃えに使うための幅
export const NODE_HEIGHT = 80; // 親コンポーネントが中央揃えに使うための高さ

const styles = StyleSheet.create({
  container: {
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    alignItems: 'center',
  },
  avatarContainer: {
    width: NODE_RADIUS * 2,
    height: NODE_RADIUS * 2,
    borderRadius: NODE_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0', // 枠線の背景色
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: NODE_RADIUS,
  },
  mainLabel: {
    marginTop: 4,
    color: theme.colors.text.primary,
    fontSize: parseFloat(theme.typography.fontSize.sm) * 16,
    fontFamily: theme.typography.fontFamily.primary,
    textAlign: 'center',
  },
  subLabel: {
    color: theme.colors.text.tertiary,
    fontSize: parseFloat(theme.typography.fontSize.xs) * 16,
    fontFamily: theme.typography.fontFamily.primary,
    textAlign: 'center',
  },
});
