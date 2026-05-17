/**
 * Factory API — Factory profile and showcase management
 */

import { httpClient } from '@/services/api/httpClient';
import { type FactoryBase, type FactoryProfile, type FactoryWithDetails, type FactoryCategoriesPayload, type FactorySubCategoriesPayload, type FactoryDashboardResponse, type FactoryAnalyticsResponse } from '@/services/api/types/factory.types';

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

  setCategories: (factoryId: string | number, categoryIds: number[]) =>
    httpClient.put<void>(`/factories/${factoryId}/categories`, { category_ids: categoryIds }),

  setSubCategories: (factoryId: string | number, subCategoryIds: number[]) =>
    httpClient.put<void>(`/factories/${factoryId}/sub-categories`, {
      sub_category_ids: subCategoryIds,
    }),

  getCategories: (factoryId: string | number) =>
    httpClient.get<{ category_ids: number[] }>(`/factories/${factoryId}/categories`),

  getSubCategories: (factoryId: string | number) =>
    httpClient.get<{ sub_category_ids: number[] }>(`/factories/${factoryId}/sub-categories`),

  removeCategory: (factoryId: string | number, categoryId: string | number) =>
    httpClient.delete<void>(`/factories/${factoryId}/categories/${categoryId}`),

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
