import { UserOut } from '@/types/user';
import { authedApiClient } from '@/utils/authedApiClient';

export const getMe = async (): Promise<UserOut> => {
  const res = await authedApiClient<UserOut>('/api/users/me/');
  return res;
};
