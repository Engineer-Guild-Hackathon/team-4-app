import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, PanResponder, Animated } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { buildTree, TreeNode, UserNode } from './treeUtils';
import { TreeNodeView } from './TreeNode';
import { useTreeData } from '../../hooks/useTreeData';

const AnimatedLine = Animated.createAnimatedComponent(Line);

interface AnimatedLineData {
  key: string;
  x1: Animated.Value;
  y1: Animated.Value;
  x2: Animated.Value;
  y2: Animated.Value;
  stroke: string;
}

const NODE_RADIUS = 20;
const NODE_WIDTH = NODE_RADIUS * 2;
const NODE_HEIGHT = NODE_RADIUS * 2 + 20;
const VERTICAL_SPACING = 200;
const HORIZONTAL_SPACING = 80;
const SWIPE_THRESHOLD = 50;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Safely returns a number from an Animated.Value or a plain number, with a guaranteed fallback.
 * This is the most robust way to prevent crashes from `__getValue` on unexpected object types.
 */
const safeNumber = (val: Animated.Value | number | undefined | null, fallback: number): number => {
  // If it's already a number, we're good.
  if (typeof val === 'number') {
    return val;
  }
  // If it's an animatable object, try to get the value with multiple layers of safety.
  if (val && typeof (val as any).__getValue === 'function') {
    try {
      const v = (val as any).__getValue();
      return typeof v === 'number' ? v : fallback;
    } catch {
      return fallback; // Catch any error during __getValue call.
    }
  }
  // For anything else (null, undefined, other objects), return the fallback.
  return fallback;
};

interface TreeViewerProps {
  topicId: string | null; // 表示するトピックのID
  onNodePress: (userId: number) => void;
}

