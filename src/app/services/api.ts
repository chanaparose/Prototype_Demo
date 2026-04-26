/**
 * API Client — ใช้ fetch wrapper พร้อม JWT token management
 * Base path ตาม docs/API_SPEC.md: .../api/v1
 */

import type { MessagesSendBody } from '../utils/chatContract';
import type { OrderDetailDTO } from '../types/api';
import type { RfqDetailResponse, RfqListItem, QuotationRow } from '../types/rfq';

const DEFAULT_API_BASE = '/api/v1';

/** Base for all API calls — must end up as `.../api/v1` so e.g. POST /api/v1/auth/register */
function resolveApiBase(): string {
  const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');
  if (!raw) return DEFAULT_API_BASE;
  // Absolute URL without /api/vN (common misconfiguration) — append /api/v1
  if (raw.startsWith('http') && !/\/api\/v\d+(\/|$)/.test(raw)) {
    return `${raw}/api/v1`;
  }
  return raw;
}

const BASE_URL = resolveApiBase();

// ─── Token helpers ───────────────────────────────────────────────
function normalizeToken(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  let trimmed = raw.trim();
  if (!trimmed) return '';
  // tolerate values like `"eyJ..."` or `'eyJ...'`
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed.replace(/^Bearer\s+/i, '').trim();
}

export function getToken(): string | null {
  const raw = localStorage.getItem('auth_token');
  const normalized = normalizeToken(raw);
  if (!normalized) return null;
  // Self-heal old/incorrect persisted values like "Bearer xxx"
  if (raw !== normalized) localStorage.setItem('auth_token', normalized);
  return normalized;
}

