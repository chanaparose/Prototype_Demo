import { httpClient } from '@/services/api/httpClient';
import {
  type IFactoryAnalyticsResponse,
  type IFactoryBaseResponse,
  type IFactoryDashboardResponse,
  type IFactoryProfileResponse,
  type IFactoryPublicDetailResponse,
  type IFactoryWithDetailsResponse,
} from '@/services/api/types/factory.types';
import type {
  IBankAccountResponse,
  ICommissionInvoiceResponse,
  ICommissionInvoiceItemResponse,
} from '@/services/api/types/admin.types';

export const factoriesApi = {
  list: (scope?: 'PD' | 'MT') => {
    const url = scope ? `/factories?scope=${scope}` : '/factories';
    return httpClient.get<IFactoryBaseResponse[]>(url);
  },

  /** ค้นหาโรงงานตามชื่อ — ใช้ใน RFQ targeting autocomplete */
  search: (q: string, scope?: 'PD' | 'MT') => {
    const params = new URLSearchParams({ search: q.trim() });
    if (scope) params.set('scope', scope);
    return httpClient.get<IFactoryBaseResponse[]>(`/factories?${params.toString()}`);
  },

  get: (id: string | number) => httpClient.get<IFactoryWithDetailsResponse>(`/factories/${id}`),

  create: (data: IFactoryProfileResponse) =>
    httpClient.post<IFactoryBaseResponse>('/factories', data),

  update: (id: string | number, data: Partial<IFactoryProfileResponse>) =>
    httpClient.put<IFactoryBaseResponse>(`/factories/${id}`, data),

  patch: (id: string | number, data: Partial<IFactoryProfileResponse>) =>
    httpClient.patch<IFactoryBaseResponse>(`/factories/${id}`, data),

  delete: (id: string | number) => httpClient.delete<void>(`/factories/${id}`),

  getMe: () => httpClient.get<IFactoryPublicDetailResponse>('/factories/me'),
  getProfileInit: () =>
    httpClient.get<{
      factory: Record<string, unknown>;
      factory_types?: Record<string, unknown>[];
      lbi_categories?: Record<string, unknown>[];
      addresses?: Record<string, unknown>[];
      certificate_types?: Record<string, unknown>[];
      sub_categories?: Record<string, unknown>[];
    }>('/factories/me/profile-init'),

  getDashboard: () => httpClient.get<IFactoryDashboardResponse>('/factories/me/dashboard'),

  getAnalytics: () => httpClient.get<IFactoryAnalyticsResponse>('/factories/me/analytics'),

  /** Single-endpoint replacement for dashboard + analytics + orders + quotations + matching RFQs + wallet. */
  getPortal: () => httpClient.get<Record<string, unknown>>('/factories/me/portal'),

  saveProfile: (
    factoryId: string | number,
    data: {
      factory_name: string;
      tax_id?: string;
      description?: string;
      factory_type_id?: number;
      lead_time_desc?: string;
      image_url?: string;
      background_image_url?: string;
      category_ids: number[];
      sub_category_ids: number[];
    },
  ) => httpClient.put<void>(`/factories/${factoryId}/profile`, data),

  setCategories: (factoryId: string | number, categoryIds: number[]) =>
    httpClient.put<void>(`/factories/${factoryId}/categories`, { category_ids: categoryIds }),

  setSubCategories: (factoryId: string | number, subCategoryIds: number[]) =>
    httpClient.put<void>(`/factories/${factoryId}/sub-categories`, { sub_category_ids: subCategoryIds }),

  getCategories: (factoryId: string | number) =>
    httpClient.get<{ data: { category_id: number; name: string }[]; total: number }>(
      `/factories/${factoryId}/categories`,
    ),

  getSubCategories: (factoryId: string | number) =>
    httpClient.get<{
      data: { sub_category_id: number; category_id: number; name: string }[];
      total: number;
    }>(`/factories/${factoryId}/sub-categories`),

  removeCategory: (factoryId: string | number, categoryId: string | number) =>
    httpClient.delete<void>(`/factories/${factoryId}/categories/${categoryId}`),

  removeSubCategory: (factoryId: string | number, subCategoryId: string | number) =>
    httpClient.delete<void>(`/factories/${factoryId}/sub-categories/${subCategoryId}`),
};

