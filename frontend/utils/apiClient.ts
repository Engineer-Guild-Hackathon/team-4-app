import { ACCESS_KEY } from "@/hooks/useAuth";
import { refreshAccessToken } from "@/services/api/auth";
import * as SecureStore from 'expo-secure-store';

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiOptions {
  method?: ApiMethod;
  body?: Record<string, unknown>;
  token?: string; // JWTトークン（必要な場合のみ）
  headers?: Record<string, string>;
}

const BASE_URL = process.env.EXPO_PUBLIC_API_URL; // 自分のPCのIPアドレスを指定

export async function apiClient<T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = 'GET', body, token, headers = {} } = options;
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  const res = await fetch(url, fetchOptions);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || res.statusText);
  }
  return res.json();
}

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
        (e as { message:string }).message.includes('expired') ||
        (e as { message:string }).message.includes('credentials'))
    ) {
      // トークンをリフレッシュ
      const refreshed = await refreshAccessToken();
      
      // リフレッシュに成功したら、APIを再試行
      if (refreshed) {
        const newAccessToken = await SecureStore.getItemAsync(ACCESS_KEY);
        return await apiClient<T>(endpoint, { ...options, token: newAccessToken ?? undefined });
      }
    }
    // それ以外のエラー、またはリフレッシュ失敗時はエラーをそのまま投げる
    throw e;
  }
}