/**
 * Explore API — Frontend aggregated data endpoints
 */

import { httpClient } from './httpClient';
import type { ExploreResponse, PromoSlidesResponse } from './types';

export interface FrontendBootstrapResponse {
  currentUser: Record<string, unknown>;
  categories: unknown[];
  factories: unknown[];
  rfqs: unknown[];
  orders: unknown[];
  threads: unknown[];
}

export const frontendApi = {
  getMe: () => httpClient.get<Record<string, unknown>>('/frontend/me'),

  getBootstrap: () => httpClient.get<FrontendBootstrapResponse>('/frontend/bootstrap'),

  getMockData: () => httpClient.get<Record<string, unknown>>('/frontend/mock-data'),

  getFactories: () => httpClient.get<unknown[]>('/frontend/factories'),

  getFactory: (id: string | number) =>
    httpClient.get<{
      factory: Record<string, unknown>;
      profile: Record<string, unknown>;
      reviews: unknown[];
      products: unknown[];
      promotions: unknown[];
      ideas: unknown[];
    }>(`/frontend/factories/${id}`),

  getRfq: (id: string | number) => httpClient.get<Record<string, unknown>>(`/frontend/rfqs/${id}`),

  getOrder: (id: string | number) =>
    httpClient.get<Record<string, unknown>>(`/frontend/orders/${id}`),

  getMessageThreads: () => httpClient.get<unknown[]>('/frontend/messages/threads'),

  getExplore: () => httpClient.get<ExploreResponse>('/frontend/explore'),

  getProducts: (limit = 8, categoryId?: string) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (categoryId) params.set('category_id', categoryId);
    return httpClient.get<unknown[]>(`/frontend/products?${params}`);
  },

  getPromotions: (limit = 4) =>
    httpClient.get<unknown[]>(`/frontend/promotions?limit=${limit}`),

  getPromoCodes: () => httpClient.get<unknown[]>('/frontend/promo-codes'),
};

export const promoSlidesApi = {
  list: () => httpClient.get<PromoSlidesResponse>('/promo-slides'),
};
