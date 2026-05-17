import { httpClient } from '@/services/api/httpClient';
import {
  type IFactoryAnalyticsResponse,
  type IFactoryBaseResponse,
  type IFactoryDashboardResponse,
  type IFactoryProfileResponse,
  type IFactoryWithDetailsResponse,
} from '@/services/api/types/factory.types';

export const factoriesApi = {
  list: () => httpClient.get<IFactoryBaseResponse[]>('/factories'),

  get: (id: string | number) => httpClient.get<IFactoryWithDetailsResponse>(`/factories/${id}`),

  create: (data: IFactoryProfileResponse) =>
    httpClient.post<IFactoryBaseResponse>('/factories/', data),

  update: (id: string | number, data: Partial<IFactoryProfileResponse>) =>
    httpClient.put<IFactoryBaseResponse>(`/factories/${id}`, data),

  patch: (id: string | number, data: Partial<IFactoryProfileResponse>) =>
    httpClient.patch<IFactoryBaseResponse>(`/factories/${id}`, data),

  delete: (id: string | number) => httpClient.delete<void>(`/factories/${id}`),

  getMe: () => httpClient.get<IFactoryProfileResponse>('/factories/me'),

  getDashboard: () => httpClient.get<IFactoryDashboardResponse>('/factories/me/dashboard'),

  getAnalytics: () => httpClient.get<IFactoryAnalyticsResponse>('/factories/me/analytics'),

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

  listByFactory: (factoryId: string | number, contentType?: string) => {
    const params = new URLSearchParams({ factory_id: String(factoryId) });
    if (contentType) params.set('content_type', contentType);
    const query = params.toString();
    return httpClient.get<unknown[]>(`/showcases${query ? `?${query}` : ''}`);
  },

  get: (id: string | number) => httpClient.get<Record<string, unknown>>(`/showcases/${id}`),

  create: (data: Record<string, unknown>) =>
    httpClient.post<Record<string, unknown>>('/showcases', data),

  update: (id: string | number, data: Record<string, unknown>) =>
    httpClient.put<Record<string, unknown>>(`/showcases/${id}`, data),

  patch: (id: string | number, data: Partial<Record<string, unknown>>) =>
    httpClient.patch<Record<string, unknown>>(`/showcases/${id}`, data),

  delete: (id: string | number) => httpClient.delete<void>(`/showcases/${id}`),

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
