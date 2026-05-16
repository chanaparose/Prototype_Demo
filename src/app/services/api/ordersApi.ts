/**
 * Orders API — Order management
 */

import { httpClient } from './httpClient';
import type { OrderDetailDTO, OrderCreatePayload, OrderUpdatePayload } from './types';

export const ordersApi = {
  list: () => httpClient.get<OrderDetailDTO[]>('/orders'),

  get: (id: string | number) => httpClient.get<OrderDetailDTO>(`/orders/${id}`),

  create: (quoteId: string | number) =>
    httpClient.post<OrderDetailDTO>('/orders', { quote_id: Number(quoteId) }),

  update: (id: string | number, data: OrderUpdatePayload) =>
    httpClient.patch<OrderDetailDTO>(`/orders/${id}`, data),

  delete: (id: string | number) => httpClient.delete<void>(`/orders/${id}`),

  /** Get orders for current user */
  getMyOrders: () =>
    httpClient.get<{
      orders: OrderDetailDTO[];
      total: number;
    }>('/orders/me'),

  /** Get order by quote ID */
  getByQuoteId: (quoteId: string | number) =>
    httpClient.get<OrderDetailDTO | null>(`/orders/quote/${quoteId}`),

  /** Accept a quote and create order (shorthand) */
  acceptQuote: (quoteId: string | number) =>
    httpClient.post<OrderDetailDTO>(`/orders/accept-quote/${quoteId}`, {}),
};

export const productionUpdatesApi = {
  list: (orderId: string | number) =>
    httpClient.get<unknown[]>(`/orders/${orderId}/production-updates`),

  create: (orderId: string | number, data: Record<string, unknown>) =>
    httpClient.post(`/orders/${orderId}/production-updates`, data),
};

export const productionApi = {
  getSteps: (orderId: string | number) =>
    httpClient.get<unknown[]>(`/orders/${orderId}/production-steps`),

  updateStep: (orderId: string | number, stepId: string | number, data: Record<string, unknown>) =>
    httpClient.patch(`/orders/${orderId}/production-steps/${stepId}`, data),
};
