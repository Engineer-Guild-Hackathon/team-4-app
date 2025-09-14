import { PostOut } from '@/types/post';
import { authedApiClient } from '@/utils/authedApiClient';

export const getPosts = async (topicId?: string, userId?: number): Promise<PostOut[]> => {
  const res = await authedApiClient(`/api/posts/?topic_id=${topicId}&user_id=${userId}`);
  return Array.isArray(res) ? res : [];
};
