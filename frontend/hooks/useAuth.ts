// frontend/hooks/useAuth.ts
import { UserCreateOut, UserOut } from '@/types/user';
import { apiClient, authedApiClient } from '@/utils/apiClient';
import { usePathname, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';

export const ACCESS_KEY = 'accessToken';
export const REFRESH_KEY = 'refreshToken';

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

  // 初回ロード時のユーザー情報取得
  useEffect(() => {
    loadTokens();
    const fetchUser = async () => {
      const token = await SecureStore.getItemAsync(ACCESS_KEY);
      if (token) {
        try {
          // ★ここでもauthedApiを使う
          const userData = await authedApiClient<UserOut>('/api/users/me/');
          setUser(userData);
        } catch (e) {
          console.error('ユーザー情報の取得に失敗しました:', e);
          setUser(null);
          // 認証が必要なページにいたらログインページに飛ばす
          if (pathname !== '/login' && pathname !== '/signup') {
            router.replace('/login');
          }
        }
      } else {
        // 認証不要画面は遷移しない
        if (pathname !== '/login' && pathname !== '/signup') {
          router.replace('/login');
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [router, pathname]);

  return { user, accessToken, refreshToken, login, logout, loading };
}
