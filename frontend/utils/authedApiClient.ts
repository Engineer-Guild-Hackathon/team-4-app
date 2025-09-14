import { ACCESS_KEY } from '@/constants';
import { refreshAccessToken } from '@/services/api/auth';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from './apiClient';

export const authedApiClient = async <T>(
  endpoint: string,
  options: Record<string, unknown> = {}
): Promise<T> => {
  try {
    // まず現在のトークンでAPIを試行
    const accessToken = await SecureStore.getItemAsync(ACCESS_KEY);
    return await apiClient<T>(endpoint, { ...options, token: accessToken ?? undefined });
  } catch (e: unknown) {
    // エラーがトークン関連のものであるかを判定
    if (
      typeof e === 'object' &&
      e !== null &&
      'message' in e &&
      typeof (e as { message?: string }).message === 'string' &&
      ((e as { message: string }).message.includes('token') ||
        (e as { message: string }).message.includes('expired') ||
        (e as { message: string }).message.includes('credentials'))
    ) {
      // トークンをリフレッシュ
      const refreshed = await refreshAccessToken();

      // リフレッシュに成功したら、APIを再試行
      if (refreshed) {
        const newAccessToken = await SecureStore.getItemAsync(ACCESS_KEY);
        return await apiClient<T>(endpoint, { ...options, token: newAccessToken ?? undefined });
      }
    }
    throw e;
  }
};
