import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Button, Text, StyleSheet, ScrollView, PanResponder } from "react-native";
import { buildTree, TreeNode, UserNode } from "./treeUtils";
import { TreeNodeView } from "./TreeNode";
import { useTreeData } from "../../hooks/useTreeData";

const MAX_DISPLAY_NODES = 3; // 同列に表示する最大ノード数
const SWIPE_THRESHOLD = 50; // スワイプと認識する最小距離

export const TreeViewer: React.FC = () => {
  const { data, loading } = useTreeData(); // API fetch hook
  const [currentNode, setCurrentNode] = useState<TreeNode | null>(null);
  const [mentorNode, setMentorNode] = useState<TreeNode | null>(null);
  const [siblingNodes, setSiblingNodes] = useState<TreeNode[]>([]);
  const [menteeNodes, setMenteeNodes] = useState<TreeNode[]>([]);

  const currentNodeRef = useRef<TreeNode | null>(null);

  useEffect(() => {
    currentNodeRef.current = currentNode;
  }, [currentNode]);

  // 表示するノードを更新するヘルパー関数
  const updateDisplayNodes = useCallback((node: TreeNode) => {
    setMentorNode(node.mentor || null);

    // 同列のノード（自分自身を含む）
    let currentSiblings: TreeNode[] = [];
    if (node.mentor) {
      currentSiblings = [...node.mentor.mentees].sort((a, b) => a.id - b.id);
    } else {
      // ルートノードの場合、自分自身が同列の唯一のノード
      currentSiblings = [node];
    }

    // 注目ノードを中心に表示する同列ノードを決定
    const currentNodeIndex = currentSiblings.findIndex(s => s.id === node.id);

    // 注目ノードを中心に表示する同列ノードを決定
    let startIndex = Math.max(0, currentNodeIndex - Math.floor(MAX_DISPLAY_NODES / 2));
    let endIndex = Math.min(currentSiblings.length, startIndex + MAX_DISPLAY_NODES);

    // 右端に寄せる調整
    if (endIndex - startIndex < MAX_DISPLAY_NODES) {
      startIndex = Math.max(0, endIndex - MAX_DISPLAY_NODES);
    }

    setSiblingNodes(currentSiblings.slice(startIndex, endIndex));

    // 弟子ノード
    setMenteeNodes([...node.mentees].sort((a, b) => a.id - b.id).slice(0, MAX_DISPLAY_NODES));
  }, []);

  useEffect(() => {
    console.log("TreeViewer useEffect: data changed", data);
    if (data && data.length > 0) {
      const root = buildTree(data as UserNode[]);
      console.log("TreeViewer useEffect: built root", root);
      // TODO: Set initial node to the logged-in user
      setCurrentNode(root); // 初期ノードを設定
      if (root) {
        updateDisplayNodes(root);
      }
    }
  }, [data, updateDisplayNodes]);

  // currentNodeが変更されたら表示ノードを更新
  useEffect(() => {
    if (currentNode) {
      updateDisplayNodes(currentNode);
    }
  }, [currentNode, updateDisplayNodes]);

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
          goUp(); // 下にスワイp -> 上へ移動
        } else {
          goDown(); // 上にスワイプ -> 下へ移動
        }
      }
    },
  })).current;

  // 移動関数
  const goUp = () => {
    const current = currentNodeRef.current;
    console.log("goUp: currentNode", current);
    if (!current) return;
    if (current.mentor) {
      setCurrentNode(current.mentor);
    }
  };

  const goDown = () => {
    const current = currentNodeRef.current;
    console.log("goDown: currentNode", current);
    if (!current) return;
    if (current.mentees.length > 0) {
      setCurrentNode(current.mentees[0]); // MVPでは最初の弟子のみ
    }
  };

  const goLeft = () => {
    const current = currentNodeRef.current;
    console.log("goLeft: currentNode", current);
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
    console.log("goRight: currentNode", current);
    if (!current) return;
    if (!current.mentor) return; // 師匠がいない場合は移動不可
    const siblings = [...current.mentor.mentees].sort((a, b) => a.id - b.id);
    const idx = siblings.findIndex(s => s.id === current.id);
    if (idx < siblings.length - 1) {
      setCurrentNode(siblings[idx + 1]);
    }
  };

  if (loading || !currentNode) return <Text>Loading...</Text>;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View style={styles.buttonContainer}>
        <Button title="↑ 上へ" onPress={goUp} />
        <Button title="↓ 下へ" onPress={goDown} />
        <Button title="← 左へ" onPress={goLeft} />
        <Button title="→ 右へ" onPress={goRight} />
      </View>

      {/* 師匠ノード */} 
      <View style={styles.row}>
        {mentorNode ? (
          <TreeNodeView node={mentorNode} />
        ) : (
          <Text style={styles.emptyNode}>師匠はいません</Text>
        )}
      </View>

      {/* 同列ノード（自分自身を含む） */} 
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {siblingNodes.map(node => (
          <TreeNodeView key={node.id} node={node} />
        ))}
        {currentNode.mentor && currentNode.mentor.mentees.length > MAX_DISPLAY_NODES && (
          <Text style={styles.moreText}>...{currentNode.mentor.mentees.length - MAX_DISPLAY_NODES} more</Text>
        )}
      </ScrollView>

      {/* 弟子ノード */} 
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {menteeNodes.map(node => (
          <TreeNodeView key={node.id} node={node} />
        ))}
        {currentNode.mentees.length > MAX_DISPLAY_NODES && (
          <Text style={styles.moreText}>...{currentNode.mentees.length - MAX_DISPLAY_NODES} more</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonContainer: {
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    row: {
        flexDirection: 'row',
        marginVertical: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyNode: {
        padding: 8,
        margin: 4,
        color: '#888',
    },
    moreText: {
        padding: 8,
        margin: 4,
        color: '#888',
    }
});