export function setToken(token: string) {
  const normalized = normalizeToken(token);
  if (!normalized) return;
  localStorage.setItem('auth_token', normalized);
  try {
    sessionStorage.setItem('auth_login_at', String(Date.now()));
  } catch {
    // ignore storage availability issues
  }
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

/** Thrown on non-2xx responses so callers can branch on `status` (e.g. 409, 422). */
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

  if (body != null && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  // Admin routes are served under /api/admin (not /api/v1/admin).
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
    let skipImmediateLogout = false;
    try {
      const t = Number(sessionStorage.getItem('auth_login_at') ?? 0);
      // Right after login, /frontend/me can transiently 401 on some deployments.
      if (endpoint === '/frontend/me' && Number.isFinite(t) && t > 0 && Date.now() - t < 20_000) {
        skipImmediateLogout = true;
      }
    } catch {
      // ignore
    }
    if (!authPostFailed) {
      if (!skipImmediateLogout) {
        removeToken();
        window.location.href = '/login';
      } else {
        console.warn('[api] transient 401 on /frontend/me right after login; keep token and retry later');
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

  // Handle 204 No Content
  if (res.status === 204) return {} as T;

  return res.json() as Promise<T>;
}

// ─── Convenience methods ────────────────────────────────────────
export const api = {
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
      window.location.href = '/login';
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
  /** Present when registering as factory (role FT). */
  factory?: Record<string, unknown>;
};

export const authApi = {
  login: (payload: LoginPayload) => api.post<AuthResponse>('/auth/login', payload),
  /** POST {BASE_URL}/auth/register → POST /api/v1/auth/register when base is /api/v1 or …/api/v1 */
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
  /** GET /categories/:id/sub-categories — ดึง sub-categories ของ category */
  subCategories: (categoryId: string | number) =>
    api.get<unknown[]>(`/categories/${categoryId}/sub-categories`),
};

export const factoriesApi = {
  list: () => api.get<unknown[]>('/factories'),
  get: (id: string | number) => api.get<Record<string, unknown>>(`/factories/${id}`),
  create: (data: Record<string, unknown>) => api.post<Record<string, unknown>>('/factories/', data),
  update: (id: string | number, data: Record<string, unknown>) =>
    api.put<Record<string, unknown>>(`/factories/${id}`, data),
  patch: (id: string | number, data: Record<string, unknown>) =>
    api.patch<Record<string, unknown>>(`/factories/${id}`, data),
  delete: (id: string | number) => api.delete(`/factories/${id}`),
  /** GET /factories/me — own factory profile (JWT role=FT) */
  getMe: () => api.get<Record<string, unknown>>('/factories/me'),
  /** GET /factories/me/dashboard — dashboard counts + recent items */
  getDashboard: () => api.get<Record<string, unknown>>('/factories/me/dashboard'),
  /** GET /factories/me/analytics — revenue, orders, ratings */
  getAnalytics: () => api.get<Record<string, unknown>>('/factories/me/analytics'),
  /** แทนที่ทั้งชุด — ต้องเป็น PUT ตาม FACTORY_UI_SPEC §1.1 */
  setCategories: (factoryId: string | number, categoryIds: number[]) =>
    api.put(`/factories/${factoryId}/categories`, { category_ids: categoryIds }),
  setSubCategories: (factoryId: string | number, subCategoryIds: number[]) =>
    api.put(`/factories/${factoryId}/sub-categories`, { sub_category_ids: subCategoryIds }),
  getCategories: (factoryId: string | number) =>
    api.get<unknown[]>(`/factories/${factoryId}/categories`),
  getSubCategories: (factoryId: string | number) =>
    api.get<unknown[]>(`/factories/${factoryId}/sub-categories`),
  /** DELETE /factories/:id/categories/:cid — unlink single category */
  removeCategory: (factoryId: string | number, categoryId: string | number) =>
    api.delete(`/factories/${factoryId}/categories/${categoryId}`),
  /** DELETE /factories/:id/sub-categories/:sid — unlink single sub-category */
  removeSubCategory: (factoryId: string | number, subCategoryId: string | number) =>
    api.delete(`/factories/${factoryId}/sub-categories/${subCategoryId}`),
};

export const rfqsApi = {
  list: (status?: string) => {
    const q = status != null && status !== '' ? `?status=${encodeURIComponent(status)}` : '';
    return api.get<RfqListItem[]>(`/rfqs${q}`);
  },
  /** RFQ ที่ match หมวดของโรงงานตาม JWT */
  matching: () => api.get<RfqListItem[] | null>('/rfqs/matching'),
  /** รูป RFQ หลักอยู่ที่ rfq.reference_images (image_urls รองรับเฉพาะ backward compatibility) */
  get: (id: string | number) => api.get<RfqDetailResponse>(`/rfqs/${id}`),
  /** ส่ง reference_images ใน body เดียว (สูงสุด 5 URL) */
  create: (data: Record<string, unknown> & { reference_images?: string[] }) =>
    api.post<Record<string, unknown>>('/rfqs', data),
  cancel: (rfqId: string | number) => api.patch(`/rfqs/${rfqId}/cancel`),
  createQuotation: (rfqId: string | number, data: Record<string, unknown>) =>
    api.post(`/rfqs/${rfqId}/quotations`, data),
  listQuotations: (rfqId: string | number) =>
    api.get<QuotationRow[] | null>(`/rfqs/${rfqId}/quotations`),
};

export const ordersApi = {
  list: (status?: string) => {
    const q = status != null && status !== '' ? `?status=${encodeURIComponent(status)}` : '';
    return api.get<unknown[]>(`/orders${q}`);
  },
  get: (id: string | number) => api.get<OrderDetailDTO | Record<string, unknown>>(`/orders/${id}`),
  getOne: (id: string | number) => api.get<OrderDetailDTO | Record<string, unknown>>(`/orders/${id}`),
  /** POST /api/v1/orders — body { quote_id } ตาม FE_ORDER_PAYMENT_ALIGNMENT / PAYMENT_ORDER_FLOW (ไม่มี trailing slash) */
  create: (quoteId: number) => api.post<Record<string, unknown>>('/orders', { quote_id: quoteId }),
  /** POST /orders/:order_id/payments — DP = มัดจำ (amount = deposit_amount), FP = ยอดที่เหลือ
   *  payment_method (optional, BE v2 contract per FE_PP_STATE_HANDOFF.md §v2.3.1):
   *  - 'WALLET'   → atomic wallet→wallet transfer (customer good_fund → factory pending_fund)
   *  - 'PROMPTPAY'/'BANK' → legacy off-ledger flow (still requires /verify step)
   *  idempotency_key allows safe client retries. */
  createPayment: (
    orderId: string | number,
    body: {
      type: 'DP' | 'FP';
      amount: number;
      payment_method?: 'WALLET' | 'PROMPTPAY' | 'BANK';
      idempotency_key?: string;
    },
  ) => api.post<Record<string, unknown>>(`/orders/${orderId}/payments`, body),
  /** POST /orders/:order_id/payments/:tx_id/verify — ยืนยันและตัด good_fund */
  verifyPayment: (orderId: string | number, txId: string | number) =>
    api.post<Record<string, unknown>>(`/orders/${orderId}/payments/${txId}/verify`, {}),
  updateStatus: (id: string | number, status: string) =>
    api.patch(`/orders/${id}/status`, { status }),
  /** POST /orders/:id/confirm-receipt — customer confirms goods received.
   * Expected BE effect:
   * 1) create step_id=6 completion record
   * 2) set orders.status = CP
   * 3) run settlement: factory wallet pending_fund -> good_fund */
  confirmReceipt: (
    id: string | number,
    body?: { note?: string; received_at?: string },
  ) => api.post<Record<string, unknown>>(`/orders/${id}/confirm-receipt`, body ?? {}),
  /** PATCH /orders/:id/cancel — customer cancels (only allowed at PE/PP/PR/WF) */
  cancel: (id: string | number, reason?: string) =>
    api.patch<Record<string, unknown>>(`/orders/${id}/cancel`, reason ? { reason } : undefined),
  /** POST /orders/:id/ship — factory records shipment */
  ship: (
    id: string | number,
    data: { tracking_number: string; shipping_method_id?: number; note?: string },
  ) => api.post<Record<string, unknown>>(`/orders/${id}/ship`, data),
  /** GET /orders/:id/activity — activity timeline */
  activity: (id: string | number) => api.get<unknown[]>(`/orders/${id}/activity`),
  /** GET /orders/:id/review — review state for this order */
  getReviewState: (id: string | number) =>
    api.get<Record<string, unknown>>(`/orders/${id}/review`),
  /** POST /orders/:id/review — create review for completed order */
  createReview: (
    id: string | number,
    data: { rating: number; comment: string; image_urls?: string[] },
  ) => api.post<Record<string, unknown>>(`/orders/${id}/review`, data),
  /** POST /orders/:id/production-updates — tracking (IP/CD, image_urls[], payment confirm header optional) */
  postProductionUpdate: (
    orderId: string | number,
    data: {
      step_id: number;
      status: 'IP' | 'CD';
      description?: string;
      image_urls: string[];
      confirm_payment_trigger?: boolean;
    },
    extraHeaders?: Record<string, string>,
  ) => api.post<Record<string, unknown>>(`/orders/${orderId}/production-updates`, data, extraHeaders),
  /** Legacy shape — maps to new API (single image → array). */
  addProductionUpdate: (
    orderId: string | number,
    data: { step_id: number; description: string; image_url?: string },
  ) =>
    ordersApi.postProductionUpdate(orderId, {
      step_id: data.step_id,
      status: 'CD',
      description: data.description,
      image_urls: data.image_url ? [data.image_url] : [],
    }),
  /** @deprecated Prefer getProductionUpdatesBundle for typed bundle */
  listProductionUpdates: async (orderId: string | number) => {
    const b = await ordersApi.getProductionUpdatesBundle(orderId);
    return b.updates as unknown[];
  },
  getProductionUpdatesBundle: async (orderId: string | number) => {
    const raw = (await api.get<Record<string, unknown> | unknown[]>(
      `/orders/${orderId}/production-updates`,
    )) as Record<string, unknown> | unknown[];
    if (Array.isArray(raw)) {
      return {
        order_id: Number(orderId),
        order_status: '',
        updates: raw as Record<string, unknown>[],
      };
    }
    const updates = Array.isArray(raw.updates)
      ? (raw.updates as Record<string, unknown>[])
      : Array.isArray(raw.data)
        ? (raw.data as Record<string, unknown>[])
        : [];
    const template_preview = Array.isArray(raw.template_preview)
      ? (raw.template_preview as Record<string, unknown>[])
      : undefined;
    return {
      order_id: Number(raw.order_id ?? orderId),
      order_status: String(raw.order_status ?? raw.orderStatus ?? ''),
      updates,
      production_locked:
        raw.production_locked === true ? true : raw.production_locked === false ? false : undefined,
      lock_reason: raw.lock_reason != null ? String(raw.lock_reason) : undefined,
      lock_context: raw.lock_context,
      template_preview,
    };
  },
  /** GET /orders/:id/disputes — list disputes */
  listDisputes: (orderId: string | number) =>
    api.get<unknown[]>(`/orders/${orderId}/disputes`),
  /** POST /orders/:id/disputes — open a dispute */
  createDispute: (
    orderId: string | number,
    data: { reason: string; description: string; evidence_url?: string },
  ) => api.post<Record<string, unknown>>(`/orders/${orderId}/disputes`, data),
  /** GET /orders/:id/payment-schedules — list installments */
  listPaymentSchedules: (orderId: string | number) =>
    api.get<unknown[]>(`/orders/${orderId}/payment-schedules`),
  /** POST /orders/:id/payment-schedules — create installment */
  createPaymentSchedule: (
    orderId: string | number,
    data: { due_date: string; amount: number; description?: string },
  ) => api.post<Record<string, unknown>>(`/orders/${orderId}/payment-schedules`, data),
};

// ─── Disputes API ──────────────────────────────────────────────
export const disputesApi = {
  /** PATCH /disputes/:id — update status / resolution */
  update: (
    disputeId: string | number,
    data: { status?: string; resolution?: string; resolution_note?: string },
  ) => api.patch<Record<string, unknown>>(`/disputes/${disputeId}`, data),
};

// ─── Payment Schedules API ─────────────────────────────────────
export const paymentSchedulesApi = {
  /** PATCH /payment-schedules/:id — update status (PE → PD → OD) */
  update: (
    scheduleId: string | number,
    data: { status?: string; paid_date?: string; note?: string },
  ) => api.patch<Record<string, unknown>>(`/payment-schedules/${scheduleId}`, data),
};

export const messagesApi = {
  send: (data: MessagesSendBody) => api.post('/messages/', data),
  list: (referenceType: string, referenceId: string) =>
    api.get<unknown[]>(`/messages/?reference_type=${referenceType}&reference_id=${referenceId}`),
  listByConversation: (convId: number | string) =>
    api.get<unknown[]>(`/messages/?conv_id=${convId}`),
  threads: () => api.get<unknown[]>('/messages/threads'),
};

export const walletApi = {
  getMe: () => api.get<Record<string, unknown>>('/wallets/me'),
  transactions: () => api.get<unknown[]>('/wallets/me/transactions'),
  /** POST /wallets/topup — create top-up intent (returns PromptPay QR payload) */
  createTopup: (data: { amount: number; method?: string }) =>
    api.post<Record<string, unknown>>('/wallets/topup', data),
  /** GET /wallets/topup/:intent_id — check top-up status */
  getTopup: (intentId: string | number) =>
    api.get<Record<string, unknown>>(`/wallets/topup/${intentId}`),
  /** POST /wallets/topup/:intent_id/confirm — confirm payment after QR scanned */
  confirmTopup: (
    intentId: string | number,
    data?: { reference_code?: string; slip_url?: string },
  ) => api.post<Record<string, unknown>>(`/wallets/topup/${intentId}/confirm`, data),
  /** POST /wallets/withdraw — request withdrawal (factory) */
  requestWithdraw: (data: {
    amount: number;
    bank_account_id?: number;
    bank_name?: string;
    account_number?: string;
    account_name?: string;
  }) => api.post<Record<string, unknown>>('/wallets/withdraw', data),
  /** GET /wallets/withdraw — list withdrawal requests */
  listWithdrawals: () => api.get<unknown[]>('/wallets/withdraw'),
  /** PATCH /wallets/withdraw/:request_id/status — admin updates status */
  updateWithdrawStatus: (
    requestId: string | number,
    status: string,
    note?: string,
  ) =>
    api.patch<Record<string, unknown>>(
      `/wallets/withdraw/${requestId}/status`,
      note ? { status, note } : { status },
    ),
};

// ─── Settlements API ───────────────────────────────────────────
export const settlementsApi = {
  /** GET /settlements — list settlements (factory-scoped via JWT) */
  list: () => api.get<unknown[]>('/settlements'),
  /** POST /settlements — create settlement record */
  create: (data: {
    order_id: number;
    amount: number;
    fee?: number;
    note?: string;
  }) => api.post<Record<string, unknown>>('/settlements', data),
  /** GET /settlements/:id — settlement detail */
  get: (id: string | number) =>
    api.get<Record<string, unknown>>(`/settlements/${id}`),
  /** PATCH /settlements/:id/status — update settlement state */
  updateStatus: (id: string | number, status: string) =>
    api.patch<Record<string, unknown>>(`/settlements/${id}/status`, { status }),
};

// ─── Quotation Templates API ───────────────────────────────────
export const quotationTemplatesApi = {
  /** GET /quotation-templates — factory-scoped via JWT */
  list: () => api.get<unknown[]>('/quotation-templates'),
  /** POST /quotation-templates — create template */
  create: (data: {
    name: string;
    description?: string;
    payload: Record<string, unknown>;
  }) => api.post<Record<string, unknown>>('/quotation-templates', data),
  /** PATCH /quotation-templates/:id — update template */
  update: (
    templateId: string | number,
    data: Partial<{ name: string; description: string; payload: Record<string, unknown> }>,
  ) => api.patch<Record<string, unknown>>(`/quotation-templates/${templateId}`, data),
  /** DELETE /quotation-templates/:id — delete template */
  delete: (templateId: string | number) =>
    api.delete(`/quotation-templates/${templateId}`),
};

export const masterApi = {
  provinces: () => api.get<unknown[]>('/master/provinces'),
  districts: (provinceId: number) => api.get<unknown[]>(`/master/districts?province_id=${provinceId}`),
  subDistricts: (districtId: number) =>
    api.get<unknown[]>(`/master/sub-districts?district_id=${districtId}`),
  factoryTypes: () => api.get<unknown[]>('/master/factory-types'),
  productCategories: () => api.get<unknown[]>('/master/product-categories'),
  productionSteps: (factoryTypeId?: number) =>
    api.get<unknown[]>(
      factoryTypeId != null
        ? `/master/production-steps?factory_type_id=${factoryTypeId}`
        : '/master/production-steps',
    ),
  units: () => api.get<unknown[]>('/master/units'),
  shippingMethods: () => api.get<unknown[]>('/master/shipping-methods'),
  certificates: () => api.get<unknown[]>('/master/certificates'),
};

// ─── Showcases API ─────────────────────────────────────────────
/** GET /showcases — see docs/new_api_specs_for_fe.md §7 */
export const showcasesApi = {
  /**
   * @param type API code: `PD` | `PM` | `ID`; omit for all
   * @param factoryId optional `factory_id` query (Explore / filters)
   */
  list: (type?: 'PD' | 'PM' | 'ID' | string, factoryId?: string | number) => {
    const q = new URLSearchParams();
    if (type) q.set('type', String(type));
    if (factoryId != null && String(factoryId).trim() !== '') q.set('factory_id', String(factoryId));
    const qs = q.toString();
    return api.get<unknown[]>(`/showcases${qs ? `?${qs}` : ''}`);
  },
  /**
   * Extended filter for GET /showcases
   * Supports category/sub-category/status filters from FE handoff.
   */
  listFiltered: (params: {
    type?: 'PD' | 'PM' | 'ID' | string;
    factory_id?: string | number;
    status?: string;
    category_id?: number | string;
    sub_category_id?: number | string;
  }) => {
    const q = new URLSearchParams();
    if (params.type) q.set('type', String(params.type));
    if (params.factory_id != null && String(params.factory_id).trim() !== '') q.set('factory_id', String(params.factory_id));
    if (params.status) q.set('status', String(params.status));
    if (params.category_id != null && String(params.category_id).trim() !== '') q.set('category_id', String(params.category_id));
    if (params.sub_category_id != null && String(params.sub_category_id).trim() !== '') q.set('sub_category_id', String(params.sub_category_id));
    const qs = q.toString();
    return api.get<unknown[]>(`/showcases${qs ? `?${qs}` : ''}`);
  },
  /** GET /showcases/:id — detail with images, specs, sections */
  get: (showcaseId: number | string) =>
    api.get<Record<string, unknown>>(`/showcases/${showcaseId}`),
  /** GET /factories/:id/showcases — showcases by factory */
  listByFactory: (factoryId: number | string, type?: 'PD' | 'PM' | 'ID' | string) =>
    api.get<unknown[]>(
      `/factories/${factoryId}/showcases${type ? `?type=${encodeURIComponent(type)}` : ''}`,
    ),
  create: (data: {
    content_type: 'PD' | 'PM' | 'ID';
    title: string;
    excerpt?: string;
    content?: string;
    image_url?: string;
    category_id?: number;
    sub_category_id?: number;
    moq?: number;
    lead_time_days?: number;
    base_price?: number;
    promo_price?: number;
    start_date?: string;
    end_date?: string;
    linked_showcases?: number[];
    status?: string;
  }) => api.post<Record<string, unknown>>('/showcases', data),
  update: (showcaseId: number | string, data: Record<string, unknown>) =>
    api.patch<Record<string, unknown>>(`/showcases/${showcaseId}`, data),
  delete: (showcaseId: number | string) => api.delete(`/showcases/${showcaseId}`),
  /** Gallery images */
  listImages: (showcaseId: number | string) =>
    api.get<unknown[]>(`/showcases/${showcaseId}/images`),
  addImage: (showcaseId: number | string, data: { image_url: string; sort_order?: number; caption?: string }) =>
    api.post<Record<string, unknown>>(`/showcases/${showcaseId}/images`, data),
  /** PATCH /showcases/:id/images/:image_id — update caption / sort_order */
  updateImage: (
    showcaseId: number | string,
    imageId: number | string,
    data: Partial<{ caption: string; sort_order: number }>,
  ) => api.patch<Record<string, unknown>>(`/showcases/${showcaseId}/images/${imageId}`, data),
  deleteImage: (showcaseId: number | string, imageId: number | string) =>
    api.delete(`/showcases/${showcaseId}/images/${imageId}`),
  /** Specs (PD only) */
  listSpecs: (showcaseId: number | string) =>
    api.get<unknown[]>(`/showcases/${showcaseId}/specs`),
  replaceSpecs: (showcaseId: number | string, specs: { spec_key: string; spec_value: string; sort_order?: number }[]) =>
    api.put<Record<string, unknown>>(`/showcases/${showcaseId}/specs`, { specs }),
  /** Sections + items */
  listSections: (showcaseId: number | string) =>
    api.get<Record<string, unknown>>(`/showcases/${showcaseId}/sections`),
  replaceSections: (showcaseId: number | string, sections: unknown[]) =>
    api.put<Record<string, unknown>>(`/showcases/${showcaseId}/sections`, { sections }),
  /** DELETE /showcases/:id/sections/:section_id — delete one section */
  deleteSection: (showcaseId: number | string, sectionId: number | string) =>
    api.delete(`/showcases/${showcaseId}/sections/${sectionId}`),
  /** POST /showcases/:id/view — increment view count */
  incrementView: (showcaseId: number | string) =>
    api.post<Record<string, unknown>>(`/showcases/${showcaseId}/view`),
  /** GET /showcases/:id/analytics — views / likes / conversion stats */
  getAnalytics: (showcaseId: number | string) =>
    api.get<Record<string, unknown>>(`/showcases/${showcaseId}/analytics`),
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
  shareRfq: (convId: number | string, rfqId: number) =>
    api.post<Record<string, unknown>>(`/conversations/${convId}/share-rfq`, { rfq_id: rfqId }),
  /** PATCH /conversations/:id/read — typically 204 No Content */
  markAsRead: (convId: number | string) => api.patch<void>(`/conversations/${convId}/read`),
};

// ─── Notifications API ─────────────────────────────────────────
export const notificationsApi = {
  list: (params?: { page?: number; limit?: number; unread?: boolean }) => {
    if (!params) return api.get<unknown[]>('/notifications');
    const qs = new URLSearchParams();
    if (params.page != null) qs.set('page', String(params.page));
    if (params.limit != null) qs.set('limit', String(params.limit));
    if (params.unread != null) qs.set('unread', String(params.unread));
    const q = qs.toString();
    return api.get<Record<string, unknown>>(`/notifications${q ? `?${q}` : ''}`);
  },
  unreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),
  markAsRead: (notiId: number | string) =>
    api.patch<Record<string, unknown>>(`/notifications/${notiId}/read`),
  markAllAsRead: () => api.put<{ updated: number }>('/notifications/read-all'),
  delete: (notiId: number | string) => api.delete(`/notifications/${notiId}`),
};

// ─── Profile Activity API ──────────────────────────────────────
export const profileApi = {
  get: () => api.get<Record<string, unknown>>('/profile'),
  update: (body: Record<string, unknown>) => api.put<Record<string, unknown>>('/profile', body),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.postForm<{ avatar_url: string }>('/profile/avatar', formData);
  },
  changePassword: (body: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }) => api.put<Record<string, unknown>>('/profile/change-password', body),
  summary: () => api.get<Record<string, unknown>>('/profile/summary'),
  transactions: (params?: { page?: number; limit?: number; type?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page != null) qs.set('page', String(params.page));
    if (params?.limit != null) qs.set('limit', String(params.limit));
    if (params?.type) qs.set('type', params.type);
    if (params?.status) qs.set('status', params.status);
    const q = qs.toString();
    return api.get<Record<string, unknown>>(`/profile/transactions${q ? `?${q}` : ''}`);
  },
  myReviews: (params?: { page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page != null) qs.set('page', String(params.page));
    if (params?.limit != null) qs.set('limit', String(params.limit));
    const q = qs.toString();
    return api.get<Record<string, unknown>>(`/profile/reviews${q ? `?${q}` : ''}`);
  },
  receivedReviews: (params?: { page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page != null) qs.set('page', String(params.page));
    if (params?.limit != null) qs.set('limit', String(params.limit));
    const q = qs.toString();
    return api.get<Record<string, unknown>>(`/profile/reviews/received${q ? `?${q}` : ''}`);
  },
  notificationPreferences: () =>
    api.get<Record<string, unknown>>('/profile/notification-preferences'),
  updateNotificationPreferences: (body: Record<string, unknown>) =>
    api.put<Record<string, unknown>>('/profile/notification-preferences', body),
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
  summaryByFactory: (factoryId: number | string) =>
    api.get<Record<string, unknown>>(`/factories/${factoryId}/reviews/summary`),
  create: (factoryId: number | string, data: { rating: number; comment: string; image_urls?: string[] }) =>
    api.post<Record<string, unknown>>(`/factories/${factoryId}/reviews`, data),
  reply: (reviewId: number | string, data: { reply: string }) =>
    api.post<Record<string, unknown>>(`/reviews/${reviewId}/reply`, data),
  update: (
    reviewId: number | string,
    data: { rating: number; comment: string; image_urls?: string[] },
  ) => api.put<Record<string, unknown>>(`/reviews/${reviewId}`, data),
  delete: (reviewId: number | string) => api.delete(`/reviews/${reviewId}`),
};

