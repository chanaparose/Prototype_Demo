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
};

export const factoryRfqsApi = {
  getBoard: () =>
    httpClient.get<{
      pending: IRfqListItem[];
      active: IRfqListItem[];
      closed: IRfqListItem[];
    }>('/rfqs/factory/board'),
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
};

export const quotationApi = {
  preview: (data: Partial<IQuotationCreateRequest>) =>
    httpClient.post<IQuotationBreakdown>('/quotations/preview', data),

  getDetail: (quoteId: string | number) =>
    httpClient.get<IQuotationResponse & { details?: unknown }>(`/quotations/${quoteId}/detail`),

  getHistory: (quoteId: string | number) =>
    httpClient.get<IQuotationHistoryEntry[]>(`/quotations/${quoteId}/history`),
};
