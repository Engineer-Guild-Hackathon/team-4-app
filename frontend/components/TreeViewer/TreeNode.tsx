import { theme } from '@/styles/theme';
import { HierarchyPointNode } from 'd3-hierarchy';
import React, { useEffect } from 'react';
import Animated, {
  interpolateColor,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Circle, ClipPath, Defs, G, Image, Text as SvgText } from 'react-native-svg';
import { TreeNode as D3TreeNode } from './treeUtils';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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

  const animatedCircleProps = useAnimatedProps(() => {
    const stroke = interpolateColor(
      focusAnimation.value,
      [0, 1],
      [theme.colors.secondary.active, theme.colors.text.link] // purple → pinkRed
    );
    const strokeWidth = 2 + focusAnimation.value * 1.5;
    return {
      stroke,
      strokeWidth,
    };
  });

  const [mainLabel, subLabel] = splitLabelByParentheses(node.data.username);
  const clipPathId = `clip-${node.data.id}`;

  return (
    <G x={node.x} y={node.y} onPress={onPress}>
      <Defs>
        <ClipPath id={clipPathId}>
          <Circle r={NODE_RADIUS} />
        </ClipPath>
      </Defs>

      <Image
        href={node.data.avatar} // URLをhrefに指定
        width={NODE_RADIUS * 2}
        height={NODE_RADIUS * 2}
        x={-NODE_RADIUS} // 画像の左上が基準点のため、中心に来るよう調整
        y={-NODE_RADIUS}
        preserveAspectRatio="xMidYMid slice" // アスペクト比を保ちつつ円を埋める
        clipPath={`url(#${clipPathId})`} // 上で定義したクリップパスを適用
      />

      <AnimatedCircle r={NODE_RADIUS} fill="transparent" animatedProps={animatedCircleProps} />

      <SvgText
        y={NODE_RADIUS + 14}
        fill={theme.colors.text.primary}
        fontSize={parseFloat(theme.typography.fontSize.sm) * 16}
        textAnchor="middle"
        fontFamily={theme.typography.fontFamily.primary}
      >
        {mainLabel}
      </SvgText>
      <SvgText
        y={NODE_RADIUS + 28}
        fill={theme.colors.text.tertiary}
        fontSize={parseFloat(theme.typography.fontSize.xs) * 16}
        textAnchor="middle"
        fontFamily={theme.typography.fontFamily.primary}
      >
        {subLabel}
      </SvgText>
    </G>
  );
};
