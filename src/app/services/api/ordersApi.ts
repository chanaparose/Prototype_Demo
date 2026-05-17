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

  delete: (id: string | number) => httpClient.delete<void>(`/orders/${id}`),

  getMyOrders: () =>
    httpClient.get<{
      orders: IOrderDetailResponse[];
      total: number;
    }>('/orders/me'),

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

export const productionApi = {
  getSteps: (orderId: string | number) =>
    httpClient.get<unknown[]>(`/orders/${orderId}/production-steps`),

  updateStep: (orderId: string | number, stepId: string | number, data: Record<string, unknown>) =>
    httpClient.patch(`/orders/${orderId}/production-steps/${stepId}`, data),
};
