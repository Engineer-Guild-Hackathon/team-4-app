import { TopicListOut, TreeOut } from '@/types/topic';
import { UserWithTopicsOut } from '@/types/user';
import { authedApiClient } from '@/utils/authedApiClient';

export const joinTopic = async (topicId: string, level: number, mentorId?: number) => {
  const res = await authedApiClient(`/api/topics/${topicId}/me/`, {
    method: 'POST',
    body: { level, ...(mentorId && { mentor_id: mentorId }) },
  });
  return res;
};

export const getMyTopics = async (): Promise<UserWithTopicsOut> => {
  const res = await authedApiClient<UserWithTopicsOut>(`/api/topics/me/`);
  return res;
};

export const getAllTopics = async (): Promise<TopicListOut> => {
  const res = await authedApiClient<TopicListOut>(`/api/topics/`);
  return res;
};

export const createTopic = async (title: string, description: string) => {
  const res = await authedApiClient(`/api/topics/`, {
    method: 'POST',
    body: { title, description },
  });
  return res;
};

export const leaveTopic = async (topicId: string, userId: number) => {
  const res = await authedApiClient(`/api/topics/${topicId}/users/${userId}/`, {
    method: 'DELETE',
  });
  return res;
};

export const getTopicTree = async (topicId: string) => {
  const res = await authedApiClient<TreeOut>(`/api/topics/${topicId}/tree/`);
  return res;
};

export const getTopicLevelInfo = async (topicId: string) => {
  const res = await authedApiClient(`/api/topics/${topicId}/level-info/`);
  return res;
};
