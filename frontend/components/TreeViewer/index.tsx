import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, StyleSheet, Text, View, Platform } from 'react-native';
import {
  GestureHandlerRootView,
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedProps,
} from 'react-native-reanimated';
import Svg, { G, Line } from 'react-native-svg';
import { hierarchy, tree, HierarchyPointNode } from 'd3-hierarchy';

import { useTreeData } from '../../hooks/useTreeData';
import { TreeNodeView } from './TreeNode';
import { buildTree, TreeNode as D3TreeNode } from './treeUtils';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AnimatedG = Animated.createAnimatedComponent(G);

interface TreeViewerProps {
  topicId: string | null;
  onNodePress: (userId: number) => void;
}

export const TreeViewer: React.FC<TreeViewerProps> = ({ topicId, onNodePress }) => {
  const { data, loading } = useTreeData(topicId);
  const [focusedNodeId, setFocusedNodeId] = useState<number | null>(null);

  // --- D3 Layout ---
  const rootNode = useMemo(() => {
    if (!data || data.length === 0) return null;
    const hierarchyData = buildTree(data);
    if (!hierarchyData) return null;

    const treeLayout = tree<D3TreeNode>().nodeSize([120, 150]); // [width, height] spacing
    const root = treeLayout(hierarchy(hierarchyData));

    // --- Fit and Center Tree on Screen ---
    // This logic modifies the node coordinates directly so the tree appears
    // correctly positioned and scaled on the initial render.
    const nodes = root.descendants();
    if (nodes.length > 0) {
      const xCoords = nodes.map(n => n.x);
      const yCoords = nodes.map(n => n.y);
      const minX = Math.min(...xCoords);
      const maxX = Math.max(...xCoords);
      const maxY = Math.max(...yCoords); // minY is 0 for d3.tree()

      const PADDING = 80;
      const treeWidth = maxX - minX;
      const treeHeight = maxY;

      const scaleX = (screenWidth - PADDING * 2) / treeWidth;
      const scaleY = (screenHeight - PADDING * 2) / treeHeight;
      const newScale = Math.min(scaleX, scaleY, 1.0); // Cap max initial zoom at 1.0

      // Apply the calculated scale and translation to each node.
      // This centers the tree in the available space.
      nodes.forEach(node => {
        // Center the tree's internal coordinates around (0,0)
        const centeredX = node.x - (minX + treeWidth / 2);
        const centeredY = node.y - treeHeight / 2;
        // Scale the centered coordinates
        const scaledX = centeredX * newScale;
        const scaledY = centeredY * newScale;
        // Translate to the center of the screen
        node.x = scaledX + screenWidth / 2;
        node.y = scaledY + screenHeight / 2;
      });
    }

    return root;
  }, [data]);

  // --- Pan & Zoom Animation State (react-native-reanimated) ---
  const scale = useSharedValue(1); // Start with a scale of 1
  const translateX = useSharedValue(0); // and no translation
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // --- Gesture Handlers ---
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate(event => {
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    });

  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      savedScale.value = scale.value;
    })
    .onUpdate(event => {
      scale.value = savedScale.value * event.scale;
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);
  // --- Animated Props for SVG G element ---
  const animatedProps = useAnimatedProps(() => {
    // SVG transform attribute is a string, not a style object
    return { transform: `translate(${translateX.value}, ${translateY.value}) scale(${scale.value})` };
  });

  // --- Focus on Node ---
  const focusNode = (node: HierarchyPointNode<D3TreeNode>) => {
    setFocusedNodeId(node.data.id);
    const DURATION = 500;
    const newScale = 1.2;

    // Center the node on the screen
    // The transform needs to be the inverse of the node's position, scaled,
    // and then translated to the screen center.
    translateX.value = withTiming(-node.x * newScale + screenWidth / 2, { duration: DURATION });
    translateY.value = withTiming(-node.y * newScale + screenHeight / 3, { duration: DURATION });

    // Zoom in on the node
    scale.value = withTiming(newScale, { duration: DURATION });

    // Also trigger the external onNodePress handler
    onNodePress(node.data.id);
  };

  // --- Render Logic ---
  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }
  if (!rootNode) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>No data to display.</Text>
      </View>
    );
  }

  const nodes = rootNode.descendants();
  const links = rootNode.links();

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={styles.flex}>
          <Svg width={screenWidth} height={screenHeight}>
            <AnimatedG animatedProps={animatedProps}>
              {/* Draw Links (Edges) */}
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

              {/* Draw Nodes */}
              {nodes.map(node => (
                <TreeNodeView
                  key={node.data.id}
                  node={node}
                  onPress={() => focusNode(node)}
                  isFocused={node.data.id === focusedNodeId}
                />
              ))}
            </AnimatedG>
          </Svg>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e', // Dark theme background
  },
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
  },
});
