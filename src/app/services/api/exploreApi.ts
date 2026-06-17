/**
 * Explore API — Frontend aggregated data endpoints
 */

import { httpClient } from '@/services/api/httpClient';
import {
  type IExploreApiResponse,
  type IExploreResponse,
  type IPromoSlideResponse,
  type ISessionResponse,
  type IShowcasePaginatedResponse,
  type IShowcasesGroupedResponse,
} from '@/services/api/types/explore.types';

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

  getBootstrap: () => httpClient.get<ISessionResponse>('/frontend/bootstrap'),

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

/** จำนวน showcase/factory สูงสุดที่แสดงบนหน้า Explore (preview section) */
export const EXPLORE_PREVIEW_LIMIT = 10;

/** GET /api/v1/explore — single call: categories + showcases (PD/MT/PM/ID) + promoSlides */
export const exploreApi = {
  /**
   * @param showcaseLimit - จำกัดจำนวน showcase แต่ละ type ที่ backend ส่งมา (default: EXPLORE_PREVIEW_LIMIT)
   * @param factoryLimit  - จำกัดจำนวน factory ที่ backend ส่งมา (default: EXPLORE_PREVIEW_LIMIT)
   */
  get: (
    showcaseLimit = EXPLORE_PREVIEW_LIMIT,
    factoryLimit = EXPLORE_PREVIEW_LIMIT,
  ) => {
    const p = new URLSearchParams();
    p.set('showcase_limit', String(showcaseLimit));
    p.set('factory_limit', String(factoryLimit));
    return httpClient.get<IExploreApiResponse>(`/explore?${p}`);
  },
};

/** GET /api/v1/showcases?types=...&page=N&limit=N — paginated flat showcase list */
export const showcasesPaginatedApi = {
  list: (params: {
    types: ('PD' | 'PM' | 'ID' | 'MT')[];
    limit?: number;
    page?: number;
    categoryId?: string | number;
    subCategoryId?: string | number;
    hubId?: number;
    keyword?: string;
    sort?: string;
  }) => {
    const p = new URLSearchParams();
    p.set('types', params.types.join(','));
    if (params.limit) p.set('limit', String(params.limit));
    if (params.page) p.set('page', String(params.page));
    if (params.categoryId) p.set('category_id', String(params.categoryId));
    if (params.subCategoryId) p.set('sub_category_id', String(params.subCategoryId));
    if (params.hubId) p.set('hub_id', String(params.hubId));
    if (params.keyword) p.set('keyword', params.keyword);
    if (params.sort) p.set('sort', params.sort);
    return httpClient.get<IShowcasePaginatedResponse>(`/showcases?${p}`);
  },
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
  list: (limit = 5) => httpClient.get<IPromoSlideResponse[]>(`/promo-slides?limit=${limit}`),
};
