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

export function buildTree(nodes: TreeUserNodeOut[]): TreeNode | null {
  const map = new Map<number, TreeNode>();
  let root: TreeNode | null = null;

  // ノードを Map に登録
  nodes.forEach(n =>
    map.set(n.user.id, { id: n.user.id, username: n.user.username, avatar: n.user.avatar, level: n.level, children: [] })

  // メンター情報を元にツリー構造を構築
  nodes.forEach(n => {
    const node = map.get(n.user.id)!;
    if (n.mentor_id != null) {
      const mentorNode = map.get(n.mentor_id)!;
      node.parent = mentorNode;
      mentorNode.children.push(node);
    } else {
      root = node; // ルートノードを設定
    }
  });

  return root;
}
