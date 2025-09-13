import { TopicOut } from './topic';

export type UserOut = {
  id: number;
  username: string;
  is_active: boolean;
  is_staff: boolean;
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
