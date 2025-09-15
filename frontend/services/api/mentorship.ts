import { authedApiClient } from '@/utils/authedApiClient';

// 師匠選択が必要かどうかを判定
export const checkMentorSelectionRequired = async (topicId: string) => {
  try {
    const res = await authedApiClient(`/api/mentorship/mentor-selection/required/${topicId}`);
    return res;
  } catch (error: any) {
    console.error('師匠選択判定エラー:', error);
    // 404エラーの場合は、師匠選択が不要とみなす
    if (error.status === 404) {
      return { required: false, reason: 'UserTopic not found' };
    }
    throw error;
  }
};

// 師匠選択可能なユーザーリストを取得
export const getAvailableMentors = async (topicId: string) => {
  try {
    const res = await authedApiClient(`/api/mentorship/available-mentors/${topicId}`);
    return res;
  } catch (error: any) {
    console.error('師匠選択可能ユーザー取得エラー:', error);
    // 404エラーの場合は、空のリストを返す
    if (error.status === 404) {
      return [];
    }
    throw error;
  }
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

// ユーザーの現在レベルを取得
export const getUserLevel = async (topicId: string) => {
  try {
    const res = await authedApiClient(`/api/mentorship/user-level/${topicId}`);
    return res;
  } catch (error: any) {
    console.error('ユーザーレベル取得エラー:', error);
    // 404エラーの場合は、デフォルト値を返す
    if (error.status === 404) {
      return { level: 1, status: 'active' };
    }
    throw error;
  }
};

// 師匠選択リクエストの状態を取得
export const getMentorRequestStatus = async (topicId: string) => {
  try {
    const res = await authedApiClient(`/api/mentorship/mentor-request-status/${topicId}`);
    return res;
  } catch (error: any) {
    console.error('師匠選択リクエスト状態取得エラー:', error);
    // 404エラーの場合は、リクエストなしとみなす
    if (error.status === 404) {
      return { status: 'none', message: 'No mentor request found' };
    }
    throw error;
  }
};

// 受信した師匠選択リクエスト一覧を取得
export const getReceivedMentorRequests = async () => {
  try {
    const res = await authedApiClient(`/api/mentorship/received-requests`);
    return res;
  } catch (error: any) {
    console.error('受信リクエスト取得エラー:', error);
    throw error;
  }
};

// 師匠選択リクエストを承認
export const approveMentorRequest = async (requestId: number) => {
  try {
    const res = await authedApiClient(`/api/mentorship/requests/${requestId}/approve`, {
      method: 'POST',
    });
    return res;
  } catch (error: any) {
    console.error('リクエスト承認エラー:', error);
    throw error;
  }
};

// 師匠選択リクエストを拒否
export const rejectMentorRequest = async (requestId: number) => {
  try {
    const res = await authedApiClient(`/api/mentorship/requests/${requestId}/reject`, {
      method: 'POST',
    });
    return res;
  } catch (error: any) {
    console.error('リクエスト拒否エラー:', error);
    throw error;
  }
};
