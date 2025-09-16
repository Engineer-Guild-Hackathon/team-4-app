import React, { useMemo, useState, useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { theme } from '@/styles/theme';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Svg, { G, Line } from 'react-native-svg';
import { hierarchy, tree, HierarchyPointNode } from 'd3-hierarchy';
import { useTreeData } from '../../hooks/useTreeData';
import { TreeNodeView } from './TreeNode';
import { Button } from '../Shared/Button';
import { buildTree, TreeNode as D3TreeNode } from './treeUtils';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TreeViewerProps {
  topicId: string | null;
  onNodePress: (userId: number) => void;
}

export const TreeViewer: React.FC<TreeViewerProps> = ({ topicId, onNodePress }) => {
  const { data, loading } = useTreeData(topicId);
  const [myNodeId, setMyNodeId] = useState<number | null>(null); // デモ用に自分のノードIDを管理

  // --- D3 レイアウト ---
  const layout = useMemo(() => {
    if (!data || data.length === 0) return null;

    const hierarchyData = buildTree(data);
    if (!hierarchyData) return null;

    const treeLayout = tree<D3TreeNode>().nodeSize([120, 150]);
    const root = treeLayout(hierarchy(hierarchyData));
    const nodes = root.descendants();

    const xCoords = nodes.map(n => n.x);
    const yCoords = nodes.map(n => n.y);
    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const minY = Math.min(...yCoords);
    const maxY = Math.max(...yCoords);

    const PADDING = 80;
    const treeWidth = maxX - minX;
    const treeHeight = maxY - minY;

    const scaleX = (screenWidth - PADDING * 2) / treeWidth;
    const scaleY = (screenHeight - PADDING * 2) / treeHeight;
    const initialScale = Math.min(scaleX, scaleY, 1.0);

    // ノード座標を画面中央にスケーリング
    nodes.forEach(node => {
      const centeredX = node.x - (minX + treeWidth / 2);
      const centeredY = node.y - (minY + treeHeight / 2);
      node.x = centeredX * initialScale + screenWidth / 2;
      node.y = centeredY * initialScale + screenHeight / 2;
    });

    const currentUserNode = root.find(node => node.data.id === 1);

    return {
      root,
      bounds: { minX, maxX, minY, maxY },
      initialScale,
      currentUserId: currentUserNode?.data.id ?? null,
    };
  }, [data]);

  const rootNode = layout?.root ?? null;
  const layoutBounds = layout?.bounds ?? null;
  const initialScale = layout?.initialScale ?? 1;

  // --- ズーム・パン用の共有値 ---
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const findNodeById = (id: number | null): HierarchyPointNode<D3TreeNode> | undefined => {
    return id !== null ? rootNode?.find(node => node.data.id === id) : undefined;
  };

  const zoomIn = () => {
    scale.value = withTiming(Math.min(scale.value * 1.5, 4.0), { duration: 300 });
  };

  const zoomOut = () => {
    scale.value = withTiming(Math.max(scale.value / 1.5, 0.3), { duration: 300 });
  };

  // --- ジェスチャー処理 ---
  const exploreGesture = Gesture.Simultaneous(
    Gesture.Pinch()
      .onUpdate(e => {
        scale.value = Math.max(0.3, Math.min(e.scale * savedScale.value, 4.0));
      })
      .onEnd(() => {
        savedScale.value = scale.value;
      }),
    Gesture.Pan()
      .onUpdate(e => {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      })
      .onBegin(() => {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      }),
  );
  const composedGesture = exploreGesture;

  // --- ボタン操作 ---
  const DURATION = 300;

  const fitToNetwork = () => {
    if (!rootNode) return;

    const nodes = rootNode.descendants();
    if (nodes.length === 0) return;

    const xCoords = nodes.map(n => n.x);
    const yCoords = nodes.map(n => n.y);
    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const maxY = Math.max(...yCoords);

    const PADDING = 80;
    const treeWidth = maxX - minX;
    const treeHeight = maxY;

    const scaleX = (screenWidth - PADDING * 2) / treeWidth;
    const scaleY = (screenHeight - PADDING * 2) / treeHeight;
    const newScale = Math.min(scaleX, scaleY, 1.0);

    // 初期スケールと中央揃えにリセット
    scale.value = withTiming(newScale, { duration: DURATION });
    translateX.value = withTiming(0, { duration: DURATION });
    translateY.value = withTiming(0, { duration: DURATION });
  };

  // --- アニメーションスタイル ---
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // --- 初期表示時に全体をフィット ---
  useEffect(() => {
    if (rootNode) {
      fitToNetwork();
    }
  }, [rootNode]);

  // --- ノードタップ処理 ---
  const handleNodeTap = (node: HierarchyPointNode<D3TreeNode>) => {
    onNodePress(node.data.id);
  };

  // --- レンダリング ---
  if (loading) {
    return (
      <View style={styles.center}><Text style={styles.text}>読み込み中...</Text></View>
    );
  }
  if (!rootNode) {
    return (
      <View style={styles.center}><Text style={styles.text}>表示できるデータがありません。</Text></View>
    );
  }

  const nodes = rootNode.descendants();
  const links = rootNode.links();

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.controlsContainer}>
        <Button style={styles.controlButton} textStyle={styles.controlButtonText} onPress={() => fitToNetwork()}>
          ⛶
        </Button>
        <Button style={styles.controlButton} textStyle={styles.controlButtonText} onPress={zoomIn}>
          ＋
        </Button>
        <Button style={styles.controlButton} textStyle={styles.controlButtonText} onPress={zoomOut}>
          －
        </Button>
      </View>

      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.flex, animatedStyle]}>
          <Svg width={screenWidth} height={screenHeight}>
            <G>
              {links.map((link, i) => (
                <Line
                  key={i}
                  x1={link.source.x}
                  y1={link.source.y}
                  x2={link.target.x}
                  y2={link.target.y}
                  stroke={theme.colors.textGray}
                  strokeWidth={1.5}
                />
              ))}
              {nodes.map(node => (
                <TreeNodeView
                  key={node.data.id}
                  node={node}
                  onPress={() => handleNodeTap(node)}
                  isFocused={false}
                />
              ))}
            </G>
          </Svg>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const remToPx = (rem: string) => parseFloat(rem) * 16;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.primary,
  },
  text: {
    color: theme.colors.text.primary,
    fontSize: remToPx(theme.typography.fontSize.base),
    fontFamily: theme.typography.fontFamily.primary,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 120,
    right: remToPx(theme.spacing[8]), // xl
    zIndex: 10,
    flexDirection: 'column',
    gap: remToPx(theme.spacing[4]), // md
  },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    width: 54,
    height: 54,
    borderRadius: remToPx(theme.borderRadius.full),
    borderColor: theme.colors.background.tertiary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  controlButtonText: {
    color: theme.colors.text.secondary,
    fontSize: remToPx(theme.typography.fontSize.xl),
    fontWeight: theme.typography.fontWeight.bold,
    fontFamily: theme.typography.fontFamily.primary,
  },
});
