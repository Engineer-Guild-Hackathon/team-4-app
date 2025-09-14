import { UserEasyOut } from './user';

export type PostMediaOut = {
  media_type: string;
  file: string;
};

export type PostOut = {
  id: number;
  content: string;
  created_at: string;
  author: UserEasyOut;
  media: PostMediaOut[];
};
