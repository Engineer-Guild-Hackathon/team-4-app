import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { TreeNode } from './treeUtils';

interface Props {
  node: TreeNode;
  onPress: (node: TreeNode) => void;
}

const NODE_RADIUS = 28; // Radius of the circle node

export const TreeNodeView: React.FC<Props> = ({ node, onPress }) => {
  return (
    <TouchableOpacity onPress={() => onPress(node)} style={styles.touchableWrapper}>
      <View style={styles.nodeWrapper}>
        <Image
          source={
            node.avatar
              ? { uri: node.avatar }
              : { uri: `https://placehold.co/64x64/e0e0e0/555555?text=${node.username.charAt(0)}` }
          }
          style={styles.avatar}
        />
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
  },
  avatar: {
    width: NODE_RADIUS * 2,
    height: NODE_RADIUS * 2,
    borderRadius: NODE_RADIUS,
    borderWidth: 2,
    borderColor: '#000000ff',
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
