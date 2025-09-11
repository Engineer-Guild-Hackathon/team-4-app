// frontend/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/utils/apiClient';
import * as SecureStore from 'expo-secure-store';
import { useRouter, usePathname } from 'expo-router';

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

export function useAuth() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
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
    const res = await apiClient('/api/token/pair', {
      method: 'POST',
      body: { username, password },
    });
    await SecureStore.setItemAsync(ACCESS_KEY, res.access);
    await SecureStore.setItemAsync(REFRESH_KEY, res.refresh);
    setAccessToken(res.access);
    setRefreshToken(res.refresh);
    router.replace('/'); // ログイン後トップへ
  };

  // ログアウト
  const logout = async () => {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    router.replace('/login');
  };

  // アクセストークンのリフレッシュ
  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) return false;
    try {
      const res = await apiClient('/api/token/refresh', {
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
  }, [refreshToken]);

  // 初回ロード
  useEffect(() => {
    (async () => {
      await loadTokens();
      setLoading(false);
    })();
  }, [loadTokens]);

  // トークンがあればユーザー情報取得
  useEffect(() => {
    if (accessToken) {
    } else if (!loading) {
      // 認証不要画面（/login, /signup）は遷移しない
      if (pathname !== '/login' && pathname !== '/signup') {
        router.replace('/login');
      }
    } else {
    }
  }, [accessToken, loading, router, pathname]);

  // API呼び出しラッパー（自動リフレッシュ）
  const authedApi = async (endpoint: string, options: any = {}) => {
    try {
      return await apiClient(endpoint, { ...options, token: accessToken });
    } catch (e: any) {
      if (e.message?.includes('token') || e.message?.includes('expired')) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          // リフレッシュ後の新しいアクセストークンを取得
          const newAccessToken = await SecureStore.getItemAsync(ACCESS_KEY);
          return await apiClient(endpoint, { ...options, token: newAccessToken });
        } else {
          await logout();
        }
      }
      throw e;
    }
  };

  return { user, accessToken, refreshToken, login, logout, authedApi, loading };
}
