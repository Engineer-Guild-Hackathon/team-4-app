import { ThreadMessageOut, ThreadOut } from '@/types/thread';
import { authedApiClient } from '@/utils/authedApiClient';

export const getThreads = async (topicId?: string, userId?: number): Promise<ThreadOut[]> => {
  const res = await authedApiClient<ThreadOut[]>(
    `/api/threads?user_id=${userId}&topic_id=${topicId}`
  );
  return Array.isArray(res) ? res : [];
};

// 新規スレッド作成API
interface CreateThreadBody {
  topic_id: string;
  mentor_id: number;
  message: { content: string };
}

export const createThread = async (body: CreateThreadBody): Promise<ThreadOut> => {
  return await authedApiClient('/api/threads', {
    method: 'POST',
    body,
  });
};

export const sendMessageToThread = async (
  threadId: number,
  content: string
): Promise<ThreadMessageOut> => {
  const res = await authedApiClient<ThreadMessageOut>(`/api/threads/${threadId}/messages`, {
    method: 'POST',
    body: { content },
  });
  return res;
};