// ─── Certificates API ──────────────────────────────────────────
export const certificatesApi = {
  listByFactory: (factoryId: number | string) =>
    api.get<unknown[]>(`/factories/${factoryId}/certificates`),
  create: (
    factoryId: number | string,
    data: { cert_id: number; document_url: string; expire_date?: string; cert_number?: string },
  ) => api.post<Record<string, unknown>>(`/factories/${factoryId}/certificates`, data),
  delete: (factoryId: number | string, certId: number | string) =>
    api.delete(`/factories/${factoryId}/certificates/${certId}`),
  update: (factoryId: number | string, certId: number | string, data: Record<string, unknown>) =>
    api.patch<Record<string, unknown>>(`/factories/${factoryId}/certificates/${certId}`, data),
};

// ─── Quotations API ────────────────────────────────────────────
export const quotationsApi = {
  get: (quotationId: number | string) =>
    api.get<Record<string, unknown>>(`/quotations/${quotationId}`),
  /** ดึง quotation ทั้งหมดของ factory ที่ login (Phase 1.5) */
  listMine: () => api.get<unknown[]>('/quotations/me'),
  /** ดึงประวัติการแก้ไข quotation (Phase 1.5 — ต้องมี quotation_history table) */
  history: (quotationId: number | string) =>
    api.get<unknown[]>(`/quotations/${quotationId}/history`),
  updateStatus: (quotationId: number | string, status: string) =>
    api.patch<Record<string, unknown>>(`/quotations/${quotationId}/status`, { status }),
  /** Partial update — ใช้เมื่อ backend รองรับ PATCH body (เช่น แก้ราคาก่อนลูกค้ารับ) */
  patch: (quotationId: number | string, data: Record<string, unknown>) =>
    api.patch<Record<string, unknown>>(`/quotations/${quotationId}`, data),
  accept: (quotationId: number | string) =>
    api.post<Record<string, unknown>>(`/quotations/${quotationId}/accept`),
  reject: (quotationId: number | string, reason?: string) =>
    api.post<Record<string, unknown>>(`/quotations/${quotationId}/reject`, reason ? { reason } : {}),
  delete: (quotationId: number | string) => api.delete(`/quotations/${quotationId}`),
};

