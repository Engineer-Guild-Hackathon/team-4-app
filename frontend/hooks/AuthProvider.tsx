import { ACCESS_KEY, REFRESH_KEY } from '@/constants';
import { UserCreateOut, UserOut } from '@/types/user';
import { apiClient } from '@/utils/apiClient';
import { authedApiClient } from '@/utils/authedApiClient';
import { usePathname, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: UserOut | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
      const userData = await authedApiClient<UserOut>('/api/users/me/', { token: res.access });
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
          const userData = await authedApiClient<UserOut>('/api/users/me/', { token });
          setUser(userData);
        } catch (e) {
          console.error('ユーザー情報の取得に失敗しました:', e);
          setUser(null);
          if (pathname !== '/login' && pathname !== '/signup' && 
              pathname !== '/password-reset-request' && pathname !== '/password-reset-confirm') {
            router.replace('/login');
          }
        }
      } else {
        if (pathname !== '/login' && pathname !== '/signup' && 
            pathname !== '/password-reset-request' && pathname !== '/password-reset-confirm') {
          router.replace('/login');
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, [router, pathname, loadTokens]);

  return (
    <AuthContext.Provider value={{ user, accessToken, refreshToken, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
