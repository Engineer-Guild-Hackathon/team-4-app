import { TopicOut } from './topic';

export type UserOut = {
  id: number;
  username: string;
  is_active: boolean;
  is_staff: boolean;
  avatar: string | null;
  bio: string | null;
};

export type UserDetailOut = UserOut & {
  blocking: boolean;
  blocked: boolean;
};

export type UserEasyOut = {
  id: number;
  username: string;
  avatar?: string;
};

export type UserCreateOut = {
  access: string;
  refresh: string;
  user: UserOut;
};

export type UserWithTopicsOut = UserOut & {
  topics: TopicOut[];
};
