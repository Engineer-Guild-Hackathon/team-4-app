import { hierarchy, HierarchyPointNode, tree } from 'd3-hierarchy';
import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { G, Line } from 'react-native-svg';
import { useTreeData } from '../../hooks/useTreeData';
import { TreeNodeView } from './TreeNode';
import { buildTree, TreeNode as D3TreeNode } from './treeUtils';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const HORIZONTAL_SPACING = 120;

interface TreeViewerProps {
  topicId: string | null;
  onNodePress: (userId: number) => void;
}

export const TreeViewer: React.FC<TreeViewerProps> = ({ topicId, onNodePress }) => {
  // useTreeDataフックがmax_levelとmin_levelも返すように修正したと仮定
  // もしそうでなければ、ここでdataから計算してもOK
  const { data, loading, max_level, min_level } = useTreeData(topicId);

  const layout = useMemo(() => {
    if (!data || data.length === 0) return null;

    const hierarchyData = buildTree(data);
    const root = hierarchy(hierarchyData);
    const nodes = root.descendants().slice(1);

    if (nodes.length === 0) return null;
    
    // X座標の配置はD3に任せる
    const treeLayout = tree<D3TreeNode>().nodeSize([HORIZONTAL_SPACING, 0]); // Yのspacingは使わない
    const layoutRoot = treeLayout(root);
    const layoutNodes = layoutRoot.descendants().slice(1);

    nodes.forEach((node, i) => {
      node.x = layoutNodes[i].x;
    });

    // ★★★ ここからが修正箇所 ★★★

    // 画面の上下パディング
    const PADDING_Y = 150;
    // Y座標を計算するための高さを確保
    const availableHeight = screenHeight - PADDING_Y * 2;

    // レベルの範囲 (APIからの値を使うか、データから計算)
    const maxLevel = max_level ?? Math.max(...nodes.map(n => n.data.level), 0);
    const minLevel = min_level ?? Math.min(...nodes.map(n => n.data.level), 0);
    const levelRange = maxLevel - minLevel;

    // Y座標をlevel値に基づいて、画面の高さに合わせて正規化
    nodes.forEach(node => {
      // levelRangeが0の場合（全員同じレベル）は中央に配置
      const ratio = levelRange === 0 ? 0.5 : (maxLevel - node.data.level) / levelRange;
      node.y = ratio * availableHeight + PADDING_Y;
    });

    // X座標を画面中央に配置するための計算
    const xCoords = nodes.map(n => n.x!);
    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const treeWidth = maxX - minX;

    nodes.forEach(node => {
      // X座標をツリーの中央からの相対位置に変換し、画面中央に配置
      const centeredX = node.x! - (minX + treeWidth / 2);
      node.x = centeredX + screenWidth / 2;
    });
    
    // ★★★ 修正箇所ここまで ★★★

    return { root };
  }, [data, max_level, min_level]);

  const rootNode = layout?.root ?? null;

  // --- ズーム・パン・ジェスチャー・ボタン操作・スタイルは変更なし ---
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
      .onUpdate(e => { scale.value = Math.max(0.3, Math.min(e.scale * savedScale.value, 4.0)); })
      .onEnd(() => { savedScale.value = scale.value; });

  const panGesture = Gesture.Pan()
      .onUpdate(e => {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      })
      .onBegin(() => {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      });
  
  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const zoomIn = () => { scale.value = withTiming(Math.min(scale.value * 1.5, 4.0), { duration: 300 }); };
  const zoomOut = () => { scale.value = withTiming(Math.max(scale.value / 1.5, 0.3), { duration: 300 }); };
  const fitToNetwork = () => {
    scale.value = withTiming(1, { duration: 300 });
    translateX.value = withTiming(0, { duration: 300 });
    translateY.value = withTiming(0, { duration: 300 });
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  useEffect(() => {
    fitToNetwork();
  }, [layout]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator /></View>;
  }
  if (!rootNode) {
    return <View style={styles.center}><Text style={styles.text}>表示できるデータがありません。</Text></View>;
  }

  const nodesToRender = rootNode.descendants().slice(1);
  const linksToRender = rootNode.links().filter(link => link.source.data.id !== -1);

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={fitToNetwork} activeOpacity={0.7}>
          <Text style={styles.controlButtonText}>⛶</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={zoomIn} activeOpacity={0.7}>
          <Text style={styles.controlButtonText}>＋</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={zoomOut} activeOpacity={0.7}>
          <Text style={styles.controlButtonText}>－</Text>
        </TouchableOpacity>
      </View>

      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.flex, animatedStyle]}>
          <Svg width={screenWidth} height={screenHeight}>
            <G>
              {linksToRender.map((link) => (
                <Line
                  key={`${link.source.data.id}-${link.target.data.id}`}
                  x1={link.source.x!} y1={link.source.y!}
                  x2={link.target.x!} y2={link.target.y!}
                  stroke="#6b7280" strokeWidth={1.5}
                />
              ))}
              {nodesToRender.map(node => (
                <TreeNodeView
                  key={node.data.id}
                  node={node as HierarchyPointNode<D3TreeNode>}
                  onPress={() => onNodePress(node.data.id)}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  text: { color: '#1f2937' },
  controlsContainer: {
    position: 'absolute',
    bottom: 120, 
    right: 20,
    zIndex: 10,
    flexDirection: 'column',
    gap: 12,
  },
  controlButton: {
    backgroundColor: '#fff',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  controlButtonText: { color: '#374151', fontSize: 20, fontWeight: 'bold' },
});