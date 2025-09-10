import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { TreeNode } from "./treeUtils";

interface Props {
  node: TreeNode;
}

export const TreeNodeView: React.FC<Props> = ({ node }) => {
  return (
    <View style={styles.container}>
      <Text><Text style={styles.bold}>{node.username}</Text> (level: {node.level})</Text>
      {node.mentees.length > 0 && (
        <Text style={styles.mentees}>
          直属の弟子: {node.mentees.map(m => m.username).join(", ")}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 8,
        margin: 4,
    },
    bold: {
        fontWeight: 'bold',
    },
    mentees: {
        fontSize: 12,
        marginTop: 4,
    }
});
