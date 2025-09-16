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
    // 204 No Contentでもres.okはtrueなのでここは通らない
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || res.statusText);
  }
  if (res.status === 204) {
    // No Content: サーバーは空レスポンス
    return undefined as T;
  }
  return (await res.json()) as T;
}
