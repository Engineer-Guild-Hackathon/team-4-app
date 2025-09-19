import { ThreadMessageOut, ThreadOut } from '@/types/thread';
import { authedApiClient } from '@/utils/authedApiClient';

export const getThreads = async (topicId?: string, mentorId?: number): Promise<ThreadOut[]> => {
  const res = await authedApiClient<ThreadOut[]>(
    `/api/threads?mentor_id=${mentorId}&topic_id=${topicId}`
  );
  return Array.isArray(res) ? res : [];
};

// 新規スレッド作成API
interface CreateThreadBody {
  topic_id: string;
  mentor_id: number;
  title: string; 
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

export const checkThreadPermission = async (
  mentorId: number, 
  topicId: string
): Promise<{ can_create: boolean }> => {
  return authedApiClient(`/api/threads/check-permission/?mentor_id=${mentorId}&topic_id=${topicId}`);
};