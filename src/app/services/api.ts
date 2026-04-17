/**
 * API Client — ใช้ fetch wrapper พร้อม JWT token management
 * Base path ตาม docs/API_SPEC.md: .../api/v1
 */

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
  post: <T>(endpoint: string, body?: unknown) => request<T>(endpoint, { method: 'POST', body }),
  patch: <T>(endpoint: string, body?: unknown) => request<T>(endpoint, { method: 'PATCH', body }),
  put: <T>(endpoint: string, body?: unknown) => request<T>(endpoint, { method: 'PUT', body }),
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
    api.patch<Record<string, unknown>>(`/factories/${id}`, data),
  delete: (id: string | number) => api.delete(`/factories/${id}`),
  /** GET /factories/me — own factory profile (JWT role=FT) */
  getMe: () => api.get<Record<string, unknown>>('/factories/me'),
  /** GET /factories/me/dashboard — dashboard counts + recent items */
  getDashboard: () => api.get<Record<string, unknown>>('/factories/me/dashboard'),
  /** GET /factories/me/analytics — revenue, orders, ratings */
  getAnalytics: () => api.get<Record<string, unknown>>('/factories/me/analytics'),
  setCategories: (factoryId: string | number, categoryIds: number[]) =>
    api.post(`/factories/${factoryId}/categories`, { category_ids: categoryIds }),
  setSubCategories: (factoryId: string | number, subCategoryIds: number[]) =>
    api.post(`/factories/${factoryId}/sub-categories`, { sub_category_ids: subCategoryIds }),
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
    return api.get<unknown[]>(`/rfqs${q}`);
  },
  /** RFQ ที่ match หมวดของโรงงานตาม JWT */
  matching: () => api.get<unknown[]>('/rfqs/matching'),
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
  list: (status?: string) => {
    const q = status != null && status !== '' ? `?status=${encodeURIComponent(status)}` : '';
    return api.get<unknown[]>(`/orders${q}`);
  },
  get: (id: string | number) => api.get<Record<string, unknown>>(`/orders/${id}`),
  create: (quoteId: number) => api.post<Record<string, unknown>>('/orders/', { quote_id: quoteId }),
  updateStatus: (id: string | number, status: string) =>
    api.patch(`/orders/${id}/status`, { status }),
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
  addProductionUpdate: (
    orderId: string | number,
    data: { step_id: number; description: string; image_url?: string },
  ) => api.post(`/orders/${orderId}/production-updates`, data),
  listProductionUpdates: (orderId: string | number) =>
    api.get<unknown[]>(`/orders/${orderId}/production-updates`),
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
  /** GET /showcases/:id — detail with images, specs, sections */
  get: (showcaseId: number | string) =>
    api.get<Record<string, unknown>>(`/showcases/${showcaseId}`),
  /** GET /factories/:id/showcases — showcases by factory */
  listByFactory: (factoryId: number | string, type?: 'PD' | 'PM' | 'ID' | string) =>
    api.get<unknown[]>(
      `/factories/${factoryId}/showcases${type ? `?type=${encodeURIComponent(type)}` : ''}`,
    ),
  create: (data: {
    content_type: string;
    title: string;
    excerpt?: string;
    description?: string;
    image_url?: string;
    category_id?: number;
    sub_category_id?: number;
    min_order?: number;
    lead_time_days?: number;
    price_range?: string;
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
};

// ─── Notifications API ─────────────────────────────────────────
export const notificationsApi = {
  list: () => api.get<unknown[]>('/notifications'),
  markAsRead: (notiId: number | string) =>
    api.patch<Record<string, unknown>>(`/notifications/${notiId}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
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
  reply: (reviewId: number | string, data: { reply: string }) =>
    api.post<Record<string, unknown>>(`/reviews/${reviewId}/reply`, data),
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
  delete: (quotationId: number | string) => api.delete(`/quotations/${quotationId}`),
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
