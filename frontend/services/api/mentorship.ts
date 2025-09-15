import { authedApiClient } from '@/utils/authedApiClient';

// 師匠選択が必要かどうかを判定
export const checkMentorSelectionRequired = async (topicId: string) => {
  const res = await authedApiClient(`/api/mentorship/mentor-selection/required/${topicId}`);
  return res;
};

// 師匠選択可能なユーザーリストを取得
export const getAvailableMentors = async (topicId: string) => {
  const res = await authedApiClient(`/api/mentorship/available-mentors/${topicId}`);
  return res;
};

// 師匠選択完了
export const completeMentorSelection = async (topicId: string) => {
  const res = await authedApiClient(`/api/mentorship/mentor-selection/complete`, {
    method: 'POST',
    body: { topic_id: topicId },
  });
  return res;
};

// 師匠選択リクエスト作成
export const createMentorRequest = async (toUserId: number, topicId: string) => {
  const res = await authedApiClient(`/api/mentorship/request`, {
    method: 'POST',
    body: { to_user_id: toUserId, topic_id: topicId },
  });
  return res;
};
