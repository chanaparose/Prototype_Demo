/**
 * Factory API — Factory profile and showcase management
 */

import { httpClient } from '@/services/api/httpClient';
import type {
  FactoryBase,
  FactoryProfile,
  FactoryWithDetails,
  FactoryCategoriesPayload,
  FactorySubCategoriesPayload,
  FactoryDashboardResponse,
  FactoryAnalyticsResponse,
} from '@/services/api/types';

export const factoriesApi = {
  list: () => httpClient.get<FactoryBase[]>('/factories'),

  get: (id: string | number) => httpClient.get<FactoryWithDetails>(`/factories/${id}`),

  create: (data: FactoryProfile) => httpClient.post<FactoryBase>('/factories/', data),

  update: (id: string | number, data: Partial<FactoryProfile>) =>
    httpClient.put<FactoryBase>(`/factories/${id}`, data),

  patch: (id: string | number, data: Partial<FactoryProfile>) =>
    httpClient.patch<FactoryBase>(`/factories/${id}`, data),

  delete: (id: string | number) => httpClient.delete<void>(`/factories/${id}`),

  /** GET /factories/me — own factory profile (JWT role=FT) */
  getMe: () => httpClient.get<FactoryProfile>('/factories/me'),

  /** GET /factories/me/dashboard */
  getDashboard: () => httpClient.get<FactoryDashboardResponse>('/factories/me/dashboard'),

  /** GET /factories/me/analytics */
  getAnalytics: () => httpClient.get<FactoryAnalyticsResponse>('/factories/me/analytics'),

  /** PUT /factories/:id/categories */
  setCategories: (factoryId: string | number, categoryIds: number[]) =>
    httpClient.put<void>(`/factories/${factoryId}/categories`, { category_ids: categoryIds }),

  /** PUT /factories/:id/sub-categories */
  setSubCategories: (factoryId: string | number, subCategoryIds: number[]) =>
    httpClient.put<void>(`/factories/${factoryId}/sub-categories`, {
      sub_category_ids: subCategoryIds,
    }),

  /** GET /factories/:id/categories */
  getCategories: (factoryId: string | number) =>
    httpClient.get<{ category_ids: number[] }>(`/factories/${factoryId}/categories`),

  /** GET /factories/:id/sub-categories */
  getSubCategories: (factoryId: string | number) =>
    httpClient.get<{ sub_category_ids: number[] }>(`/factories/${factoryId}/sub-categories`),

  /** DELETE /factories/:id/categories/:cid */
  removeCategory: (factoryId: string | number, categoryId: string | number) =>
    httpClient.delete<void>(`/factories/${factoryId}/categories/${categoryId}`),

  /** DELETE /factories/:id/sub-categories/:sid */
  removeSubCategory: (factoryId: string | number, subCategoryId: string | number) =>
    httpClient.delete<void>(`/factories/${factoryId}/sub-categories/${subCategoryId}`),
};

export const showcasesApi = {
  list: (factoryId?: string | number) => {
    const endpoint = factoryId ? `/showcases?factory_id=${factoryId}` : '/showcases';
    return httpClient.get<unknown[]>(endpoint);
  },

  get: (id: string | number) => httpClient.get<Record<string, unknown>>(`/showcases/${id}`),

  create: (data: Record<string, unknown>) =>
    httpClient.post<Record<string, unknown>>('/showcases', data),

  update: (id: string | number, data: Record<string, unknown>) =>
    httpClient.put<Record<string, unknown>>(`/showcases/${id}`, data),

  patch: (id: string | number, data: Partial<Record<string, unknown>>) =>
    httpClient.patch<Record<string, unknown>>(`/showcases/${id}`, data),

  delete: (id: string | number) => httpClient.delete<void>(`/showcases/${id}`),

  /** GET /showcases/:id/with-details */
  getWithDetails: (id: string | number) =>
    httpClient.get<Record<string, unknown>>(`/showcases/${id}/with-details`),

  /** POST /showcases/:id/upload-images */
  uploadImages: (id: string | number, formData: FormData) =>
    httpClient.postForm<Record<string, unknown>>(`/showcases/${id}/upload-images`, formData),
};

export const mediaApi = {
  uploadImage: (formData: FormData) =>
    httpClient.postForm<{
      image_id: string;
      url: string;
    }>('/media/upload', formData),

  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return mediaApi.uploadImage(formData);
  },

  deleteImage: (imageId: string) => httpClient.delete<void>(`/media/${imageId}`),
};
