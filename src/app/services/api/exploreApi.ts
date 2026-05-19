/**
 * Explore API — Frontend aggregated data endpoints
 */

import { httpClient } from '@/services/api/httpClient';
import {
  type IExploreApiResponse,
  type IExploreResponse,
  type IPromoSlideResponse,
  type IShowcasesGroupedResponse,
} from '@/services/api/types/explore.types';

export interface FrontendBootstrapResponse {
  currentUser?: {
    id: number;
    role: string;
    name: string;
    company?: string;
    email: string;
    phone: string;
    walletBalance?: number;
    pendingBalance?: number;
    memberSince: string;
    nameEn?: string;
    avatar?: string;
  };
  rfqs: unknown[];
  orders: unknown[];
  threads: unknown[];
}

export const frontendApi = {
  getMe: async () => {
    try {
      return await httpClient.get<Record<string, unknown>>('/frontend/me');
    } catch (error) {
      const status = Number((error as { status?: unknown })?.status ?? 0);
      if (status === 404) {
        return httpClient.get<Record<string, unknown>>('/profile');
      }
      throw error;
    }
  },

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

  getExplore: () => httpClient.get<IExploreResponse>('/frontend/explore'),

  getProducts: (limit = 8, categoryId?: string) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (categoryId) params.set('category_id', categoryId);
    return httpClient.get<unknown[]>(`/frontend/products?${params}`);
  },

  getPromotions: (limit = 4) => httpClient.get<unknown[]>(`/frontend/promotions?limit=${limit}`),

  getPromoCodes: () => httpClient.get<unknown[]>('/frontend/promo-codes'),
};

/** GET /api/v1/explore — single call: categories + showcases (PD/MT/PM/ID) + promoSlides */
export const exploreApi = {
  get: () => httpClient.get<IExploreApiResponse>('/explore'),
};

/** @deprecated ใช้ exploreApi.get() แทน — เรียก /explore แล้วใช้ showcases field */
export const showcasesExploreApi = {
  listByTypes: (types: ('PD' | 'PM' | 'ID' | 'MT')[], limit: number) => {
    const params = new URLSearchParams({ types: types.join(','), limit: String(limit) });
    return httpClient.get<IShowcasesGroupedResponse>(`/showcases?${params}`);
  },
};

/** @deprecated ใช้ exploreApi.get() แทน — เรียก /explore แล้วใช้ promoSlides field */
export const promoSlidesApi = {
  list: (limit = 5) =>
    httpClient.get<IPromoSlideResponse[]>(`/promo-slides?limit=${limit}`),
};
