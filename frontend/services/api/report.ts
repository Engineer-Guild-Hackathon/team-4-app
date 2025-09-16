import { authedApiClient } from '@/utils/authedApiClient';

export const reportPost = async (postId: number, reason: string): Promise<void> => {
  await authedApiClient(`/api/reports/posts/${postId}`, {
    method: 'POST',
    body: { reason },
  });
};
