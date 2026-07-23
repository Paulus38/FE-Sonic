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
  /** GET /api/v1/recordings — thư viện (App) */
  list: (page = 1, limit = 50) =>
    apiRequest<{
      items: import('../types').Recording[];
      meta: { page: number; limit: number; total: number };
    }>(`/api/v1/recordings?page=${page}&limit=${limit}`),
  /** GET /api/v1/recordings/:id — chi tiết + transcript */
  get: (id: string) =>
    apiRequest<import('../types').Recording>(`/api/v1/recordings/${id}`),
  /** POST /api/v1/recordings — tạo draft lúc Bắt đầu ghi */
  create: (body: { title: string; category?: string }) =>
    apiRequest<import('../types').Recording>('/api/v1/recordings', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  /**
   * POST /:id/finalize — lưu title/duration/transcript → READY.
   * Chỉ gọi sau uploadAudio OK (BE từ chối nếu chưa có audio).
   */
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
  /** POST /:id/summarize — Gemini tóm tắt on-demand (Detail) */
  summarize: (id: string) =>
    apiRequest<import('../types').Recording>(`/api/v1/recordings/${id}/summarize`, {
      method: 'POST',
    }),
  /** POST /:id/transcribe — STT lại từ file đã lưu */
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
  /**
   * Upload audio sau khi dừng ghi (LiveRecordView.handleSave).
   * Prefer: upload-info → Blob client-upload → confirm (file lớn).
   * Fallback: POST multipart /:id/audio (dev / không Blob / file <~4MB).
   */
  uploadAudio: async (
    id: string,
    blob: Blob,
    onProgress?: (pct: number) => void,
  ) => {
    const mime = blob.type || 'audio/webm';
    const sizeMb = blob.size / (1024 * 1024);
    const info = await apiRequest<{
      clientUpload: boolean;
      access: 'public' | 'private';
      pathname: string;
      maxBytes: number;
    }>(
      `/api/v1/recordings/${id}/audio/upload-info?mime=${encodeURIComponent(mime)}`,
    );

    // Browser → Vercel Blob trực tiếp (không qua body Nest ~4.5MB).
    // Luôn multipart để cuộc họp / phỏng vấn dài (chục phút–1 giờ) ổn định.
    if (info.clientUpload) {
      try {
        const { upload } = await import('@vercel/blob/client');
        const token = getToken();
        const result = await upload(info.pathname, blob, {
          access: info.access,
          handleUploadUrl: `${API_BASE}/api/v1/recordings/${id}/audio/client-upload`,
          contentType: mime,
          multipart: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          onUploadProgress: (e) => {
            if (onProgress && e.total > 0) {
              onProgress(Math.round((e.loaded / e.total) * 100));
            }
          },
        });
        return apiRequest<{ audioUrl: string }>(
          `/api/v1/recordings/${id}/audio/confirm`,
          {
            method: 'POST',
            body: JSON.stringify({
              url: result.url,
              contentType: result.contentType || mime,
              size: blob.size,
            }),
          },
        );
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        throw new Error(
          `Upload audio thất bại (${sizeMb.toFixed(1)} MB). ${detail}`,
        );
      }
    }

    // Fallback chỉ khi chưa cấu hình Blob — Nest/Vercel chỉ chịu ~4MB
    if (blob.size > 4 * 1024 * 1024) {
      throw new Error(
        `File ${sizeMb.toFixed(1)} MB quá lớn cho upload qua server. Cần BLOB_READ_WRITE_TOKEN (client → Vercel Blob) để lưu cuộc họp dài.`,
      );
    }
    const form = new FormData();
    const ext = mime.includes('mp4')
      ? 'mp4'
      : mime.includes('aac')
        ? 'aac'
        : 'webm';
    form.append('file', blob, `recording-${id}.${ext}`);
    return apiRequest<{ audioUrl: string }>(`/api/v1/recordings/${id}/audio`, {
      method: 'POST',
      body: form,
    });
  },
  /** GET /:id/audio → blob URL để <audio> phát lại */
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
  /** DELETE /:id — hủy phiên / xóa thư viện */
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
