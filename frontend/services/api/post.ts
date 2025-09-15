import { PostOut } from '@/types/post';
import { authedApiClient } from '@/utils/authedApiClient';

export const getPosts = async (topicId?: string, userId?: number): Promise<PostOut[]> => {
  let url = `/api/posts/?topic_id=${topicId}`;
  if (userId !== undefined) {
    url += `&user_id=${userId}`;
  }
  const res = await authedApiClient(url);
  return Array.isArray(res) ? res : [];
};
