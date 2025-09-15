import { TreeUserNodeOut } from '@/types/topic';

// components/TreeViewer/treeUtils.ts
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
  mentor?: TreeNode;
  mentees: TreeNode[];
}

export function buildTree(nodes: TreeUserNodeOut[]): TreeNode | null {
  const map = new Map<number, TreeNode>();
  let root: TreeNode | null = null;

  nodes.forEach(n =>
    map.set(n.user.id, { id: n.user.id, username: n.user.username, avatar: n.user.avatar, level: n.level, mentees: [] })
  );

  nodes.forEach(n => {
    const node = map.get(n.user.id)!;
    if (n.mentor_id != null) {
      const mentorNode = map.get(n.mentor_id)!;
      node.mentor = mentorNode;
      mentorNode.mentees.push(node);
    } else {
      root = node;
    }
  });

  return root;
}
