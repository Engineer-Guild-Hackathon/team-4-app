import { TreeUserNodeOut } from '@/types/topic';

export interface UserNode {
  user: {
    id: number;
    username: string;
    avatar?: string;
  };
  rank: number;
  mentor_id?: number | null;
}

export interface TreeNode {
  id: number;
  username: string;
  avatar?: string;
  level: number;
  parent?: TreeNode; // d3-hierarchy が追加するが、mentor を parent として事前に設定可能
  children: TreeNode[];
}

export function buildTree(nodes: TreeUserNodeOut[]): TreeNode {
  const map = new Map<number, TreeNode>();

  // ★ 1. 仮想的なルートノードを作成
  // このノードは実際には表示しませんが、D3の計算の起点となります
  const virtualRoot: TreeNode = {
    id: -1, // 実際のユーザーIDと衝突しない負の値を設定
    username: 'virtualRoot',
    level: Infinity, // レベルを最も高く設定
    children: [],
  };

  // 既存のノードをMapに登録
  nodes.forEach(n =>
    map.set(n.user.id, {
      id: n.user.id,
      username: n.user.username,
      avatar: n.user.avatar,
      level: n.level,
      children: [],
    })
  );

  // メンター情報を元に親子関係を構築
  nodes.forEach(n => {
    const node = map.get(n.user.id)!;
    if (n.mentor_id != null && map.has(n.mentor_id)) {
      // 師匠がいる場合：師匠の子として追加
      const mentorNode = map.get(n.mentor_id)!;
      node.parent = mentorNode;
      mentorNode.children.push(node);
    } else {
      // ★ 2. 師匠がいない場合：仮想ルートの子として追加
      node.parent = virtualRoot;
      virtualRoot.children.push(node);
    }
  });

  return virtualRoot; // ★ 3. 仮想ルートを返す
}
