import { httpClient } from '@/services/api/httpClient';
import type {
  IOrderCreateRequest,
  IOrderDetailResponse,
  IOrderUpdateRequest,
} from '@/services/api/types/order.types';
import type {
  IProductionUpdateRequest,
  IProductionUpdatesBundleResponse,
} from '@/services/api/types/production.types';

export const ordersApi = {
  list: () => httpClient.get<IOrderDetailResponse[]>('/orders'),

  get: (id: string | number) => httpClient.get<IOrderDetailResponse>(`/orders/${id}`),

  create: (quoteId: string | number) =>
    httpClient.post<IOrderDetailResponse>('/orders', {
      quote_id: Number(quoteId),
    } satisfies IOrderCreateRequest),

  update: (id: string | number, data: IOrderUpdateRequest) =>
    httpClient.patch<IOrderDetailResponse>(`/orders/${id}`, data),

  ship: (id: string | number, data: Partial<IOrderUpdateRequest> = {}) =>
    httpClient.patch<IOrderDetailResponse>(`/orders/${id}`, { ...data, status: 'SH' }),

  delete: (id: string | number) => httpClient.delete<void>(`/orders/${id}`),

  getByQuoteId: (quoteId: string | number) =>
    httpClient.get<IOrderDetailResponse | null>(`/orders/quote/${quoteId}`),

  acceptQuote: (quoteId: string | number) =>
    httpClient.post<IOrderDetailResponse>(`/orders/accept-quote/${quoteId}`, {}),

  getProductionUpdatesBundle: (orderId: string | number) =>
    httpClient.get<IProductionUpdatesBundleResponse>(`/orders/${orderId}/production-updates`),

  postProductionUpdate: (
    orderId: string | number,
    data: IProductionUpdateRequest,
    headers?: Record<string, string>,
  ) => httpClient.post<unknown>(`/orders/${orderId}/production-updates`, data, headers),

  createPayment: (
    orderId: string | number,
    data: {
      type: string;
      amount: number;
      payment_method: string;
      idempotency_key?: string;
    },
  ) => httpClient.post<Record<string, unknown>>(`/orders/${orderId}/payments`, data),

  confirmReceipt: (
    orderId: string | number,
    data: { note?: string; received_at?: string },
  ) => httpClient.post<Record<string, unknown>>(`/orders/${orderId}/confirm-receipt`, data),

  cancel: (orderId: string | number) =>
    httpClient.delete<{ message: string }>(`/orders/${orderId}`),

  getReviewState: (orderId: string | number) =>
    httpClient.get<Record<string, unknown>>(`/orders/${orderId}/review-state`),

  createReview: (
    orderId: string | number,
    data: { rating: number; comment: string; image_urls?: string[] },
  ) => httpClient.post<Record<string, unknown>>(`/orders/${orderId}/reviews`, data),
};

export const productionUpdatesApi = {
  list: (orderId: string | number) =>
    httpClient.get<unknown[]>(`/orders/${orderId}/production-updates`),

  create: (orderId: string | number, data: Record<string, unknown>) =>
    httpClient.post(`/orders/${orderId}/production-updates`, data),

  patch: (updateId: string | number, data: Record<string, unknown>) =>
    httpClient.patch(`/production-updates/${updateId}`, data),

  reject: (updateId: string | number, data: Record<string, unknown>) =>
    httpClient.post(`/production-updates/${updateId}/reject`, data),
};
