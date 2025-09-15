import React, { useMemo, useState, useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
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
  const [focusedNodeId, setFocusedNodeId] = useState<number | null>(null);
  const [myNodeId, setMyNodeId] = useState<number | null>(null); // Assuming '1' is the user's ID for demo

  // --- D3 Layout ---
  const rootNode = useMemo(() => {
    if (!data || data.length === 0) return null;
    const hierarchyData = buildTree(data);
    if (!hierarchyData) return null;

    const treeLayout = tree<D3TreeNode>().nodeSize([120, 150]);
    const root = treeLayout(hierarchy(hierarchyData));

    // --- Find "my" node ---
    // This is a placeholder. You should replace this with your actual logic
    // to identify the current user's node.
    const currentUserNode = root.find(node => node.data.id === 1);
    if (currentUserNode) setMyNodeId(currentUserNode.data.id);

    // Fit and center tree on screen
    const nodes = root.descendants();
    if (nodes.length > 0) {
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

      nodes.forEach(node => {
        const centeredX = node.x - (minX + treeWidth / 2);
        const centeredY = node.y - treeHeight / 2;
        node.x = centeredX * newScale + screenWidth / 2;
        node.y = centeredY * newScale + screenHeight / 2;
      });
    }

    return root;
  }, [data]);

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

  // --- Gesture Handlers ---
  const moveToParent = () => {
    const node = findNodeById(focusedNodeId);
    if (node?.parent) focusNode(node.parent);
  };

  const moveToChild = () => {
    const node = findNodeById(focusedNodeId);
    if (node?.children?.length) focusNode(node.children[0]);
  };

  const moveToSibling = (direction: 'next' | 'prev') => {
    const node = findNodeById(focusedNodeId);
    const siblings = node?.parent?.children;
    if (node && siblings) {
      const index = siblings.indexOf(node);
      const targetIndex = direction === 'next' ? index + 1 : index - 1;
      if (targetIndex >= 0 && targetIndex < siblings.length) {
        focusNode(siblings[targetIndex]);
      }
    }
  };

  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate(event => {
      const newScale = Math.max(0.3, Math.min(savedScale.value * event.scale, 4.0));
      scale.value = newScale;

      // Calculate the pivot point in the coordinate system of the content
      const focalX = event.focalX;
      const focalY = event.focalY;

      // The point in the content that is under the focal point
      const contentPivotX = (focalX - translateX.value) / scale.value;
      const contentPivotY = (focalY - translateY.value) / scale.value;

      // We want the content pivot point to stay under the focal point after scaling.
      // focal = newTranslate + contentPivot * newScale
      translateX.value = focalX - contentPivotX * newScale;
      translateY.value = focalY - contentPivotY * newScale;
    });

  const panAndSwipeGesture = Gesture.Pan()
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

  const composedGesture = Gesture.Simultaneous(pinchGesture, panAndSwipeGesture);

  // --- Button Actions ---
  const DURATION = 300; // This is for buttons, focusNode has its own.

  const fitToNetwork = () => {
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
    translateX.value = withTiming(0, { duration: DURATION });
    translateY.value = withTiming(0, { duration: DURATION });
  };

  const focusOnMe = () => {
    const meNode = findNodeById(myNodeId);
    if (meNode) {
      focusNode(meNode);
    }
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
    if (rootNode && myNodeId) {
      const meNode = findNodeById(myNodeId);
      if (meNode) focusNode(meNode);
    } else {
      // Reset state if data is cleared
      setFocusedNodeId(null);
    }
  }, [rootNode, myNodeId]);

  // --- Focus on Node ---
  const focusNode = (node?: HierarchyPointNode<D3TreeNode>) => {
    if (!node) return;

    // Only responsible for animating the view and setting focus state
    setFocusedNodeId(node.data.id);

    const targetScale = scale.value; // Keep current zoom level
    const contentX = node.x;
    const contentY = node.y;

    const targetTranslateX = screenWidth / 2 - contentX * targetScale;
    const targetTranslateY = screenHeight / 2 - contentY * targetScale;

    translateX.value = withTiming(targetTranslateX, { duration: DURATION });
    translateY.value = withTiming(targetTranslateY, { duration: DURATION });
  };

  // --- Node Tap Handler ---
  const handleNodeTap = (node: HierarchyPointNode<D3TreeNode>) => {
    // Focus the node if it's not already focused
    if (focusedNodeId !== node.data.id) {
      focusNode(node);
    }
    // Always trigger the press action on tap
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
        <TouchableOpacity style={styles.controlButton} onPress={fitToNetwork}>
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <Path fill="#fff" d="M3 11H1v10h10v-2H3v-8zm2-8h8V1H5v2zm16 0h-2v2h2v8h2V3a2 2 0 0 0-2-2zm-2 18h2v-8h-2v8zM13 5h-2v14h2V5z" />
          </Svg>
        </TouchableOpacity>
        {myNodeId !== null && (
          <TouchableOpacity style={styles.controlButton} onPress={focusOnMe}>
            <Svg width={24} height={24} viewBox="0 0 24 24">
              <Path fill="#fff" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-4.43-.82-6.14-2.88a9.947 9.947 0 0 1 12.28 0C16.43 19.18 14.03 20 12 20z" />
            </Svg>
          </TouchableOpacity>
        )}
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
                  stroke="#888"
                  strokeWidth={1.5}
                />
              ))}
              {nodes.map(node => (
                <TreeNodeView
                  key={node.data.id}
                  node={node}
                  onPress={() => handleNodeTap(node)}
                  isFocused={focusedNodeId === node.data.id}
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
  container: { flex: 1, backgroundColor: '#1e1e1e' },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e1e1e' },
  text: { color: '#fff' },
  controlsContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    zIndex: 10,
    flexDirection: 'column',
    gap: 12,
  },
  controlButton: {
    backgroundColor: 'rgba(40, 40, 40, 0.8)',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});
