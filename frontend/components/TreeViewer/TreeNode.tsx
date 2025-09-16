import { HierarchyPointNode } from 'd3-hierarchy';
import React, { useEffect } from 'react';
import Animated, {
  interpolateColor,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
// ★ 修正点 1: Image, Defs, ClipPath をインポート
import { Circle, ClipPath, Defs, G, Image, Text as SvgText } from 'react-native-svg';
import { TreeNode as D3TreeNode } from './treeUtils';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  node: HierarchyPointNode<D3TreeNode>;
  onPress: () => void;
  isFocused: boolean;
}

const NODE_RADIUS = 20;

// 括弧で区切られたラベルを分割 (変更なし)
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
    const stroke = interpolateColor(focusAnimation.value, [0, 1], ['#573cfa', '#ff6b6b']);
    const strokeWidth = 2 + focusAnimation.value * 1.5;
    return {
      stroke,
      strokeWidth,
    };
  });

  const [mainLabel, subLabel] = splitLabelByParentheses(node.data.username);
  
  // ★ 修正点 2: 各ノードにユニークなクリップパスIDを生成
  const clipPathId = `clip-${node.data.id}`;

  return (
    <G x={node.x} y={node.y} onPress={onPress}>
      {/* ★ 修正点 3: 画像を円形に切り抜くための定義を追加 */}
      <Defs>
        <ClipPath id={clipPathId}>
          <Circle r={NODE_RADIUS} />
        </ClipPath>
      </Defs>

      {/* ★ 修正点 4: アバター画像を表示 */}
      <Image
        href={node.data.avatar} // URLをhrefに指定
        width={NODE_RADIUS * 2}
        height={NODE_RADIUS * 2}
        x={-NODE_RADIUS} // 画像の左上が基準点のため、中心に来るよう調整
        y={-NODE_RADIUS}
        preserveAspectRatio="xMidYMid slice" // アスペクト比を保ちつつ円を埋める
        clipPath={`url(#${clipPathId})`} // 上で定義したクリップパスを適用
      />

      {/* ★ 修正点 5: Circleを画像の枠線として使用するため、塗りつぶしを透明に */}
      <AnimatedCircle
        r={NODE_RADIUS}
        fill="transparent"
        animatedProps={animatedCircleProps}
      />

      {/* テキスト表示部分は変更なし */}
      <SvgText y={NODE_RADIUS + 14} fill="#1f2937" fontSize={12} textAnchor="middle">
        {mainLabel}
      </SvgText>
      <SvgText y={NODE_RADIUS + 28} fill="#6b7280" fontSize={10} textAnchor="middle">
        {subLabel}
      </SvgText>
    </G>
  );
};