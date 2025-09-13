import { UserEasyOut } from './user';

export type TopicOut = {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type TreeUserNodeOut = {
  user: UserEasyOut;
  level: number;
  mentor_id: number | null;
};

export type TreeOut = {
  tree: TreeUserNodeOut[];
  max_level: number;
  min_level: number;
};
