/**
 * RFQ API — Request for Quote management
 */

import { httpClient } from '@/services/api/httpClient';
import type {
  RfqListItem,
  RfqDetailResponse,
  RfqCreatePayload,
  QuotationRow,
  QuotationHistoryEntry,
} from '@/services/api/types';

export const rfqsApi = {
  list: () => httpClient.get<RfqListItem[]>('/rfqs'),

  get: (id: string | number) => httpClient.get<RfqDetailResponse>(`/rfqs/${id}`),

  create: (data: RfqCreatePayload) => httpClient.post<RfqDetailResponse>('/rfqs', data),

  update: (id: string | number, data: Partial<RfqCreatePayload>) =>
    httpClient.patch<RfqDetailResponse>(`/rfqs/${id}`, data),

  delete: (id: string | number) => httpClient.delete<void>(`/rfqs/${id}`),

  /** Get quotations for an RFQ */
  getQuotations: (rfqId: string | number) =>
    httpClient.get<QuotationRow[]>(`/rfqs/${rfqId}/quotations`),

  /** Get quotation history for an RFQ */
  getQuotationHistory: (rfqId: string | number) =>
    httpClient.get<QuotationHistoryEntry[]>(`/rfqs/${rfqId}/quotation-history`),

  /** Get with images */
  getWithImages: (id: string | number) =>
    httpClient.get<RfqDetailResponse & { images: Array<{ image_id: string; url: string }> }>(
      `/rfqs/${id}/with-images`,
    ),
};

export const factoryRfqsApi = {
  /** GET /rfqs/factory/board — factory's RFQ board */
  getBoard: () =>
    httpClient.get<{
      pending: RfqListItem[];
      active: RfqListItem[];
      closed: RfqListItem[];
    }>('/rfqs/factory/board'),
};

export const quotationsApi = {
  create: (rfqId: string | number, data: Record<string, unknown>) =>
    httpClient.post<QuotationRow>(`/quotations?rfq_id=${rfqId}`, data),

  update: (quoteId: string | number, data: Record<string, unknown>) =>
    httpClient.patch<QuotationRow>(`/quotations/${quoteId}`, data),

  get: (quoteId: string | number) => httpClient.get<QuotationRow>(`/quotations/${quoteId}`),

  delete: (quoteId: string | number) => httpClient.delete<void>(`/quotations/${quoteId}`),

  list: (rfqId?: string | number) => {
    const endpoint = rfqId ? `/quotations?rfq_id=${rfqId}` : '/quotations';
    return httpClient.get<QuotationRow[]>(endpoint);
  },
};

export const quotationApi = {
  getDetail: (quoteId: string | number) =>
    httpClient.get<QuotationRow & { details?: unknown }>(`/quotations/${quoteId}/detail`),

  getHistory: (quoteId: string | number) =>
    httpClient.get<QuotationHistoryEntry[]>(`/quotations/${quoteId}/history`),
};