export const showcasesApi = {
  list: (factoryId?: string | number) => {
    const endpoint = factoryId ? `/showcases?factory_id=${factoryId}` : '/showcases';
    return httpClient.get<unknown[]>(endpoint);
  },

  listFiltered: (params: {
    types?: string[];
    type?: string;
    sub_category_id?: number;
    category_id?: number;
    limit?: number;
    exclude?: string | number;
  }) => {
    const p = new URLSearchParams();
    if (params.types?.length) p.set('types', params.types.join(','));
    else if (params.type) p.set('type', params.type);
    if (params.sub_category_id != null) p.set('sub_category_id', String(params.sub_category_id));
    if (params.category_id != null) p.set('category_id', String(params.category_id));
    if (params.limit != null) p.set('limit', String(params.limit));
    if (params.exclude != null) p.set('exclude', String(params.exclude));
    const qs = p.toString();
    return httpClient.get<unknown>(`/showcases${qs ? `?${qs}` : ''}`);
  },

  listByFactory: (factoryId: string | number, contentType?: string) => {
    const params = new URLSearchParams({ factory_id: String(factoryId) });
    if (contentType) params.set('content_type', contentType);
    const query = params.toString();
    return httpClient.get<unknown[]>(`/showcases${query ? `?${query}` : ''}`);
  },

  get: (id: string | number) => httpClient.get<Record<string, unknown>>(`/showcases/${id}`),

  create: (data: Record<string, unknown>) =>
    httpClient.post<Record<string, unknown>>('/showcases', data),

  update: (id: string | number, data: Record<string, unknown>) =>
    httpClient.put<Record<string, unknown>>(`/showcases/${id}`, data),

  patch: (id: string | number, data: Partial<Record<string, unknown>>) =>
    httpClient.patch<Record<string, unknown>>(`/showcases/${id}`, data),

  delete: (id: string | number) => httpClient.delete<void>(`/showcases/${id}`),

  getWithDetails: (id: string | number) =>
    httpClient.get<Record<string, unknown>>(`/showcases/${id}/with-details`),

  uploadImages: (id: string | number, formData: FormData) =>
    httpClient.postForm<Record<string, unknown>>(`/showcases/${id}/upload-images`, formData),

  listImages: (id: string | number) =>
    httpClient.get<Record<string, unknown>[]>(`/showcases/${id}/images`),

  addImage: (id: string | number, data: { image_url: string; sort_order?: number }) =>
    httpClient.post<Record<string, unknown>>(`/showcases/${id}/images`, data),

  updateImage: (
    id: string | number,
    imageId: string | number,
    data: { sort_order?: number; caption?: string },
  ) => httpClient.patch<Record<string, unknown>>(`/showcases/${id}/images/${imageId}`, data),

  deleteImage: (id: string | number, imageId: string | number) =>
    httpClient.delete<void>(`/showcases/${id}/images/${imageId}`),

  incrementView: (id: string | number) =>
    httpClient.post<void>(`/showcases/${id}/view`, {}).catch(() => {}),
};

// ─── Bank Account API (F4) ──────────────────────────────────────────────────

export const bankAccountApi = {
  list: () =>
    httpClient.get<{ accounts: IBankAccountResponse[] }>('/factories/me/bank-accounts'),

  create: (data: { bank_name: string; account_number: string; account_name: string; is_default?: boolean }) =>
    httpClient.post<IBankAccountResponse>('/factories/me/bank-accounts', data),

  update: (accountId: number, data: Partial<{ bank_name: string; account_number: string; account_name: string; is_default: boolean }>) =>
    httpClient.patch<IBankAccountResponse>(`/factories/me/bank-accounts/${accountId}`, data),

  delete: (accountId: number) =>
    httpClient.delete<void>(`/factories/me/bank-accounts/${accountId}`),

  getPublicDefault: (factoryId: number) =>
    httpClient.get<IBankAccountResponse>(`/factories/${factoryId}/bank-account`),
};

// ─── Factory Invoice API (F6) ───────────────────────────────────────────────

export const factoryInvoiceApi = {
  list: () =>
    httpClient.get<{ invoices: ICommissionInvoiceResponse[]; total: number }>(
      '/factories/me/invoices',
    ),

  get: (invoiceId: number) =>
    httpClient.get<{ invoice: ICommissionInvoiceResponse; items: ICommissionInvoiceItemResponse[] }>(
      `/factories/me/invoices/${invoiceId}`,
    ),

  attachSlip: (invoiceId: number, formData: FormData) =>
    httpClient.postForm<ICommissionInvoiceResponse>(
      `/factories/me/invoices/${invoiceId}/slip`,
      formData,
    ),
};

export const mediaApi = {
  uploadImage: (formData: FormData) =>
    httpClient.postForm<{
      image_id: string;
      url: string;
    }>('/media/upload', formData),

  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return mediaApi.uploadImage(formData);
  },

  deleteImage: (imageId: string) => httpClient.delete<void>(`/media/${imageId}`),
};
