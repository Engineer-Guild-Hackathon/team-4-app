import { TopicOut } from './topic';
import { UserOut } from './user';

export type ThreadOut = {
  id: number;
  topic: TopicOut;
  starter: UserOut;
  mentor: UserOut;
  created_at: string;
  messages: ThreadMessageOut[];
  title: string;
};

export type ThreadMessageOut = {
  id: number;
  author: UserOut;
  content: string;
  created_at: string;
  parent_id: number | null;
};