// ─── Platform Config API (admin) ───────────────────────────────
export interface PlatformConfig {
  config_id: number;
  default_commission_rate: number;
  promo_commission_rate?: number | null;
  promo_start_at?: string | null;
  promo_end_at?: string | null;
  promo_label?: string | null;
  vat_rate: number;
  currency_code: string;
  effective_from: string;
  effective_to?: string | null;
}

export const platformConfigApi = {
  getActive: () => api.get<PlatformConfig>('/admin/platform-config'),
  create: (body: Partial<PlatformConfig>) =>
    api.post<PlatformConfig>('/admin/platform-config', body),
  history: () => api.get<PlatformConfig[]>('/admin/platform-config/history'),
};

function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    search.set(k, String(v));
  });
  const s = search.toString();
  return s ? `?${s}` : '';
}

export interface AdminDashboardSummary {
  gross_order_value?: number;
  vat_collected?: number;
  platform_commission?: number;
  total_orders?: number;
  total_rfqs?: number;
  pending_factory_approvals?: number;
  [key: string]: unknown;
}

export interface AdminFactoryRow {
  factory_id: number;
  factory_name?: string;
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  approval_status?: string;
  is_verified?: boolean;
  submitted_at?: string;
  registered_at?: string;
  created_at?: string;
  province_name?: string;
  business_type_name?: string;
  rejection_reason?: string;
  [key: string]: unknown;
}

