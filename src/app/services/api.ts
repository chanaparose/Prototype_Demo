/**
 * API Client — ใช้ fetch wrapper พร้อม JWT token management
 * Base path ตาม docs/API_SPEC.md: .../api/v1
 */

const DEFAULT_API_BASE = '/api/v1';

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
  DEFAULT_API_BASE;

// ─── Token helpers ───────────────────────────────────────────────
export function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function setToken(token: string) {
  localStorage.setItem('auth_token', token);
}

export function removeToken() {
  localStorage.removeItem('auth_token');
}

// ─── Generic fetch wrapper ──────────────────────────────────────
type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
};

/** Extract error message from various API error response shapes */
function extractErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  const d = data as Record<string, unknown>;
  // Try common fields: message, detail, error, errors
  if (typeof d.message === 'string' && d.message) return d.message;
  if (typeof d.detail === 'string' && d.detail) return d.detail;
  if (typeof d.error === 'string' && d.error) return d.error;
  if (Array.isArray(d.errors) && d.errors.length > 0) {
    const first = d.errors[0];
    if (typeof first === 'string') return first;
    if (typeof first === 'object' && first && typeof (first as Record<string, unknown>).msg === 'string')
      return (first as Record<string, string>).msg;
  }
  return fallback;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, timeoutMs = 60000 } = options;

  const token = getToken();
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // POST /auth/login และ /auth/register ไม่ควรแนบ Bearer (ตาม API spec; ลดปัญหา token เก่า)
  const skipBearer =
    method === 'POST' &&
    (endpoint === '/auth/login' || endpoint === '/auth/register');

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

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${endpoint}`, config);
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('เซิร์ฟเวอร์ตอบกลับช้าเกินไป (timeout) — Render free tier อาจกำลัง cold start กรุณาลองใหม่อีกครั้ง');
    }
    // Network error (no internet, DNS fail, CORS, server down)
    throw new Error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ — กรุณาตรวจสอบ internet หรือลองใหม่อีกครั้ง');
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 401) {
    const errorData = await res.json().catch(() => ({}));
    const authPostFailed = method === 'POST' && endpoint.startsWith('/auth/');
    if (!authPostFailed) {
      removeToken();
      window.location.href = '/login';
    }
    throw new Error(extractErrorMessage(errorData, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'));
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      extractErrorMessage(errorData, `API Error: ${res.status} ${res.statusText}`),
    );
  }

  // Handle 204 No Content
  if (res.status === 204) return {} as T;

  return res.json() as Promise<T>;
}

// ─── Convenience methods ────────────────────────────────────────
export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, body?: unknown) => request<T>(endpoint, { method: 'POST', body }),
  patch: <T>(endpoint: string, body?: unknown) => request<T>(endpoint, { method: 'PATCH', body }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};

// ─── Auth API ───────────────────────────────────────────────────
export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterCustomerPayload = {
  role: 'CT';
  email: string;
  phone: string;
  password: string;
  first_name: string;
  last_name: string;
};

export type RegisterFactoryPayload = {
  role: 'FT';
  email: string;
  phone: string;
  password: string;
  factory_name: string;
  factory_type_id: number;
  tax_id: string;
};

export type AuthResponse = {
  token: string;
  user: Record<string, unknown>;
};

export const authApi = {
  login: (payload: LoginPayload) => api.post<AuthResponse>('/auth/login', payload),
  register: (payload: RegisterCustomerPayload | RegisterFactoryPayload) =>
    api.post<AuthResponse>('/auth/register', payload),
  forgotPassword: (email: string) =>
    api.post<{ message: string; reset_token?: string }>('/auth/forgot-password', { email }),
  resetPassword: (token: string, new_password: string) =>
    api.post('/auth/reset-password', { token, new_password }),
};

// ─── Frontend API (aggregated endpoints) ────────────────────────
export const frontendApi = {
  getMe: () => api.get<Record<string, unknown>>('/frontend/me'),
  getBootstrap: () =>
    api.get<{
      currentUser: Record<string, unknown>;
      categories: unknown[];
      factories: unknown[];
      rfqs: unknown[];
      orders: unknown[];
      threads: unknown[];
    }>('/frontend/bootstrap'),
  getMockData: () => api.get<Record<string, unknown>>('/frontend/mock-data'),
  getFactories: () => api.get<unknown[]>('/frontend/factories'),
  getFactory: (id: string | number) =>
    api.get<{
      factory: Record<string, unknown>;
      profile: Record<string, unknown>;
      reviews: unknown[];
      products: unknown[];
      promotions: unknown[];
      ideas: unknown[];
    }>(`/frontend/factories/${id}`),
  getRfq: (id: string | number) => api.get<Record<string, unknown>>(`/frontend/rfqs/${id}`),
  getOrder: (id: string | number) => api.get<Record<string, unknown>>(`/frontend/orders/${id}`),
  getMessageThreads: () => api.get<unknown[]>('/frontend/messages/threads'),
  /** Aggregated explore data — products + promotions + promo_codes + factories + categories + idea_articles */
  getExplore: () =>
    api.get<{
      products: unknown[];
      promotions: unknown[];
      promo_codes: unknown[];
      factories: unknown[];
      idea_articles: unknown[];
      categories: unknown[];
    }>('/frontend/explore'),
  getProducts: (limit = 8, categoryId?: string) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (categoryId) params.set('category_id', categoryId);
    return api.get<unknown[]>(`/frontend/products?${params}`);
  },
  getPromotions: (limit = 4) => api.get<unknown[]>(`/frontend/promotions?limit=${limit}`),
  getPromoCodes: () => api.get<unknown[]>('/frontend/promo-codes'),
};

// ─── CRUD endpoints ─────────────────────────────────────────────
export const categoriesApi = {
  list: () => api.get<unknown[]>('/categories'),
};

export const factoriesApi = {
  list: () => api.get<unknown[]>('/factories/'),
  get: (id: string | number) => api.get<Record<string, unknown>>(`/factories/${id}`),
  create: (data: Record<string, unknown>) => api.post<Record<string, unknown>>('/factories/', data),
  update: (id: string | number, data: Record<string, unknown>) =>
    api.patch<Record<string, unknown>>(`/factories/${id}`, data),
  delete: (id: string | number) => api.delete(`/factories/${id}`),
};

export const rfqsApi = {
  list: (status?: string) => api.get<unknown[]>(`/rfqs/${status ? `?status=${status}` : ''}`),
  get: (id: string | number) => api.get<{ rfq: Record<string, unknown>; images: unknown[] }>(`/rfqs/${id}`),
  create: (data: Record<string, unknown>) => api.post<Record<string, unknown>>('/rfqs/', data),
  addImage: (rfqId: string | number, imageUrl: string) =>
    api.post(`/rfqs/${rfqId}/images`, { image_url: imageUrl }),
  cancel: (rfqId: string | number) => api.patch(`/rfqs/${rfqId}/cancel`),
  createQuotation: (rfqId: string | number, data: Record<string, unknown>) =>
    api.post(`/rfqs/${rfqId}/quotations`, data),
  listQuotations: (rfqId: string | number) => api.get<unknown[]>(`/rfqs/${rfqId}/quotations`),
};

export const ordersApi = {
  list: (status?: string) => api.get<unknown[]>(`/orders/${status ? `?status=${status}` : ''}`),
  get: (id: string | number) => api.get<Record<string, unknown>>(`/orders/${id}`),
  create: (quoteId: number) => api.post<Record<string, unknown>>('/orders/', { quote_id: quoteId }),
  updateStatus: (id: string | number, status: string) =>
    api.patch(`/orders/${id}/status`, { status }),
  addProductionUpdate: (
    orderId: string | number,
    data: { step_id: number; description: string; image_url?: string },
  ) => api.post(`/orders/${orderId}/production-updates`, data),
  listProductionUpdates: (orderId: string | number) =>
    api.get<unknown[]>(`/orders/${orderId}/production-updates`),
};

export const messagesApi = {
  send: (data: {
    reference_type: string;
    reference_id: string;
    receiver_id: number;
    content: string;
    attachment_url?: string;
    conv_id?: number;
    message_type?: string; // TX (text), QT (quote), IM (image)
    quote_data?: string | null; // JSON string for QT type
  }) => api.post('/messages/', data),
  list: (referenceType: string, referenceId: string) =>
    api.get<unknown[]>(`/messages/?reference_type=${referenceType}&reference_id=${referenceId}`),
  listByConversation: (convId: number | string) =>
    api.get<unknown[]>(`/messages/?conv_id=${convId}`),
  threads: () => api.get<unknown[]>('/messages/threads'),
};

export const walletApi = {
  getMe: () => api.get<Record<string, unknown>>('/wallets/me'),
};

export const masterApi = {
  provinces: () => api.get<unknown[]>('/master/provinces'),
  districts: (provinceId: number) => api.get<unknown[]>(`/master/districts?province_id=${provinceId}`),
  subDistricts: (districtId: number) =>
    api.get<unknown[]>(`/master/sub-districts?district_id=${districtId}`),
  factoryTypes: () => api.get<unknown[]>('/master/factory-types'),
  productCategories: () => api.get<unknown[]>('/master/product-categories'),
  productionSteps: () => api.get<unknown[]>('/master/production-steps'),
  units: () => api.get<unknown[]>('/master/units'),
  shippingMethods: () => api.get<unknown[]>('/master/shipping-methods'),
};

// ─── Showcases API ─────────────────────────────────────────────
export const showcasesApi = {
  list: (type?: string) => api.get<unknown[]>(`/showcases${type ? `?type=${type}` : ''}`),
  create: (data: {
    content_type: string;
    title: string;
    excerpt?: string;
    image_url?: string;
    category_id?: number;
    min_order?: number;
    lead_time_days?: number;
  }) => api.post<Record<string, unknown>>('/showcases', data),
};

// ─── Promo Slides API ──────────────────────────────────────────
export const promoSlidesApi = {
  list: () => api.get<unknown[]>('/promo-slides'),
};

// ─── Conversations API ─────────────────────────────────────────
export const conversationsApi = {
  list: () => api.get<unknown[]>('/conversations'),
  get: (convId: number | string) => api.get<Record<string, unknown>>(`/conversations/${convId}`),
  create: (data: { customer_id: number; factory_id: number }) =>
    api.post<Record<string, unknown>>('/conversations', data),
};

// ─── Notifications API ─────────────────────────────────────────
export const notificationsApi = {
  list: () => api.get<unknown[]>('/notifications'),
  markAsRead: (notiId: number | string) =>
    api.patch<Record<string, unknown>>(`/notifications/${notiId}/read`),
};

// ─── Favorites API ─────────────────────────────────────────────
export const favoritesApi = {
  list: () => api.get<unknown[]>('/favorites'),
  add: (showcaseId: number) => api.post<Record<string, unknown>>('/favorites', { showcase_id: showcaseId }),
  remove: (showcaseId: number | string) => api.delete(`/favorites/${showcaseId}`),
};

// ─── Reviews API ───────────────────────────────────────────────
export const reviewsApi = {
  listByFactory: (factoryId: number | string) =>
    api.get<unknown[]>(`/factories/${factoryId}/reviews`),
  create: (factoryId: number | string, data: { rating: number; comment: string }) =>
    api.post<Record<string, unknown>>(`/factories/${factoryId}/reviews`, data),
};

// ─── Certificates API ──────────────────────────────────────────
export const certificatesApi = {
  listByFactory: (factoryId: number | string) =>
    api.get<unknown[]>(`/factories/${factoryId}/certificates`),
  create: (
    factoryId: number | string,
    data: { cert_id: number; document_url: string; expire_date?: string; cert_number?: string },
  ) => api.post<Record<string, unknown>>(`/factories/${factoryId}/certificates`, data),
};

// ─── Quotations API ────────────────────────────────────────────
export const quotationsApi = {
  get: (quotationId: number | string) =>
    api.get<Record<string, unknown>>(`/quotations/${quotationId}`),
  updateStatus: (quotationId: number | string, status: string) =>
    api.patch<Record<string, unknown>>(`/quotations/${quotationId}/status`, { status }),
};

// ─── Addresses API ─────────────────────────────────────────────
export const addressesApi = {
  list: () => api.get<unknown[]>('/addresses'),
  create: (data: {
    address_type: string;
    address_detail: string;
    sub_district_id: number;
    district_id: number;
    province_id: number;
    zip_code: string;
    is_default?: boolean;
  }) => api.post<Record<string, unknown>>('/addresses', data),
  update: (addressId: number | string, data: Record<string, unknown>) =>
    api.patch<Record<string, unknown>>(`/addresses/${addressId}`, data),
};

// ─── Transactions API ──────────────────────────────────────────
export const transactionsApi = {
  list: () => api.get<unknown[]>('/transactions'),
  create: (data: { wallet_id: number; order_id?: number; type: string; amount: number }) =>
    api.post<Record<string, unknown>>('/transactions', data),
  updateStatus: (txId: string, status: string) =>
    api.patch<Record<string, unknown>>(`/transactions/${txId}/status`, { status }),
};

// ─── Production Updates API ────────────────────────────────────
export const productionUpdatesApi = {
  patch: (updateId: number | string, data: Record<string, unknown>) =>
    api.patch<Record<string, unknown>>(`/production-updates/${updateId}`, data),
};

// ─── Media Upload API ──────────────────────────────────────────
export const mediaApi = {
  upload: async (file: File): Promise<{ url: string; file_name: string; size: number }> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${BASE_URL}/media/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        extractErrorMessage(errorData, `Upload failed: ${res.status}`),
      );
    }
    return res.json();
  },
};

// ─── Health Check (different base) ──────────────────────────────
export async function healthCheck(): Promise<{ status: string }> {
  const res = await fetch('/health');
  return res.json();
}
