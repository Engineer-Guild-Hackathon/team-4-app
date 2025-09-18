import { TopicListOut, MyTopicListOut, TreeOut } from '@/types/topic';
import { authedApiClient } from '@/utils/authedApiClient';

// トピックに参加
export const joinTopic = async (topicId: string, level: number, mentorId?: number) => {
  return await authedApiClient(`/api/topics/${topicId}/me/`, {
    method: 'POST',
    body: { level, ...(mentorId && { mentor_id: mentorId }) },
  });
};

// 自分の参加トピック一覧を取得
export const getMyTopics = async (): Promise<MyTopicListOut> => {
  return await authedApiClient<MyTopicListOut>(`/api/topics/me/`);
};

// 全トピック一覧を取得
export const getAllTopics = async (): Promise<TopicListOut> => {
  return await authedApiClient<TopicListOut>(`/api/topics/`);
};

// トピックを作成
export const createTopic = async (title: string, description: string) => {
  return await authedApiClient(`/api/topics/`, {
    method: 'POST',
    body: { title, description },
  });
};

// トピックから退出
export const leaveTopic = async (topicId: string, userId: number) => {
  return await authedApiClient(`/api/topics/${topicId}/users/${userId}/`, {
    method: 'DELETE',
  });
};

// トピックのツリー構造を取得
export const getTopicTree = async (topicId: string) => {
  return await authedApiClient<TreeOut>(`/api/topics/${topicId}/tree/`);
};

// トピックのレベル情報を取得
export const getTopicLevelInfo = async (topicId: string) => {
  return await authedApiClient(`/api/topics/${topicId}/level-info/`);
};

// 弟子定員を更新
export const updateMenteeCapacity = async (topicId: string, menteeCapacity: number) => {
  return await authedApiClient(`/api/topics/${topicId}/me/mentee-capacity/`, {
    method: 'PATCH',
    body: { mentee_capacity: menteeCapacity },
  });
};
