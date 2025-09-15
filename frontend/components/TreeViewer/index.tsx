import React, { useMemo, useState, useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Svg, { G, Line, Path } from 'react-native-svg';
import { hierarchy, tree, HierarchyPointNode } from 'd3-hierarchy';
import { useTreeData } from '../../hooks/useTreeData';
import { TreeNodeView } from './TreeNode';
import { buildTree, TreeNode as D3TreeNode } from './treeUtils';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TreeViewerProps {
  topicId: string | null;
  onNodePress: (userId: number) => void;
}

export const TreeViewer: React.FC<TreeViewerProps> = ({ topicId, onNodePress }) => {
  const { data, loading } = useTreeData(topicId);
  const [myNodeId, setMyNodeId] = useState<number | null>(null); // Assuming '1' is the user's ID for demo

  // --- D3 Layout ---
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

  // --- Pan & Zoom State ---
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

  // --- Gesture Handlers ---
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
  /*
  const panAndSwipeGesture = Gesture.Pan() // OLD GESTURE
    .onBegin(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onEnd(event => {
      const vx = event.velocityX;
      const vy = event.velocityY;
      const SWIPE_THRESHOLD = 300;

      // Check for horizontal swipe
      if (Math.abs(vx) > Math.abs(vy) && Math.abs(vx) > SWIPE_THRESHOLD) {
        if (vx > 0) runOnJS(moveToSibling)('prev'); // Right swipe -> previous sibling
        else runOnJS(moveToSibling)('next'); // Left swipe -> next sibling
      // Check for vertical swipe
      } else if (Math.abs(vy) > Math.abs(vx) && Math.abs(vy) > SWIPE_THRESHOLD) {
        if (vy > 0) runOnJS(moveToParent)(); // Down swipe -> parent
        else runOnJS(moveToChild)(); // Up swipe -> child
      }
    });
  */

  // --- Button Actions ---
  const DURATION = 300; // This is for buttons, focusNode has its own.

  const fitToNetwork = (onComplete?: () => void) => {
    if (!rootNode) return;
    // This logic is duplicated from the useMemo. Consider extracting to a helper.
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

    // We just need to reset to the initial centered-and-scaled state.
    // The coordinates are already calculated in useMemo.
    // A simple reset to a base scale and zero translation works because
    // the nodes were pre-centered to the screen dimensions.
    scale.value = withTiming(newScale, { duration: DURATION });
    translateX.value = withTiming(0, { duration: DURATION }, () => {
      // if (onComplete) runOnJS(onComplete)(); // onComplete removed
    });
    translateY.value = withTiming(0, { duration: DURATION });
  };
  // --- Animated Style ---
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // --- Auto-Fit on Load ---
  useEffect(() => {
    if (rootNode) {
      fitToNetwork();
    }
  }, [rootNode]);

  // --- Node Tap Handler ---
  const handleNodeTap = (node: HierarchyPointNode<D3TreeNode>) => {
    // zoomToNode(node, scale.value); // Removed zoom-on-tap
    onNodePress(node.data.id);
  };

  // --- Render ---
  if (loading) {
    return (
      <View style={styles.center}><Text style={styles.text}>Loading...</Text></View>
    );
  }
  if (!rootNode) {
    return (
      <View style={styles.center}><Text style={styles.text}>No data to display.</Text></View>
    );
  }

  const nodes = rootNode.descendants();
  const links = rootNode.links();

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={() => fitToNetwork()} activeOpacity={0.7}>
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
              {links.map((link, i) => (
                <Line
                  key={i}
                  x1={link.source.x}
                  y1={link.source.y}
                  x2={link.target.x}
                  y2={link.target.y}
                  stroke="#6b7280"
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
