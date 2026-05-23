import { getTourMockResponse } from '@/utils/tourMocks';
import { getToken, removeToken } from '@/services/api/tokenManager';
import { redirectToLogin } from '@/utils/navigation/redirect';

export type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
};

export class ApiHttpError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ApiHttpError';
    this.status = status;
    this.body = body;
  }
}

function extractErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  const d = data as Record<string, unknown>;

  if (typeof d.message === 'string' && d.message) return d.message;
  if (typeof d.detail === 'string' && d.detail) return d.detail;
  if (typeof d.error === 'string' && d.error) return d.error;

  if (Array.isArray(d.errors) && d.errors.length > 0) {
    const first = d.errors[0];
    if (typeof first === 'string') return first;
    if (
      typeof first === 'object' &&
      first &&
      typeof (first as Record<string, unknown>).msg === 'string'
    ) {
      return (first as Record<string, string>).msg;
    }
  }

  return fallback;
}

function resolveApiBase(): string {
  const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');
  if (!raw) return '/api/v1';

  if (raw.startsWith('http') && !/\/api\/v\d+(\/|$)/.test(raw)) {
    return `${raw}/api/v1`;
  }

  return raw;
}

const BASE_URL = resolveApiBase();

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, timeoutMs = 60000 } = options;

  const tourMock = getTourMockResponse(endpoint, method);
  if (tourMock !== undefined) {
    return new Promise<T>((resolve) => {
      window.setTimeout(() => resolve(tourMock as T), 0);
    });
  }

  const token = getToken();
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  const skipBearer =
    method === 'POST' && (endpoint === '/auth/login' || endpoint === '/auth/register');

  if (token && !skipBearer) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const config: RequestInit = {
    method,
    headers: defaultHeaders,
    signal: controller.signal,
  };

  if (body != null && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const url = endpoint.startsWith('/admin/')
    ? `/api${endpoint}`
    : endpoint.startsWith('/api/')
      ? endpoint
      : `${BASE_URL}${endpoint}`;

  let res: Response;
  try {
    res = await fetch(url, config);
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(
        'เซิร์ฟเวอร์ตอบกลับช้าเกินไป (timeout) — Render free tier อาจกำลัง cold start กรุณาลองใหม่อีกครั้ง',
      );
    }
    throw new Error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ — กรุณาตรวจสอบ internet หรือลองใหม่อีกครั้ง');
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 401) {
    const errorData = await res.json().catch(() => ({}));
    const authPostFailed = method === 'POST' && endpoint.startsWith('/auth/');
    let skipImmediateLogout = false;

    try {
      const t = Number(sessionStorage.getItem('auth_login_at') ?? 0);
      if (endpoint === '/frontend/me' && Number.isFinite(t) && t > 0 && Date.now() - t < 20_000) {
        skipImmediateLogout = true;
      }
    } catch {
      // ignore
    }

    if (!getToken()) {
      skipImmediateLogout = true;
    }

    if (!authPostFailed) {
      if (!skipImmediateLogout) {
        removeToken();
        redirectToLogin();
      }
    }

    throw new Error(extractErrorMessage(errorData, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'));
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new ApiHttpError(
      extractErrorMessage(errorData, `API Error: ${res.status} ${res.statusText}`),
      res.status,
      errorData,
    );
  }

  if (res.status === 204) return {} as T;

  return res.json() as Promise<T>;
}

export const httpClient = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'POST', body, headers }),
  patch: <T>(endpoint: string, body?: unknown) => request<T>(endpoint, { method: 'PATCH', body }),
  put: <T>(endpoint: string, body?: unknown) => request<T>(endpoint, { method: 'PUT', body }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
  postForm: async <T>(endpoint: string, formData: FormData) => {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const url = endpoint.startsWith('/admin/')
      ? `/api${endpoint}`
      : endpoint.startsWith('/api/')
        ? endpoint
        : `${BASE_URL}${endpoint}`;

    const res = await fetch(url, { method: 'POST', headers, body: formData });

    if (res.status === 401) {
      removeToken();
      redirectToLogin();
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new ApiHttpError(
        extractErrorMessage(errorData, `API Error: ${res.status} ${res.statusText}`),
        res.status,
        errorData,
      );
    }

    if (res.status === 204) return {} as T;
    return res.json() as Promise<T>;
  },
};
