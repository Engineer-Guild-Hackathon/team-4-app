import { ACCESS_KEY, REFRESH_KEY } from '@/constants';
import { UserCreateOut } from '@/types/user';
import { apiClient } from '@/utils/apiClient';
import * as SecureStore from 'expo-secure-store';

export const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
  if (!refreshToken) {
    // ログイン画面へ遷移
    try {
      const { router } = await import('expo-router');
      router.push('/login');
    } catch {}
    return false;
  }

  try {
    // apiClientを使ってリフレッシュAPIを叩く
    const res = await apiClient<UserCreateOut>('/api/token/refresh', {
      method: 'POST',
      body: { refresh: refreshToken },
    });

    // 新しいアクセストークンを保存
    await SecureStore.setItemAsync(ACCESS_KEY, res.access);
    return true;
  } catch (e) {
    if (e instanceof Error) {
      // リフレッシュに失敗したらトークンを削除（ログアウト相当）
      await SecureStore.deleteItemAsync(ACCESS_KEY);
      await SecureStore.deleteItemAsync(REFRESH_KEY);
      // ログイン画面へ遷移
      try {
        const { router } = await import('expo-router');
        router.push('/login');
      } catch {
        return false;
      }
    }
  }
  return false;
};
