const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:3001';

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
};

function getToken(): string | null {
  return localStorage.getItem('sonic_token');
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('sonic_token', token);
  else localStorage.removeItem('sonic_token');
}

export function getApiBase() {
  return API_BASE;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const payload = (await res.json()) as ApiEnvelope<T> & {
    message?: string;
    statusCode?: number;
  };

  if (!res.ok || payload.success === false) {
    throw new Error(payload.message || `Request failed (${res.status})`);
  }

  return payload.data;
}

export const authApi = {
  register: (body: { name: string; email: string; password: string }) =>
    apiRequest<{
      accessToken: string;
      user: import('../types').UserSettings & { id: string };
    }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  login: (body: { email: string; password: string }) =>
    apiRequest<{
      accessToken: string;
      user: import('../types').UserSettings & { id: string };
    }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

export const usersApi = {
  me: () =>
    apiRequest<import('../types').UserSettings & { id: string }>(
      '/api/v1/users/me',
    ),
  storage: () =>
    apiRequest<{
      usedBytes: number;
      quotaBytes: number;
      fileCount: number;
      provider: string;
      source: string;
    }>('/api/v1/users/me/storage'),
  updateSettings: (body: Partial<import('../types').UserSettings>) =>
    apiRequest<import('../types').UserSettings & { id: string }>(
      '/api/v1/users/me/settings',
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      },
    ),
};

export const aiApi = {
  usage: () =>
    apiRequest<{
      summary: import('../types').AiUsageSummary;
      events: import('../types').AiUsageEvent[];
      usedTokens: number;
      quotaTokens: number;
    }>('/api/v1/ai/usage'),
  usageAll: () =>
    apiRequest<{ items: import('../types').AiUsageSummary[] }>(
      '/api/v1/ai/usage/all',
    ),
};

export const adminApi = {
  listUsers: () =>
    apiRequest<
      Array<import('../types').UserSettings & { id: string; role: string }>
    >('/api/v1/admin/users'),
  createUser: (body: {
    name: string;
    email: string;
    password: string;
    role?: 'user' | 'admin';
  }) =>
    apiRequest<import('../types').UserSettings & { id: string; role: string }>(
      '/api/v1/admin/users',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    ),
  updateUser: (
    id: string,
    body: {
      name?: string;
      email?: string;
      password?: string;
      role?: 'user' | 'admin';
    },
  ) =>
    apiRequest<import('../types').UserSettings & { id: string; role: string }>(
      `/api/v1/admin/users/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      },
    ),
  setRole: (id: string, role: 'user' | 'admin') =>
    apiRequest<import('../types').UserSettings & { id: string; role: string }>(
      `/api/v1/admin/users/${id}/role`,
      {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      },
    ),
  deleteUser: (id: string) =>
    apiRequest<void>(`/api/v1/admin/users/${id}`, { method: 'DELETE' }),
  listLogs: (params?: { limit?: number; action?: string; userId?: string }) => {
    const q = new URLSearchParams();
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.action) q.set('action', params.action);
    if (params?.userId) q.set('userId', params.userId);
    const qs = q.toString();
    return apiRequest<{ items: import('../types').AuditLogEntry[] }>(
      `/api/v1/admin/logs${qs ? `?${qs}` : ''}`,
    );
  },
};

export const recordingsApi = {
  list: (page = 1, limit = 50) =>
    apiRequest<{
      items: import('../types').Recording[];
      meta: { page: number; limit: number; total: number };
    }>(`/api/v1/recordings?page=${page}&limit=${limit}`),
  get: (id: string) =>
    apiRequest<import('../types').Recording>(`/api/v1/recordings/${id}`),
  create: (body: { title: string; category?: string }) =>
    apiRequest<import('../types').Recording>('/api/v1/recordings', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  finalize: (
    id: string,
    body: {
      title?: string;
      category?: string;
      durationSec: number;
      transcript?: import('../types').TranscriptLine[];
      generateSummary?: boolean;
    },
  ) =>
    apiRequest<import('../types').Recording>(
      `/api/v1/recordings/${id}/finalize`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    ),
  summarize: (id: string) =>
    apiRequest<import('../types').Recording>(`/api/v1/recordings/${id}/summarize`, {
      method: 'POST',
    }),
  retranscribe: (
    id: string,
    body?: { language?: 'en' | 'vi'; translate?: boolean },
  ) =>
    apiRequest<
      import('../types').Recording & { sttProvider?: string }
    >(`/api/v1/recordings/${id}/transcribe`, {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    }),
  uploadAudio: async (id: string, blob: Blob) => {
    const form = new FormData();
    const ext = blob.type.includes('mp4')
      ? 'mp4'
      : blob.type.includes('aac')
        ? 'aac'
        : 'webm';
    form.append('file', blob, `recording-${id}.${ext}`);
    return apiRequest<{ audioUrl: string }>(`/api/v1/recordings/${id}/audio`, {
      method: 'POST',
      body: form,
    });
  },
  fetchAudioObjectUrl: async (id: string) => {
    const token = localStorage.getItem('sonic_token');
    const base =
      import.meta.env.VITE_API_URL?.replace(/\/$/, '') ||
      'http://localhost:3001';
    const res = await fetch(`${base}/api/v1/recordings/${id}/audio`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      throw new Error('Không tải được file âm thanh');
    }
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },
  remove: (id: string) =>
    apiRequest<void>(`/api/v1/recordings/${id}`, { method: 'DELETE' }),
};

export const dictionaryApi = {
  list: (page = 1, limit = 100) =>
    apiRequest<{
      items: import('../types').DictionaryItem[];
      meta: { total: number };
    }>(`/api/v1/dictionary?page=${page}&limit=${limit}`),
  create: (body: Omit<import('../types').DictionaryItem, 'id'>) =>
    apiRequest<import('../types').DictionaryItem>('/api/v1/dictionary', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  remove: (id: string) =>
    apiRequest<void>(`/api/v1/dictionary/${id}`, { method: 'DELETE' }),
};
