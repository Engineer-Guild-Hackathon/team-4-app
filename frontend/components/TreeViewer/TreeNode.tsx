import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { HierarchyPointNode } from 'd3-hierarchy';
import { TreeNode } from './treeUtils';

interface Props {
  node: HierarchyPointNode<TreeNode>;
  onPress: () => void;
  isFocused: boolean;
}

<<<<<<< HEAD
const NODE_RADIUS = 28; // Radius of the circle node
=======
const NODE_RADIUS = 20; // Radius of the circle node

const splitLabelByParentheses = (label: string): [string, string] => {
  const match = label.match(/^(.*?)\s*(\([^)]*\)|（[^）]*）)?$/);
  return match ? [match[1].trim(), (match[2] || '').trim()] : [label, ''];
};

export const TreeNodeView: React.FC<Props> = ({ node, onPress, isFocused }) => {
  // Shared value to drive the focus animation (0 = not focused, 1 = focused)
  const focusAnimation = useSharedValue(0);

  // Animate the value when the isFocused prop changes
  useEffect(() => {
    focusAnimation.value = withTiming(isFocused ? 1 : 0, { duration: 300 });
  }, [isFocused, focusAnimation]);

  // useAnimatedProps is for animating props of non-View components, like SVG elements.
  // It ensures animations run on the UI thread.
  const animatedCircleProps = useAnimatedProps(() => {
    // Interpolate between colors and stroke widths based on the animation value
    const stroke = interpolateColor(
      focusAnimation.value,
      [0, 1],
      ['#573cfa', '#ff6b6b'], // Unfocused color -> Focused color
    );
    const strokeWidth = 2 + focusAnimation.value * 1.5; // 2 -> 3.5
    return {
      stroke,
      strokeWidth,
    };
  });

  const [mainLabel, subLabel] = splitLabelByParentheses(node.data.username);
>>>>>>> 4816fba (fix(frontend): ズーム・スワイプの挙動修正)

export const TreeNodeView: React.FC<Props> = ({ node, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.touchableWrapper}>
      <View style={styles.nodeWrapper}>
        <Image
          source={
            node.data.avatar
              ? { uri: node.data.avatar }
              : { uri: `https://placehold.co/64x64/e0e0e0/555555?text=${node.data.username.charAt(0)}` }
          }
          style={styles.avatar}
        />
        <Text style={styles.nodeLabel}>{String(node.data.username ?? '')}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchableWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: NODE_RADIUS * 2,
    height: NODE_RADIUS * 2,
    borderRadius: NODE_RADIUS,
    borderWidth: 2,
    borderColor: '#000000ff',
  },
  nodeLabel: {
    position: 'absolute',
    top: NODE_RADIUS * 2 + 5,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    width: NODE_RADIUS * 4,
  },
});
