import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, StyleSheet, Dimensions, PanResponder } from "react-native"; // Added PanResponder
import Svg, { Line } from "react-native-svg";
import { buildTree, TreeNode, UserNode } from "./treeUtils";
import { TreeNodeView } from "./TreeNode";
import { useTreeData } from "../../hooks/useTreeData";

const NODE_RADIUS = 20;
const NODE_WIDTH = NODE_RADIUS * 2;
const NODE_HEIGHT = NODE_RADIUS * 2 + 20;
const VERTICAL_SPACING = 100;
const HORIZONTAL_SPACING = 80;
const SWIPE_THRESHOLD = 50; // Re-added this constant

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const TreeViewer: React.FC = () => {
  const { data, loading } = useTreeData();
  const [currentNode, setCurrentNode] = useState<TreeNode | null>(null);
  const [nodesWithPositions, setNodesWithPositions] = useState<Map<number, { node: TreeNode, x: number, y: number }>>(new Map());
  const [lines, setLines] = useState<Array<{ x1: number, y1: number, x2: number, y2: number }>>([]);

  const currentNodeRef = useRef<TreeNode | null>(null);

  useEffect(() => {
    currentNodeRef.current = currentNode;
  }, [currentNode]);

  useEffect(() => {
    if (Array.isArray(data) && data.length > 0) {
      const root = buildTree(data as UserNode[]);
      setCurrentNode(root); // Set initial node to the root
    }
  }, [data]);

  // Effect to calculate positions and lines when currentNode changes
  useEffect(() => {
    if (!currentNode) return;

    const newNodesWithPositions = new Map<number, { node: TreeNode, x: number, y: number }>();
    const newLines: Array<{ x1: number, y1: number, x2: number, y2: number }> = [];

    // --- Layout Calculation ---
    // This is a simplified layout for current node, mentor, and direct mentees/siblings
    // More complex tree layout algorithms would be needed for a full tree.

    // Current Node (center)
    const currentX = screenWidth / 2 - NODE_RADIUS;
    const currentY = screenHeight / 2 - NODE_RADIUS;
    newNodesWithPositions.set(currentNode.id, { node: currentNode, x: currentX, y: currentY });

    // Mentor Node (above current)
    if (currentNode.mentor) {
      const mentorX = screenWidth / 2 - NODE_RADIUS;
      const mentorY = currentY - VERTICAL_SPACING;
      newNodesWithPositions.set(currentNode.mentor.id, { node: currentNode.mentor, x: mentorX, y: mentorY });
      newLines.push({
        x1: mentorX + NODE_RADIUS,
        y1: mentorY + NODE_RADIUS * 2,
        x2: currentX + NODE_RADIUS,
        y2: currentY
      });
    }

    // Mentees (below current, spread horizontally)
    if (currentNode.mentees.length > 0) {
      const totalMenteesWidth = currentNode.mentees.length * NODE_WIDTH + (currentNode.mentees.length - 1) * HORIZONTAL_SPACING;
      let startX = screenWidth / 2 - totalMenteesWidth / 2;
      currentNode.mentees.forEach((mentee, index) => {
        const menteeX = startX + index * (NODE_WIDTH + HORIZONTAL_SPACING);
        const menteeY = currentY + VERTICAL_SPACING;
        newNodesWithPositions.set(mentee.id, { node: mentee, x: menteeX, y: menteeY });
        newLines.push({
          x1: currentX + NODE_RADIUS,
          y1: currentY + NODE_RADIUS * 2,
          x2: menteeX + NODE_RADIUS,
          y2: menteeY
        });
      });
    }

    // Siblings (same level as current, spread horizontally)
    if (currentNode.mentor) {
      const siblings = [...currentNode.mentor.mentees].sort((a, b) => a.id - b.id);
      const totalSiblingsWidth = siblings.length * NODE_WIDTH + (siblings.length - 1) * HORIZONTAL_SPACING;
      let startX = screenWidth / 2 - totalSiblingsWidth / 2;
      siblings.forEach((sibling, index) => {
        if (sibling.id !== currentNode.id) { // Don't re-add current node
          const siblingX = startX + index * (NODE_WIDTH + HORIZONTAL_SPACING);
          const siblingY = currentY; // Same level as current
          newNodesWithPositions.set(sibling.id, { node: sibling, x: siblingX, y: siblingY });
          // No lines between siblings in this basic layout
        }
      });
    }

    setNodesWithPositions(newNodesWithPositions);
    setLines(newLines);

  }, [currentNode]); // Recalculate when currentNode changes

  // PanResponderのセットアップ
  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderRelease: (evt, gestureState) => {
      const { dx, dy } = gestureState;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
        // 横方向スワイプ
        if (dx > 0) {
          goLeft(); // 右にスワイプ -> 左へ移動
        } else {
          goRight(); // 左にスワイプ -> 右へ移動
        }
      } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > SWIPE_THRESHOLD) {
        // 縦方向スワイプ
        if (dy > 0) {
          goUp(); // 下にスワイプ -> 上へ移動
        } else {
          goDown(); // 上にスワイプ -> 下へ移動
        }
      }
    },
  })).current;

  // 移動関数
  const goUp = () => {
    const current = currentNodeRef.current;
    if (!current) return;
    if (current.mentor) {
      setCurrentNode(current.mentor);
    }
  };

  const goDown = () => {
    const current = currentNodeRef.current;
    if (!current) return;
    if (current.mentees.length > 0) {
      setCurrentNode(current.mentees[0]); // MVPでは最初の弟子のみ
    }
  };

  const goLeft = () => {
    const current = currentNodeRef.current;
    if (!current) return;
    if (!current.mentor) return; // 師匠がいない場合は移動不可
    const siblings = [...current.mentor.mentees].sort((a, b) => a.id - b.id);
    const idx = siblings.findIndex(s => s.id === current.id);
    if (idx > 0) {
      setCurrentNode(siblings[idx - 1]);
    }
  };

  const goRight = () => {
    const current = currentNodeRef.current;
    if (!current) return;
    if (!current.mentor) return; // 師匠がいない場合は移動不可
    const siblings = [...current.mentor.mentees].sort((a, b) => a.id - b.id);
    const idx = siblings.findIndex(s => s.id === current.id);
    if (idx < siblings.length - 1) {
      setCurrentNode(siblings[idx + 1]);
    }
  };

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (!data || data.length === 0) {
    return <Text>No data to display.</Text>;
  }

  if (!currentNode) {
      return <Text>Processing data...</Text>;
  }

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Svg height="100%" width="100%">
        {lines.map((line, index) => (
          <Line
            key={String(index)} // ensure string key
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="grey"
            strokeWidth={2} // number, not string
          />
        ))}
      </Svg>

      {Array.from(nodesWithPositions.values()).map(({ node, x, y }) => (
        <View
          key={String(node.id)} // ensure string key
          style={{ position: "absolute", left: x, top: y }}
        >
          <TreeNodeView node={node} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
});