export interface AdminRfqRow {
  rfq_id: number;
  title?: string;
  user_id?: number;
  customer_name?: string;
  customer_email?: string;
  category_name?: string;
  sub_category_name?: string;
  quantity?: number;
  status?: string;
  quotation_count?: number;
  target_unit_price?: number;
  created_at?: string;
  [key: string]: unknown;
}

export interface AdminOrderRow {
  order_id: number;
  quote_id?: number;
  rfq_id?: number;
  rfq_title?: string;
  factory_id?: number;
  factory_name?: string;
  user_id?: number;
  customer_name?: string;
  status?: string;
  total_amount?: number;
  platform_commission_amount?: number;
  vat_amount?: number;
  factory_net_receivable?: number;
  payment_type?: string;
  estimated_delivery?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface AdminCommissionRule {
  rule_id: number;
  factory_id: number;
  factory_name?: string;
  commission_rate: number;
  effective_from?: string;
  effective_to?: string | null;
  [key: string]: unknown;
}

export interface AdminCommissionExemption {
  exemption_id: number;
  factory_id: number;
  factory_name?: string;
  reason?: string;
  expires_at?: string | null;
  added_by?: number | string;
  revoked_at?: string | null;
  [key: string]: unknown;
}

export const adminApi = {
  dashboardSummary: () =>
    api.get<AdminDashboardSummary>('/admin/dashboard/summary'),
  dashboardRevenueChart: () =>
    api.get<unknown[]>('/admin/dashboard/revenue-chart'),
  dashboardTopFactories: () =>
    api.get<unknown[]>('/admin/dashboard/top-factories'),

  listFactories: (params?: {
    approval_status?: string;
    search?: string;
    page?: number;
    page_size?: number;
    is_verified?: boolean;
  }) =>
    api.get<AdminFactoryRow[]>(
      `/admin/factories${qs({
        approval_status: params?.approval_status,
        search: params?.search,
        page: params?.page,
        page_size: params?.page_size,
        is_verified: params?.is_verified,
      })}`,
    ),
  getFactory: (factoryId: number | string) =>
    api.get<Record<string, unknown>>(`/admin/factories/${factoryId}`),
  approveFactory: (factoryId: number | string) =>
    api.post<Record<string, unknown>>(`/admin/factories/${factoryId}/approve`),
  rejectFactory: (factoryId: number | string, reason: string) =>
    api.post<Record<string, unknown>>(`/admin/factories/${factoryId}/reject`, { reason }),
  suspendFactory: (factoryId: number | string, reason?: string) =>
    api.post<Record<string, unknown>>(`/admin/factories/${factoryId}/suspend`, reason ? { reason } : {}),
  unsuspendFactory: (factoryId: number | string) =>
    api.post<Record<string, unknown>>(`/admin/factories/${factoryId}/unsuspend`),
  updateFactoryVerification: (factoryId: number | string, isVerified: boolean) =>
    api.patch<Record<string, unknown>>(`/admin/factories/${factoryId}/verification`, {
      is_verified: isVerified,
    }),

  listRfqs: (params?: {
    status?: string;
    user_id?: number;
    category_id?: number;
    date_from?: string;
    date_to?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }) =>
    api.get<AdminRfqRow[]>(
      `/admin/rfqs${qs({
        status: params?.status,
        user_id: params?.user_id,
        category_id: params?.category_id,
        date_from: params?.date_from,
        date_to: params?.date_to,
        search: params?.search,
        page: params?.page,
        page_size: params?.page_size,
      })}`,
    ),
  getRfq: (rfqId: number | string) =>
    api.get<Record<string, unknown>>(`/admin/rfqs/${rfqId}`),
  updateRfqStatus: (rfqId: number | string, status: string) =>
    api.patch<Record<string, unknown>>(`/admin/rfqs/${rfqId}/status`, { status }),

  listOrders: (params?: {
    status?: string;
    factory_id?: number;
    user_id?: number;
    date_from?: string;
    date_to?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }) =>
    api.get<AdminOrderRow[]>(
      `/admin/orders${qs({
        status: params?.status,
        factory_id: params?.factory_id,
        user_id: params?.user_id,
        date_from: params?.date_from,
        date_to: params?.date_to,
        search: params?.search,
        page: params?.page,
        page_size: params?.page_size,
      })}`,
    ),
  getOrder: (orderId: number | string) =>
    api.get<Record<string, unknown>>(`/admin/orders/${orderId}`),
  updateOrderStatus: (orderId: number | string, status: string) =>
    api.patch<Record<string, unknown>>(`/admin/orders/${orderId}/status`, { status }),

  listCommissionRules: (params?: { factory_id?: number; active_only?: boolean }) =>
    api.get<AdminCommissionRule[]>(
      `/admin/commission-rules${qs({
        factory_id: params?.factory_id,
        active_only: params?.active_only,
      })}`,
    ),
  createCommissionRule: (body: {
    factory_id: number;
    commission_rate: number;
    effective_from?: string;
  }) => api.post<AdminCommissionRule>('/admin/commission-rules', body),
  deleteCommissionRule: (ruleId: number | string) =>
    api.delete(`/admin/commission-rules/${ruleId}`),

  listCommissionExemptions: (params?: { active_only?: boolean }) =>
    api.get<AdminCommissionExemption[]>(
      `/admin/commission-exemptions${qs({
        active_only: params?.active_only,
      })}`,
    ),
  createCommissionExemption: (body: {
    factory_id: number;
    reason: string;
    expires_at?: string;
  }) => api.post<AdminCommissionExemption>('/admin/commission-exemptions', body),
  deleteCommissionExemption: (exemptionId: number | string) =>
    api.delete(`/admin/commission-exemptions/${exemptionId}`),
};

// ─── Quotation Builder API (extended) ──────────────────────────
export interface QuotationItem {
  item_no: number;
  description: string;
  qty: number;
  unit?: string;
  unit_price: number;
  discount_pct: number;
  line_total: number;
  note?: string;
}

export interface QuotationBreakdown {
  subtotal: number;
  discount_amount: number;
  shipping_cost: number;
  packaging_cost: number;
  tooling_mold_cost: number;
  pre_vat_base: number;
  vat_rate: number;
  vat_amount: number;
  grand_total: number;
  platform_commission_rate: number;
  platform_commission_amount: number;
  factory_net_receivable: number;
  platform_config_id: number;
}

export interface QuotationCreateInput {
  rfq_id: number;
  items: Omit<QuotationItem, 'line_total'>[];
  discount_amount: number;
  shipping_cost: number;
  shipping_method?: string;
  packaging_cost: number;
  tooling_mold_cost: number;
  lead_time_days?: number;
  production_start_date?: string;
  delivery_date?: string;
  incoterms?: 'EXW' | 'FOB' | 'CIF' | 'DDP';
  payment_terms?: '50_50' | '30_70' | 'net_30' | 'lc_at_sight';
  validity_days?: number;
  warranty_period_months?: number;
}

export interface RFQCreateInput {
  title: string;
  description: string;
  category_id: number;
  sub_category_id?: number;
  qty: number;
  unit: string;
  unit_id?: number;
  material_grade?: string;
  tolerance?: string;
  color_finish?: string;
  dimension_spec?: { L: number; W: number; H: number; unit: 'mm' | 'cm' | 'm' };
  weight_target_g?: number;
  packaging_spec?: string;
  target_unit_price?: number;
  target_lead_time_days?: number;
  required_delivery_date?: string;
  incoterms?: string;
  payment_terms?: string;
  address_id?: number;          // BE field name (required by API)
  delivery_address_id?: number; // FE draft alias — remapped to address_id before send
  shipping_method_id?: number;  // required — factory ต้องเห็นวิธีจัดส่งเพื่อออกใบเสนอราคา
  certifications_required?: string[];
  sample_required?: boolean;
  sample_qty?: number;
  inspection_type?: 'self' | 'third_party' | 'buyer_onsite';
  tech_drawing_url?: string;
  reference_images?: string[];
  spec_sheet_url?: string;
}

export const quotationApi = {
  preview: (body: Partial<QuotationCreateInput>) =>
    api.post<QuotationBreakdown>('/quotations/preview', body),
  create: (body: QuotationCreateInput) =>
    api.post<Record<string, unknown>>('/quotations', body),
  revision: (id: number, body: QuotationCreateInput) =>
    api.post<Record<string, unknown>>(`/quotations/${id}/revision`, body),
  get: (id: number) => api.get<Record<string, unknown>>(`/quotations/${id}`),
  history: (id: number) => api.get<Record<string, unknown>[]>(`/quotations/${id}/history`),
  accept: (id: number) => api.post(`/quotations/${id}/accept`),
  reject: (id: number, reason?: string) =>
    api.post(`/quotations/${id}/reject`, { reason }),
  requestRevision: (
    id: number,
    body: { reason: string; fields?: string[] },
  ) => api.post(`/quotations/${id}/revision-request`, body),
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
  delete: (addressId: number | string) => api.delete(`/addresses/${addressId}`),
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
  reject: (updateId: number | string, data: { rejected_reason: string }) =>
    api.patch<Record<string, unknown>>(`/production-updates/${updateId}/reject`, data),
};

/** Global production step template (6 steps) — GET /production/steps */
export const productionApi = {
  listSteps: () => api.get<Record<string, unknown>>('/production/steps'),
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
