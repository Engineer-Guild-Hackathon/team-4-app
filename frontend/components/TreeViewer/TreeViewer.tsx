import { hierarchy, HierarchyPointNode, tree } from 'd3-hierarchy';
import React, { useCallback, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { G, Line } from 'react-native-svg';
import { useTreeData } from '../../hooks/useTreeData';
import { NODE_HEIGHT, NODE_WIDTH, TreeNodeView } from './TreeNode';
import { buildTree, TreeNode as D3TreeNode } from './treeUtils';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CANVAS_MULTIPLIER = Platform.OS === 'ios' ? 5 : 3;
const CANVAS_WIDTH = screenWidth * CANVAS_MULTIPLIER;
const CANVAS_HEIGHT = screenHeight * CANVAS_MULTIPLIER;

// ノード間隔
const VERTICAL_SPACING = 240;
const HORIZONTAL_SPACING = 180;

const VISIBLE_RADIUS = 1500; 

type NodeCoords = {
  id: number; 
  x: number;
  y: number;
};

interface TreeViewerProps {
  topicId: string | null;
  userId?: number;
  onNodePress: (userId: number) => void;
}

export const TreeViewer: React.FC<TreeViewerProps> = ({ topicId, userId, onNodePress }) => {
  const { data, loading, max_level } = useTreeData(topicId);

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
    const maxLevel = max_level ?? Math.max(...nodes.map(n => n.data.level), 0);
    nodes.forEach(node => {
      node.y = (maxLevel - node.data.level) * VERTICAL_SPACING;
    });

    const xCoords = nodes.map(n => n.x ?? 0);
    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const treeWidth = maxX - minX;
    nodes.forEach(node => {
      const centeredX = (node.x ?? 0) - (minX + treeWidth / 2);
      node.x = centeredX + CANVAS_WIDTH / 2;
    });

    const yCoords = nodes.map(n => n.y ?? 0);
    const minY = Math.min(...yCoords);
    const maxY = Math.max(...yCoords);
    const treeHeight = maxY - minY;

    nodes.forEach(node => {
      const centeredY = (node.y ?? 0) - (minY + treeHeight / 2);
      node.y = centeredY + CANVAS_HEIGHT / 2;
    });

    const links = root.links().filter(link => link.source.data.id !== -1);
    return { root, nodes, links };
  }, [data, max_level]);

  const {
    root: rootNode,
    nodes: nodesToRender,
    links: linksToRender,
  } = layout || {
    root: null,
    nodes: [],
    links: [],
  };

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const nodeCoords = useSharedValue<NodeCoords[]>([]);

  const getVisibleNodes = (nodes: typeof nodesToRender) => {
    if (Platform.OS !== 'android') return nodes;
    // Androidのみ仮想化
    const centerX = CANVAS_WIDTH / 2 - translateX.value / scale.value;
    const centerY = CANVAS_HEIGHT / 2 - translateY.value / scale.value;
    return nodes.filter(node => {
      const dx = (node.x ?? 0) - centerX;
      const dy = (node.y ?? 0) - centerY;
      return dx * dx + dy * dy < VISIBLE_RADIUS * VISIBLE_RADIUS;
    });
  };

  useEffect(() => {
    if (nodesToRender && nodesToRender.length > 0) {
      nodeCoords.value = nodesToRender.map(node => ({
        id: node.data.id,
        x: node.x ?? 0,
        y: node.y ?? 0,
      }));
    } else {
      nodeCoords.value = [];
    }
  }, [nodesToRender, nodeCoords]);

  const findAndAnimateToNextNode = useCallback(
    (velocityX: number, velocityY: number) => {
      'worklet';
      const coordsList = nodeCoords.value;
      const vLengthSq = velocityX ** 2 + velocityY ** 2;

      if (vLengthSq < 150 * 150) return;
      if (coordsList.length === 0) return;

      const currentScale = scale.value;
      const currentCenterX = CANVAS_WIDTH / 2 - translateX.value / currentScale;
      const currentCenterY = CANVAS_HEIGHT / 2 - translateY.value / currentScale;

      const backwardNodes = [];
      for (let i = 0; i < coordsList.length; i++) {
        const node = coordsList[i];
        const vecX = node.x - currentCenterX;
        const vecY = node.y - currentCenterY;
        const dotProduct = velocityX * vecX + velocityY * vecY;

        if (dotProduct < 0) {
          const dLengthSq = vecX ** 2 + vecY ** 2;
          if (dLengthSq === 0) continue;
          const cosSq = dotProduct ** 2 / (vLengthSq * dLengthSq);
          backwardNodes.push({ node, dLengthSq, cosSq });
        }
      }

      if (backwardNodes.length === 0) return;

      let bestCandidate: NodeCoords | null = null;
      const strictCandidates = backwardNodes.filter(item => item.cosSq > 0.9);

      if (strictCandidates.length > 0) {
        strictCandidates.sort((a, b) => a.dLengthSq - b.dLengthSq);
        bestCandidate = strictCandidates[0].node;
      } else {
        backwardNodes.sort((a, b) => a.dLengthSq - b.dLengthSq);
        bestCandidate = backwardNodes[0].node;
      }

      if (bestCandidate) {
        const targetTx = (CANVAS_WIDTH / 2 - bestCandidate.x) * currentScale;
        const targetTy = (CANVAS_HEIGHT / 2 - bestCandidate.y) * currentScale;
        translateX.value = withTiming(targetTx, { duration: 300 });
        translateY.value = withTiming(targetTy, { duration: 300 });
      }
    },
    [nodeCoords, scale, translateX, translateY]
  );

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
    .onUpdate(() => {})
    .onEnd(e => {
      const scaleValue = scale.value;
      const svgVelocityX = e.velocityX / scaleValue;
      const svgVelocityY = e.velocityY / scaleValue;
      findAndAnimateToNextNode(svgVelocityX, svgVelocityY);
    })
    .shouldCancelWhenOutside(false);

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const zoomIn = () => {
    scale.value = withTiming(Math.min(scale.value * 1.5, 4.0), { duration: 300 });
  };
  const zoomOut = () => {
    scale.value = withTiming(Math.max(scale.value / 1.5, 0.3), { duration: 300 });
  };

  const fitToNetwork = useCallback(() => {
    scale.value = withTiming(1, { duration: 300 });
    translateX.value = withTiming(0, { duration: 300 });
    translateY.value = withTiming(0, { duration: 300 });
  }, [scale, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  useEffect(() => {
    if (layout) {
      // userIdプロップが渡されている場合、そのノードを探して中央に移動
      if (userId && nodesToRender.length > 0) {
        const targetNode = nodesToRender.find(node => node.data.id === userId);

        if (targetNode) {
          // 見つかったノードを中央に配置するための移動量を計算
          const targetTx = CANVAS_WIDTH / 2 - (targetNode.x ?? 0);
          const targetTy = CANVAS_HEIGHT / 2 - (targetNode.y ?? 0);

          // アニメーションで指定ノードへ移動
          translateX.value = withTiming(targetTx, { duration: 500 });
          translateY.value = withTiming(targetTy, { duration: 500 });
          scale.value = withTiming(1, { duration: 500 });
        } else {
          // 指定されたuserIdのノードが見つからなかった場合は、全体を表示
          fitToNetwork();
        }
      } else {
        // userIdプロップがない場合は、全体を表示
        fitToNetwork();
      }
    }
  }, [layout, userId, fitToNetwork, nodesToRender, scale, translateX, translateY]); // layoutとuserIdが準備できたら実行

  const getVisibleLinks = (links: typeof linksToRender, visibleNodes: typeof nodesToRender) => {
    if (Platform.OS !== 'android') return links;
    const visibleIds = new Set(visibleNodes.map(n => n.data.id));
    return links.filter(
      link => visibleIds.has(link.source.data.id) && visibleIds.has(link.target.data.id)
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }
  if (!rootNode) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>表示できるデータがありません。</Text>
      </View>
    );
  }

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
        <View style={styles.gestureContainer}>
          <Animated.View style={[styles.canvas, animatedStyle]}>
            <Svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={StyleSheet.absoluteFill}>
              <G>
                {getVisibleLinks(linksToRender, getVisibleNodes(nodesToRender)).map(link => (
                  <Line
                    key={`${link.source.data.id}-${link.target.data.id}`}
                    x1={link.source.x ?? 0}
                    y1={link.source.y ?? 0}
                    x2={link.target.x ?? 0}
                    y2={link.target.y ?? 0}
                    stroke="#6b7280"
                    strokeWidth={1.5}
                  />
                ))}
              </G>
            </Svg>
            {getVisibleNodes(nodesToRender).map(node => (
              <View
                key={node.data.id}
                style={{
                  position: 'absolute',
                  left: (node.x ?? 0) - NODE_WIDTH / 2,
                  top: (node.y ?? 0) - NODE_HEIGHT / 2,
                }}
              >
                <TreeNodeView
                  node={node as HierarchyPointNode<D3TreeNode>}
                  onPress={() => onNodePress(node.data.id)}
                  isFocused={false} 
                />
              </View>
            ))}
          </Animated.View>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
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
  gestureContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  canvas: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    position: 'absolute',
    left: (screenWidth - CANVAS_WIDTH) / 2,
    top: (screenHeight - CANVAS_HEIGHT) / 2,
  },
});
