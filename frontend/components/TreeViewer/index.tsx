import React, { useState, useEffect } from "react";
import { View, Button, Text, StyleSheet } from "react-native";
import { buildTree, TreeNode, UserNode } from "./treeUtils";
import { TreeNodeView } from "./TreeNode";
import { useTreeData } from "../../hooks/useTreeData";

export const TreeViewer: React.FC = () => {
  const { data, loading } = useTreeData(); // API fetch hook
  const [currentNode, setCurrentNode] = useState<TreeNode | null>(null);

  useEffect(() => {
    if (data && data.length > 0) {
      const root = buildTree(data as UserNode[]);
      // TODO: Set initial node to the logged-in user
      setCurrentNode(root);
    }
  }, [data]);

  if (loading || !currentNode) return <Text>Loading...</Text>;

  // 移動関数
  const goUp = () => currentNode.mentor && setCurrentNode(currentNode.mentor);
  const goDown = () => currentNode.mentees.length > 0 && setCurrentNode(currentNode.mentees[0]);
  const goLeft = () => {
    if (!currentNode.mentor) return;
    const siblings = currentNode.mentor.mentees;
    const idx = siblings.findIndex(s => s.id === currentNode.id);
    if (idx > 0) setCurrentNode(siblings[idx - 1]);
  };
  const goRight = () => {
    if (!currentNode.mentor) return;
    const siblings = currentNode.mentor.mentees;
    const idx = siblings.findIndex(s => s.id === currentNode.id);
    if (idx < siblings.length - 1) setCurrentNode(siblings[idx + 1]);
  };

  return (
    <View>
      <View style={styles.buttonContainer}>
        <Button title="↑ 上へ" onPress={goUp} />
        <Button title="↓ 下へ" onPress={goDown} />
        <Button title="← 左へ" onPress={goLeft} />
        <Button title="→ 右へ" onPress={goRight} />
      </View>
      <TreeNodeView node={currentNode} />
    </View>
  );
};

const styles = StyleSheet.create({
    buttonContainer: {
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-around',
    }
});
