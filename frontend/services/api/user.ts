import { UserDetailOut, UserOut } from '@/types/user';
import { authedApiClient } from '@/utils/authedApiClient';

export const getMe = async (): Promise<UserOut> => {
  const res = await authedApiClient<UserOut>('/api/users/me/');
  return res;
};

export const getUser = async (userId: number): Promise<UserDetailOut> => {
  const res = await authedApiClient<UserDetailOut>(`/api/users/${userId}/`);
  return res;
};

export const blockUser = async (userId: number): Promise<void> => {
  await authedApiClient(`/api/users/${userId}/block/`, {
    method: 'POST',
  });
};

export const unblockUser = async (userId: number): Promise<void> => {
  await authedApiClient(`/api/users/${userId}/unblock/`, {
    method: 'POST',
  });
};
