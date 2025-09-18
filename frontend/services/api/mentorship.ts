import { authedApiClient } from '@/utils/authedApiClient';

// 師匠選択が必要かどうかを判定
export const checkMentorSelectionRequired = async (topicId: string) => {
  try {
    return await authedApiClient(`/api/mentorship/mentor-selection/required/${topicId}`);
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
    return await authedApiClient(`/api/mentorship/available-mentors/${topicId}`);
  } catch (error: any) {
    console.error('師匠選択可能ユーザー取得エラー:', error);
    // 404エラーの場合は、空のリストを返す
    if (error.status === 404) {
      return [];
    }
    throw error;
  }
};

// 師匠選択リクエスト作成
export const createMentorRequest = async (toUserId: number, topicId: string) => {
  return await authedApiClient(`/api/mentorship/request`, {
    method: 'POST',
    body: { to_user_id: toUserId, topic_id: topicId },
  });
};

// ユーザーの現在レベルを取得
export const getUserLevel = async (topicId: string) => {
  try {
    return await authedApiClient(`/api/mentorship/user-level/${topicId}`);
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
export const getMentorRequestStatus = async (userId: number, topicId: string) => {
  try {
    return await authedApiClient(`/api/mentorship/mentor-request-status/${userId}/${topicId}`);
  } catch (error: any) {
  
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
    return await authedApiClient(`/api/mentorship/received-requests`);
  } catch (error: any) {
    console.error('受信リクエスト取得エラー:', error);
    throw error;
  }
};

// 師匠選択リクエストを承認
export const approveMentorRequest = async (requestId: number) => {
  try {
    return await authedApiClient(`/api/mentorship/requests/${requestId}/approve`, {
      method: 'POST',
    });
  } catch (error: any) {
    console.error('リクエスト承認エラー:', error);
    throw error;
  }
};

// 師匠選択リクエストを拒否
export const rejectMentorRequest = async (requestId: number) => {
  try {
    return await authedApiClient(`/api/mentorship/requests/${requestId}/reject`, {
      method: 'POST',
    });
  } catch (error: any) {
    console.error('リクエスト拒否エラー:', error);
    throw error;
  }
};

// 師匠の弟子一覧を取得
export const getMentees = async (topicId: string) => {
  try {
    return await authedApiClient(`/api/mentorship/mentees/${topicId}`);
  } catch (error: any) {
    console.error('弟子一覧取得エラー:', error);
    throw error;
  }
};

// 師匠の定員情報を取得
export const getMentorCapacity = async (topicId: string) => {
  try {
    return await authedApiClient(`/api/mentorship/capacity/${topicId}`);
  } catch (error: any) {
    console.error('定員情報取得エラー:', error);
    throw error;
  }
};

// 弟子を破門
export const expelMentee = async (menteeId: number, topicId: string) => {
  try {
    return await authedApiClient(`/api/mentorship/mentees/${menteeId}/expel`, {
      method: 'POST',
      body: { topic_id: topicId },
    });
  } catch (error: any) {
    console.error('弟子破門エラー:', error);
    throw error;
  }
};

// 弟子を卒業
export const graduateMentee = async (menteeId: number, topicId: string) => {
  try {
    return await authedApiClient(`/api/mentorship/mentees/${menteeId}/graduate`, {
      method: 'POST',
      body: { topic_id: topicId },
    });
  } catch (error: any) {
    console.error('弟子卒業エラー:', error);
    throw error;
  }
};

// 師匠選択をしない（最高レベル+1に設定）
export const noMentorSelection = async (topicId: string) => {
  try {
    return await authedApiClient(`/api/mentorship/no-mentor-selection/${topicId}`, {
      method: 'POST',
    });
  } catch (error: any) {
    console.error('師匠選択スキップエラー:', error);
    throw error;
  }
};

// 師匠選択リクエストを削除
export const deleteMentorRequest = async (requestId: number): Promise<void> => {
  try {
    await authedApiClient(`/api/mentorship/requests/${requestId}`, {
      method: 'DELETE',
    });
  } catch (error: any) {
   
  }
};
