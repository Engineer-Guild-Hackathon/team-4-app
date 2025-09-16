import { hierarchy, HierarchyPointNode, tree } from 'd3-hierarchy';
import React, { useCallback, useEffect, useMemo } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { G, Line } from 'react-native-svg';
import { useTreeData } from '../../hooks/useTreeData';
import { TreeNodeView } from './TreeNode';
import { buildTree, TreeNode as D3TreeNode } from './treeUtils';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const HORIZONTAL_SPACING = 120;

type NodeCoords = {
  x: number;
  y: number;
};

interface TreeViewerProps {
  topicId: string | null;
  onNodePress: (userId: number) => void;
}

export const TreeViewer: React.FC<TreeViewerProps> = ({ topicId, onNodePress }) => {
  const { data, loading, max_level, min_level } = useTreeData(topicId);

  const layout = useMemo(() => {
    if (!data || data.length === 0) return null;
    const hierarchyData = buildTree(data);
    const root = hierarchy(hierarchyData);
    let nodes = root.descendants().slice(1);
    if (nodes.length === 0) return null;

    const treeLayout = tree<D3TreeNode>().nodeSize([HORIZONTAL_SPACING, 0]);
    const layoutRoot = treeLayout(root);
    const layoutNodes = layoutRoot.descendants().slice(1);
    nodes.forEach((node, i) => {
      node.x = layoutNodes[i].x;
    });

    const PADDING_Y = 150;
    const availableHeight = screenHeight - PADDING_Y * 2;
    const maxLevel = max_level ?? Math.max(...nodes.map(n => n.data.level), 0);
    const minLevel = min_level ?? Math.min(...nodes.map(n => n.data.level), 0);
    const levelRange = maxLevel - minLevel;
    nodes.forEach(node => {
      const ratio = levelRange === 0 ? 0.5 : (maxLevel - node.data.level) / levelRange;
      node.y = ratio * availableHeight + PADDING_Y;
    });

    const xCoords = nodes.map(n => n.x ?? 0);
    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const treeWidth = maxX - minX;
    nodes.forEach(node => {
      const centeredX = (node.x ?? 0) - (minX + treeWidth / 2);
      node.x = centeredX + screenWidth / 2;
    });
    const links = root.links().filter(link => link.source.data.id !== -1);
    return { root, nodes, links };
  }, [data, max_level, min_level]);

  const { root: rootNode, nodes: nodesToRender, links: linksToRender } = layout || {
    root: null,
    nodes: [],
    links: [],
  };

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const nodeCoords = useSharedValue<NodeCoords[]>([]);

  useEffect(() => {
    if (nodesToRender && nodesToRender.length > 0) {
      nodeCoords.value = nodesToRender.map(node => ({
        x: node.x ?? 0,
        y: node.y ?? 0,
      }));
    } else {
      nodeCoords.value = [];
    }
  }, [nodesToRender]);

  // ★ 修正点: 探索ロジックを二段階方式に改良
  const findAndAnimateToNextNode = useCallback((velocityX: number, velocityY: number) => {
    'worklet';
    const coordsList = nodeCoords.value;
    const vLengthSq = velocityX ** 2 + velocityY ** 2;

    // 速度が遅すぎる場合は何もしない
    if (vLengthSq < 50 * 50) {
      return;
    }
    if (coordsList.length === 0) return;

    const currentScale = scale.value;
    const currentCenterX = (screenWidth / 2 - translateX.value) / currentScale;
    const currentCenterY = (screenHeight / 2 - translateY.value) / currentScale;
    
    // 逆方向にあるノード候補をすべてリストアップ
    const backwardNodes = [];
    for (let i = 0; i < coordsList.length; i++) {
      const node = coordsList[i];
      const vecX = node.x - currentCenterX;
      const vecY = node.y - currentCenterY;
      const dotProduct = velocityX * vecX + velocityY * vecY;

      if (dotProduct < 0) {
        const dLengthSq = vecX ** 2 + vecY ** 2;
        if (dLengthSq === 0) continue; // 中心そのものは候補から除外

        // cos^2(θ)を計算し、軸との一致度を測る
        const cosSq = dotProduct ** 2 / (vLengthSq * dLengthSq);
        backwardNodes.push({ node, dLengthSq, cosSq });
      }
    }

    if (backwardNodes.length === 0) {
      return; // 候補がなければ終了
    }

    let bestCandidate: NodeCoords | null = null;

    // ステップ1: 厳密な探索（軸に非常に近い候補を探す）
    const strictCandidates = backwardNodes.filter(item => item.cosSq > 0.9); // 角度 約±18度以内

    if (strictCandidates.length > 0) {
      // 厳密な候補の中から、最も距離が近いものを選択
      strictCandidates.sort((a, b) => a.dLengthSq - b.dLengthSq);
      bestCandidate = strictCandidates[0].node;
    } else {
      // ステップ2: 緩和した探索（厳密な候補がなければ、範囲を広げて探す）
      backwardNodes.sort((a, b) => a.dLengthSq - b.dLengthSq);
      bestCandidate = backwardNodes[0].node;
    }
    
    if (bestCandidate) {
      const targetTx = screenWidth / 2 - bestCandidate.x * currentScale;
      const targetTy = screenHeight / 2 - bestCandidate.y * currentScale;
      translateX.value = withTiming(targetTx, { duration: 300 });
      translateY.value = withTiming(targetTy, { duration: 300 });
    }
  }, [nodeCoords, scale, translateX, translateY]);

  const pinchGesture = Gesture.Pinch()
    .onUpdate(e => {
      scale.value = Math.max(0.3, Math.min(e.scale * savedScale.value, 4.0));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });
  
  const panGesture = Gesture.Pan()
    .onStart(() => {
      cancelAnimation(translateX);
      cancelAnimation(translateY);
    })
    .onUpdate(() => {
      // ドラッグ中の移動は無効
    })
    .onEnd(e => {
      findAndAnimateToNextNode(e.velocityX, e.velocityY);
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
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
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

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={fitToNetwork} activeOpacity={0.7}><Text style={styles.controlButtonText}>⛶</Text></TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={zoomIn} activeOpacity={0.7}><Text style={styles.controlButtonText}>＋</Text></TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={zoomOut} activeOpacity={0.7}><Text style={styles.controlButtonText}>－</Text></TouchableOpacity>
      </View>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.flex, animatedStyle]}>
          <Svg width={screenWidth} height={screenHeight}>
            <G>
              {linksToRender.map(link => (
                <Line
                  key={`${link.source.data.id}-${link.target.data.id}`}
                  x1={link.source.x ?? 0} y1={link.source.y ?? 0}
                  x2={link.target.x ?? 0} y2={link.target.y ?? 0}
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
  controlsContainer: { position: 'absolute', bottom: 120, right: 20, zIndex: 10, flexDirection: 'column', gap: 12, },
  controlButton: { backgroundColor: '#fff', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, },
  controlButtonText: { color: '#374151', fontSize: 20, fontWeight: 'bold' },
});