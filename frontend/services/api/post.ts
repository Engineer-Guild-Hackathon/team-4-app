import { PostOut } from '@/types/post';
import { authedApiClient } from '@/utils/authedApiClient';

export const getPosts = async (topicId?: string, userId?: number): Promise<PostOut[]> => {
  const res = await authedApiClient(`/api/posts/?topic_id=${topicId}&author_id=${userId}`);
  return Array.isArray(res) ? res : [];
};

export const deletePost = async (postId: number): Promise<void> => {
  await authedApiClient(`/api/posts/${postId}/`, {
    method: 'DELETE',
  });
}