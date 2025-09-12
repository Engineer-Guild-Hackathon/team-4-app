import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { TreeNode } from './treeUtils';

interface Props {
  node: TreeNode;
  onPress: (node: TreeNode) => void;
}

const NODE_RADIUS = 20; // Radius of the circle node

export const TreeNodeView: React.FC<Props> = ({ node, onPress }) => {
  return (
    <TouchableOpacity onPress={() => onPress(node)} style={styles.touchableWrapper}>
      <View style={styles.nodeWrapper}>
        <Svg height={NODE_RADIUS * 2} width={NODE_RADIUS * 2}>
          <Circle
            cx={NODE_RADIUS}
            cy={NODE_RADIUS}
            r={NODE_RADIUS}
            stroke="#ccc"
            strokeWidth={1}
            fill="#fff"
          />
        </Svg>
        <Text style={styles.nodeLabel}>{String(node.username ?? '')}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchableWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    // Removed margin: 10, spacing will be handled by TreeViewer
  },
  nodeLabel: {
    position: 'absolute',
    top: NODE_RADIUS * 2 + 5,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    width: NODE_RADIUS * 4,
  },
});
