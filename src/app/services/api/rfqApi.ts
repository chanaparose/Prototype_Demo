import { httpClient } from '@/services/api/httpClient';
import type {
  IRfqCreateRequest,
  IRfqDetailResponse,
  IRfqListItem,
  IQuotationBreakdown,
  IQuotationCreateRequest,
  IQuotationHistoryEntry,
  IQuotationResponse,
} from '@/services/api/types/rfq.types';

export const rfqsApi = {
  list: () => httpClient.get<IRfqListItem[]>('/rfqs'),

  get: (id: string | number) => httpClient.get<IRfqDetailResponse>(`/rfqs/${id}`),

  create: (data: IRfqCreateRequest) => httpClient.post<IRfqDetailResponse>('/rfqs', data),

  update: (id: string | number, data: Partial<IRfqCreateRequest>) =>
    httpClient.patch<IRfqDetailResponse>(`/rfqs/${id}`, data),

  delete: (id: string | number) => httpClient.delete<void>(`/rfqs/${id}`),

  getQuotations: (rfqId: string | number) =>
    httpClient.get<IQuotationResponse[]>(`/rfqs/${rfqId}/quotations`),

  getQuotationHistory: (rfqId: string | number) =>
    httpClient.get<IQuotationHistoryEntry[]>(`/rfqs/${rfqId}/quotation-history`),

  getWithImages: (id: string | number) =>
    httpClient.get<IRfqDetailResponse & { images: Array<{ image_id: string; url: string }> }>(
      `/rfqs/${id}/with-images`,
    ),

  previewFactories: (params: { kind: string; category_id: number; sub_category_id?: number }) => {
    const qs = new URLSearchParams({ kind: params.kind, category_id: String(params.category_id) });
    if (params.sub_category_id != null) qs.set('sub_category_id', String(params.sub_category_id));
    return httpClient.get<Record<string, unknown>>(`/rfqs/preview-factories?${qs.toString()}`);
  },

  matching: (params?: { kind?: string; show_dismissed?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.kind) qs.set('kind', params.kind);
    if (params?.show_dismissed) qs.set('show_dismissed', 'true');
    const query = qs.toString();
    return httpClient.get<Record<string, unknown>[]>(`/rfqs/matching${query ? `?${query}` : ''}`);
  },

  close: (id: string | number) => httpClient.patch<{ message: string }>(`/rfqs/${id}/close`, {}),

  cancel: (id: string | number) => httpClient.patch<{ message: string }>(`/rfqs/${id}/cancel`, {}),
};

export const factoryRfqsApi = {
  getBoard: () =>
    httpClient.get<{
      pending: IRfqListItem[];
      active: IRfqListItem[];
      closed: IRfqListItem[];
    }>('/rfqs/factory/board'),

  getRFQBoard: (params?: { kind?: string; show_dismissed?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.kind) qs.set('kind', params.kind);
    if (params?.show_dismissed) qs.set('show_dismissed', 'true');
    const query = qs.toString();
    return httpClient.get<{ rfqs: Record<string, unknown>[]; factory_category_ids: number[] }>(
      `/factory/rfq-board${query ? `?${query}` : ''}`,
    );
  },
};

export const quotationsApi = {
  create: (rfqId: string | number, data: Record<string, unknown>) =>
    httpClient.post<IQuotationResponse>(`/quotations?rfq_id=${rfqId}`, data),

  update: (quoteId: string | number, data: Record<string, unknown>) =>
    httpClient.patch<IQuotationResponse>(`/quotations/${quoteId}`, data),

  get: (quoteId: string | number) => httpClient.get<IQuotationResponse>(`/quotations/${quoteId}`),

  delete: (quoteId: string | number) => httpClient.delete<void>(`/quotations/${quoteId}`),

  list: (rfqId?: string | number) => {
    const endpoint = rfqId ? `/quotations?rfq_id=${rfqId}` : '/quotations';
    return httpClient.get<IQuotationResponse[]>(endpoint);
  },

  listMine: () => httpClient.get<IQuotationResponse[]>('/quotations'),
};

export const quotationApi = {
  preview: (data: Partial<IQuotationCreateRequest>) =>
    httpClient.post<IQuotationBreakdown>('/quotations/preview', data),

  getDetail: (quoteId: string | number) =>
    httpClient.get<IQuotationResponse & { details?: unknown }>(`/quotations/${quoteId}/detail`),

  getHistory: (quoteId: string | number) =>
    httpClient.get<IQuotationHistoryEntry[]>(`/quotations/${quoteId}/history`),
};
