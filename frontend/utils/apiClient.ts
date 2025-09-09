// frontend/utils/apiClient.ts
import { Platform } from 'react-native';

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiOptions {
  method?: ApiMethod;
  body?: any;
  token?: string; // JWTトークン（必要な場合のみ）
  headers?: Record<string, string>;
}

const BASE_URL = Platform.OS === 'web'
  ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  : 'http://192.168.10.4:8000'; // Expo Goの場合はIP直指定推奨

export async function apiClient<T = any>(
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

// 使い方例：
// const data = await apiClient('/api/protected', { token: 'JWTトークン' });
// const loginRes = await apiClient('/api/login', { method: 'POST', body: { username, password } });
