// frontend/hooks/useAuth.ts
import { UserCreateOut, UserOut } from '@/types/user';
import { apiClient } from '@/utils/apiClient';
import { usePathname, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

export function useAuth() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserOut | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // トークン取得
  const loadTokens = useCallback(async () => {
    const access = await SecureStore.getItemAsync(ACCESS_KEY);
    const refresh = await SecureStore.getItemAsync(REFRESH_KEY);
    setAccessToken(access);
    setRefreshToken(refresh);
  }, []);

  // ログイン
  const login = async (username: string, password: string) => {
    const res = await apiClient<UserCreateOut>('/api/token/pair', {
      method: 'POST',
      body: { username, password },
    });
    await SecureStore.setItemAsync(ACCESS_KEY, res.access);
    await SecureStore.setItemAsync(REFRESH_KEY, res.refresh);
    setAccessToken(res.access);
    setRefreshToken(res.refresh);

    try {
      const userData = await apiClient<UserOut>('/api/users/me/', { token: res.access });
      setUser(userData);
      router.replace('/');
    } catch (e) {
      console.error('ログイン後のユーザー情報取得に失敗:', e);
      router.replace('/');
    }
  };

  // ログアウト
  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    router.replace('/login');
  }, [router]);

  // アクセストークンのリフレッシュ
  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) return false;
    try {
      const res = await apiClient<UserCreateOut>('/api/token/refresh', {
        method: 'POST',
        body: { refresh: refreshToken },
      });
      await SecureStore.setItemAsync(ACCESS_KEY, res.access);
      setAccessToken(res.access);
      return true;
    } catch {
      await logout();
      return false;
    }
  }, [refreshToken, logout]);

  // 初回ロード
  useEffect(() => {
    (async () => {
      await loadTokens();
      setLoading(false);
    })();
  }, [loadTokens]);

  // API呼び出しラッパー（自動リフレッシュ）
  const authedApi = useCallback(
    async <T>(endpoint: string, options: Record<string, unknown> = {}): Promise<T> => {
      try {
        return await apiClient<T>(endpoint, { ...options, token: accessToken ?? undefined });
      } catch (e: unknown) {
        if (
          typeof e === 'object' &&
          e !== null &&
          'message' in e &&
          typeof (e as { message?: string }).message === 'string' &&
          ((e as { message: string }).message.includes('token') ||
            (e as { message: string }).message.includes('expired'))
        ) {
          const refreshed = await refreshAccessToken();
          if (refreshed) {
            const newAccessToken = (await SecureStore.getItemAsync(ACCESS_KEY)) ?? undefined;
            return await apiClient<T>(endpoint, { ...options, token: newAccessToken });
          } else {
            await logout();
          }
        }
        throw e;
      }
    },
    [accessToken, refreshAccessToken, logout]
  );

  // トークンがあればユーザー情報取得
  useEffect(() => {
    const fetchUser = async () => {
      if (!accessToken) return;
      try {
        const userData = await authedApi<UserOut>('/api/users/me/');
        setUser(userData);
      } catch (e) {
        console.error('ユーザー情報の取得に失敗しました:', e);
        setUser(null);
      }
    };

    if (accessToken) {
      fetchUser();
    } else if (!loading) {
      // 認証不要画面（/login, /signup）は遷移しない
      if (pathname !== '/login' && pathname !== '/signup') {
        router.replace('/login');
      }
    } else {
    }
  }, [accessToken, loading, router, pathname, authedApi]);

  return { user, accessToken, refreshToken, login, logout, authedApi, loading };
}
