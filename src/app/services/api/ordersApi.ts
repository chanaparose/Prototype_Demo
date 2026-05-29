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

  /** Complete shipping step (step_id=4) with tracking number */
  ship: (
    orderId: string | number,
    data: { tracking_number: string; note?: string; courier?: string },
  ) =>
    httpClient.post<unknown>(`/orders/${orderId}/production-updates`, {
      step_id: 4,
      status: 'CD',
      description: data.note,
      image_urls: [] as string[],
      tracking_no: data.tracking_number,
      ...(data.courier ? { courier: data.courier } : {}),
    } satisfies IProductionUpdateRequest),

  /** POST /orders/:id/payments — pay deposit or full payment */
  createPayment: (
    orderId: string | number,
    data: {
      type: string;
      amount: number;
      payment_method: string;
      idempotency_key?: string;
    },
  ) => httpClient.post<Record<string, unknown>>(`/orders/${orderId}/payments`, data),

  /** POST /orders/:id/confirm-receipt — customer confirms goods received */
  confirmReceipt: (orderId: string | number, data: { note?: string; received_at?: string }) =>
    httpClient.post<Record<string, unknown>>(`/orders/${orderId}/confirm-receipt`, data),

  /** DELETE /orders/:id — cancel an order */
  cancel: (orderId: string | number) =>
    httpClient.delete<{ message: string }>(`/orders/${orderId}`),

  /** GET /orders/:id/review — check if review is eligible */
  getReviewState: (orderId: string | number) =>
    httpClient.get<Record<string, unknown>>(`/orders/${orderId}/review`),

  /** POST /orders/:id/review — submit a review */
  createReview: (
    orderId: string | number,
    data: { rating: number; comment: string; image_urls?: string[] },
  ) => httpClient.post<Record<string, unknown>>(`/orders/${orderId}/review`, data),
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
