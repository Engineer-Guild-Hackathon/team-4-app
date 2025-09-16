import React, { useEffect } from 'react';
import { G, Circle, Text as SvgText } from 'react-native-svg';
import { HierarchyPointNode } from 'd3-hierarchy';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { TreeNode as D3TreeNode } from './treeUtils';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  node: HierarchyPointNode<D3TreeNode>;
  onPress: () => void;
  isFocused: boolean;
}

const NODE_RADIUS = 20;

// 括弧で区切られたラベルを分割
const splitLabelByParentheses = (label: string): [string, string] => {
  const match = label.match(/^(.*?)\s*(\([^)]*\)|（[^）]*）)?$/);
  return match ? [match[1].trim(), (match[2] || '').trim()] : [label, ''];
};

export const TreeNodeView: React.FC<Props> = ({ node, onPress, isFocused }) => {
  // フォーカスアニメーション用の共有値 (0 = 非フォーカス, 1 = フォーカス)
  const focusAnimation = useSharedValue(0);

  // isFocused が変わったらアニメーション
  useEffect(() => {
    focusAnimation.value = withTiming(isFocused ? 1 : 0, { duration: 300 });
  }, [isFocused, focusAnimation]);

  // SVG 要素用のアニメーションプロパティ
  const animatedCircleProps = useAnimatedProps(() => {
    // アニメーション値に応じて色と線幅を補間
    const stroke = interpolateColor(focusAnimation.value, [0, 1], ['#573cfa', '#ff6b6b']);
    const strokeWidth = 2 + focusAnimation.value * 1.5;
    return {
      stroke,
      strokeWidth,
    };
  });

  const [mainLabel, subLabel] = splitLabelByParentheses(node.data.username);

  return (
    <G x={node.x} y={node.y} onPress={onPress}>
      <AnimatedCircle r={NODE_RADIUS} fill="#fff" animatedProps={animatedCircleProps} />
      <SvgText y={NODE_RADIUS + 14} fill="#1f2937" fontSize={12} textAnchor="middle">
        {mainLabel}
      </SvgText>
      <SvgText y={NODE_RADIUS + 28} fill="#6b7280" fontSize={10} textAnchor="middle">
        {subLabel}
      </SvgText>
    </G>
  );
};