export const TreeViewer: React.FC<TreeViewerProps> = ({ topicId, onNodePress }) => {
  const { data, loading } = useTreeData(topicId);
  const [currentNode, setCurrentNode] = useState<TreeNode | null>(null);
  const [nodesWithPositions, setNodesWithPositions] = useState<
    Map<number, { node: TreeNode; x: Animated.Value; y: Animated.Value }>
  >(new Map());
  const [lines, setLines] = useState<AnimatedLineData[]>([]);
  const [hasMoreMentees, setHasMoreMentees] = useState(false);
  const [hasMoreSiblingsLeft, setHasMoreSiblingsLeft] = useState(false);
  const [hasMoreSiblingsRight, setHasMoreSiblingsRight] = useState(false);
  const [displayedMenteesNodes, setDisplayedMenteesNodes] = useState<TreeNode[]>([]);
  const [displayedSiblingsNodes, setDisplayedSiblingsNodes] = useState<(TreeNode | null)[]>([]);
  const [hiddenSiblingsLeftCount, setHiddenSiblingsLeftCount] = useState(0);
  const [hiddenSiblingsRightCount, setHiddenSiblingsRightCount] = useState(0);

  const currentNodeRef = useRef<TreeNode | null>(null);
  const targetNodePositionsRef = useRef<Map<number, { node: TreeNode; x: number; y: number }>>(
    new Map()
  );

  // -----------------------
  // Node Count Overlay Helper
  // -----------------------
  type NodeCountOverlayProps = {
    node?: TreeNode | null;
    offsetX?: number;
    offsetY?: number;
    text: string;
  };

  const NodeCountOverlay: React.FC<NodeCountOverlayProps> = ({
    node,
    offsetX = 0,
    offsetY = 0,
    text,
  }) => {
    if (!node) return null;

    // Get the animated position values from the state
    const animatedPosition = nodesWithPositions.get(node.id);

    // If the node isn't being displayed/animated, don't render the overlay
    if (!animatedPosition) return null;

    const { x, y } = animatedPosition;

    return (
      <Animated.View
        style={{
          position: 'absolute',
          left: 0, // Position is handled by transform for animation
          top: 0,
          // Apply the animated X and Y translations
          transform: [{ translateX: x }, { translateY: y }],
        }}
      >
        {/* Apply the static offset to a non-animated child View */}
        <View style={{ transform: [{ translateX: offsetX }, { translateY: offsetY }] }}>
          <Text>{text}</Text>
        </View>
      </Animated.View>
    );
  };

  // -----------------------
  // Effects
  // -----------------------
  useEffect(() => {
    currentNodeRef.current = currentNode;
  }, [currentNode]);

  useEffect(() => {
    if (Array.isArray(data) && data.length > 0) {
      const root = buildTree(data as UserNode[]);
      setCurrentNode(root);
    }
  }, [data]);

  useEffect(() => {
    if (!currentNode) return;

    const targetNodePositions = new Map<number, { node: TreeNode; x: number; y: number }>();
    const targetLines = new Map<
      string,
      { x1: number; y1: number; x2: number; y2: number; stroke: string }
    >();

    const currentX = screenWidth / 2 - NODE_RADIUS;
    const currentY = screenHeight / 2 - NODE_RADIUS;
    targetNodePositions.set(currentNode.id, { node: currentNode, x: currentX, y: currentY });

    // Mentor
    if (currentNode.mentor) {
      targetNodePositions.set(currentNode.mentor.id, {
        node: currentNode.mentor,
        x: currentX,
        y: currentY - VERTICAL_SPACING,
      });
    }

    // Mentees
    if (currentNode.mentees.length > 0) {
      const displayedMentees = currentNode.mentees.slice(0, 3);
      const totalMenteesWidth =
        displayedMentees.length * NODE_WIDTH + (displayedMentees.length - 1) * HORIZONTAL_SPACING;
      let startX = screenWidth / 2 - totalMenteesWidth / 2;
      displayedMentees.forEach((mentee, idx) => {
        const menteeX = startX + idx * (NODE_WIDTH + HORIZONTAL_SPACING);
        const menteeY = currentY + VERTICAL_SPACING;
        targetNodePositions.set(mentee.id, { node: mentee, x: menteeX, y: menteeY });
      });
      setHasMoreMentees(currentNode.mentees.length > 3);
      setDisplayedMenteesNodes(displayedMentees);
    } else {
      setHasMoreMentees(false);
    }

    // Siblings
    if (currentNode.mentor) {
      const allSiblings = [...currentNode.mentor.mentees].sort((a, b) => a.id - b.id);
      const currentIdx = allSiblings.findIndex(s => s.id === currentNode.id);
      let displayedSiblings: (TreeNode | null)[] = new Array(3).fill(null);

      displayedSiblings[1] = currentNode;
      if (currentIdx > 0) {
        displayedSiblings[0] = allSiblings[currentIdx - 1];
      }
      if (currentIdx < allSiblings.length - 1) {
        displayedSiblings[2] = allSiblings[currentIdx + 1];
      }

      displayedSiblings.forEach((sibling, idx) => {
        // Only calculate position for non-null siblings that are not the current node
        if (sibling && sibling.id !== currentNode.id) {
          let siblingX = screenWidth / 2 - NODE_RADIUS;
          if (idx === 0) siblingX -= NODE_WIDTH + HORIZONTAL_SPACING;
          if (idx === 2) siblingX += NODE_WIDTH + HORIZONTAL_SPACING;
          // The current node's position is already set, so we only set siblings
          targetNodePositions.set(sibling.id, { node: sibling, x: siblingX, y: currentY });
        }
      });

      setHasMoreSiblingsLeft(currentIdx > 0);
      setHasMoreSiblingsRight(currentIdx < allSiblings.length - 1);

      const leftmost = displayedSiblings[0]
        ? allSiblings.findIndex(s => s.id === displayedSiblings[0]?.id)
        : currentIdx;
      const rightmost = displayedSiblings[2]
        ? allSiblings.findIndex(s => s.id === displayedSiblings[2]?.id)
        : currentIdx;
      setHiddenSiblingsLeftCount(leftmost);
      setHiddenSiblingsRightCount(allSiblings.length - 1 - rightmost);

      setDisplayedSiblingsNodes(displayedSiblings);
    } else {
      setHasMoreSiblingsLeft(false);
      setHasMoreSiblingsRight(false);
      setHiddenSiblingsLeftCount(0);
      setHiddenSiblingsRightCount(0);
    }

    // Lines
    targetNodePositions.forEach(sourceNodeData => {
      const sourceNode = sourceNodeData?.node;
      const mentorNode = sourceNode?.mentor;

      // Defensively check that both the source and its mentor exist.
      if (!sourceNode || !mentorNode) return;

      // Ensure the mentor node is also being displayed before trying to draw a line to it.
      const mentorNodeData = targetNodePositions.get(mentorNode.id);
      if (!mentorNodeData) return;

      const isDirectConnection =
        (sourceNode.id === currentNode?.id && mentorNode.id === currentNode?.mentor?.id) ||
        mentorNode.id === currentNode?.id;

      const lineKey = `${mentorNodeData.node.id}-${sourceNode.id}`;
      targetLines.set(lineKey, {
        x1: mentorNodeData.x + NODE_RADIUS,
        y1: mentorNodeData.y + NODE_RADIUS * 2,
        x2: sourceNodeData.x + NODE_RADIUS,
        y2: sourceNodeData.y,
        stroke: isDirectConnection ? 'grey' : 'lightgrey',
      });
    });

    // Animation
    const newAnimatedNodes = new Map<
      number,
      { node: TreeNode; x: Animated.Value; y: Animated.Value }
    >();
    const animations: Animated.CompositeAnimation[] = [];

    targetNodePositions.forEach((targetPos, id) => {
      const existingNode = nodesWithPositions.get(id);
      if (existingNode) {
        newAnimatedNodes.set(id, existingNode);
        animations.push(
          Animated.spring(existingNode.x, {
            toValue: targetPos.x,
            useNativeDriver: false,
            tension: 20,
            friction: 10,
          }),
          Animated.spring(existingNode.y, {
            toValue: targetPos.y,
            useNativeDriver: false,
            tension: 20,
            friction: 10,
          })
        );
      } else {
        // Node is new. Find a safe, logical start position for the animation.
        const newNode = targetPos.node;
        const mentorPrev = newNode.mentor ? nodesWithPositions.get(newNode.mentor.id) : undefined;
        const menteePrev =
          newNode.mentees.length > 0 ? nodesWithPositions.get(newNode.mentees[0].id) : undefined;

        // Use safeNumber to guarantee a valid number for the animation's starting point.
        const startX = safeNumber(
          mentorPrev?.x,
          safeNumber(menteePrev?.x, targetPos.x ?? screenWidth / 2 - NODE_RADIUS)
        );
        const startY = safeNumber(
          mentorPrev?.y,
          safeNumber(menteePrev?.y, targetPos.y ?? screenHeight / 2 - NODE_RADIUS)
        );

        const animatedNode = {
          node: targetPos.node,
          x: new Animated.Value(startX),
          y: new Animated.Value(startY),
        };
        newAnimatedNodes.set(id, animatedNode);

        animations.push(
          Animated.spring(animatedNode.x, {
            toValue: targetPos.x,
            useNativeDriver: false,
            tension: 20,
            friction: 10,
          }),
          Animated.spring(animatedNode.y, {
            toValue: targetPos.y,
            useNativeDriver: false,
            tension: 20,
            friction: 10,
          })
        );
      }
    });

    // Animate Lines
    const newAnimatedLines: AnimatedLineData[] = [];
    const currentLinesMap = new Map(lines.map(l => [l.key, l]));

    targetLines.forEach((targetLine, key) => {
      const existingLine = currentLinesMap.get(key);
      if (existingLine) {
        // Line exists, animate it to the new position
        // BUG FIX: Update the stroke color. The color might change even if the line itself
        // is not new (e.g., from direct connection to indirect).
        existingLine.stroke = targetLine.stroke;
        newAnimatedLines.push(existingLine);
        animations.push(
          Animated.spring(existingLine.x1, {
            toValue: targetLine.x1,
            useNativeDriver: false,
            tension: 20,
            friction: 10,
          }),
          Animated.spring(existingLine.y1, {
            toValue: targetLine.y1,
            useNativeDriver: false,
            tension: 20,
            friction: 10,
          }),
          Animated.spring(existingLine.x2, {
            toValue: targetLine.x2,
            useNativeDriver: false,
            tension: 20,
            friction: 10,
          }),
          Animated.spring(existingLine.y2, {
            toValue: targetLine.y2,
            useNativeDriver: false,
            tension: 20,
            friction: 10,
          })
        );
      } else {
        // New line, animate it "growing" from the mentor node.
        const [mentorIdStr] = key.split('-');
        const mentorId = parseInt(mentorIdStr, 10);
        const mentorPrev = nodesWithPositions.get(mentorId);

        // Use safeNumber to guarantee a valid starting coordinate for the new line.
        const startX = safeNumber(mentorPrev?.x, targetLine.x1 - NODE_RADIUS) + NODE_RADIUS;
        const startY = safeNumber(mentorPrev?.y, targetLine.y1 - NODE_RADIUS * 2) + NODE_RADIUS * 2;

        const animatedLine = {
          key,
          x1: new Animated.Value(startX), // The line starts from the mentor's center-bottom
          y1: new Animated.Value(startY), // The line starts from the mentor's center-bottom
          x2: new Animated.Value(startX), // Start at the same point
          y2: new Animated.Value(startY), // Start at the same point
          stroke: targetLine.stroke,
        };
        newAnimatedLines.push(animatedLine);

        // Animate the line to its final position. We animate all 4 coords
        // because the mentor node itself might be moving.
        animations.push(
          Animated.spring(animatedLine.x1, {
            toValue: targetLine.x1,
            useNativeDriver: false,
            tension: 20,
            friction: 10,
          }),
          Animated.spring(animatedLine.y1, {
            toValue: targetLine.y1,
            useNativeDriver: false,
            tension: 20,
            friction: 10,
          }),
          Animated.spring(animatedLine.x2, {
            toValue: targetLine.x2,
            useNativeDriver: false,
            tension: 20,
            friction: 10,
          }),
          Animated.spring(animatedLine.y2, {
            toValue: targetLine.y2,
            useNativeDriver: false,
            tension: 20,
            friction: 10,
          })
        );
      }
    });

    setLines(newAnimatedLines);
    setNodesWithPositions(newAnimatedNodes);
    targetNodePositionsRef.current = targetNodePositions;

    Animated.parallel(animations).start();
  }, [currentNode]);

  // -----------------------
  // PanResponder & Navigation
  // -----------------------
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gestureState) => {
        const { dx, dy } = gestureState;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD)
          dx > 0 ? goLeft() : goRight();
        else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > SWIPE_THRESHOLD)
          dy > 0 ? goUp() : goDown();
      },
    })
  ).current;

  const goUp = () =>
    currentNodeRef.current?.mentor && setCurrentNode(currentNodeRef.current.mentor);
  const goDown = () =>
    currentNodeRef.current?.mentees.length && setCurrentNode(currentNodeRef.current.mentees[0]);
  const goLeft = () => {
    const current = currentNodeRef.current;
    if (!current?.mentor) return;
    const siblings = [...current.mentor.mentees].sort((a, b) => a.id - b.id);
    const idx = siblings.findIndex(s => s.id === current.id);
    if (idx > 0) setCurrentNode(siblings[idx - 1]);
  };
  const goRight = () => {
    const current = currentNodeRef.current;
    if (!current?.mentor) return;
    const siblings = [...current.mentor.mentees].sort((a, b) => a.id - b.id);
    const idx = siblings.findIndex(s => s.id === current.id);
    if (idx < siblings.length - 1) setCurrentNode(siblings[idx + 1]);
  };

  // -----------------------
  // Render
  // -----------------------
  if (loading) return <Text>Loading...</Text>;
  if (!data || data.length === 0) return <Text>No data to display.</Text>;
  if (!currentNode) return <Text>Processing data...</Text>;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
        {lines.map(line => (
          <AnimatedLine
            key={line.key}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={line.stroke}
            strokeWidth={2}
          />
        ))}
      </Svg>

      {Array.from(nodesWithPositions.values()).map(({ node, x, y }) => (
        <Animated.View
          key={String(node.id)}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            transform: [{ translateX: x }, { translateY: y }],
          }}
        >
          <TreeNodeView node={node} onPress={(n) => onNodePress(n.id)} />
        </Animated.View>
      ))}

      {/* Reusable Node Count Overlays */}
      {hasMoreMentees && (
        <NodeCountOverlay
          node={displayedMenteesNodes[displayedMenteesNodes.length - 1]}
          offsetX={NODE_WIDTH - 10}
          offsetY={-20}
          text={`+${currentNode.mentees.length - displayedMenteesNodes.length}人`}
        />
      )}
      {hiddenSiblingsLeftCount > 0 && (
        <NodeCountOverlay
          node={displayedSiblingsNodes[0]}
          offsetX={-10}
          offsetY={-20}
          text={`+${hiddenSiblingsLeftCount}人`}
        />
      )}
      {hiddenSiblingsRightCount > 0 && (
        <NodeCountOverlay
          node={displayedSiblingsNodes[2]}
          offsetX={NODE_WIDTH - 10}
          offsetY={-20}
          text={`+${hiddenSiblingsRightCount}人`}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
