import { httpClient } from '@/services/api/httpClient';
import type {
  ICategoryResponse,
  ICertificationResponse,
  IFactoryTypeResponse,
  IMaterialResponse,
  IShippingMethodResponse,
  ISubCategoryResponse,
  IUnitResponse,
} from '@/services/api/types/master.types';

export const categoriesApi = {
  list: () => httpClient.get<ICategoryResponse[]>('/categories'),

  get: (id: string | number) => httpClient.get<ICategoryResponse>(`/categories/${id}`),

  subCategories: (categoryId: string | number) =>
    httpClient.get<ISubCategoryResponse[]>(`/categories/${categoryId}/sub-categories`),
};

export const masterApi = {
  getAll: () =>
    httpClient.get<{
      categories?: ICategoryResponse[];
      units?: IUnitResponse[];
      certifications?: ICertificationResponse[];
      shipping_methods?: IShippingMethodResponse[];
      factory_types?: IFactoryTypeResponse[];
    }>('/master'),

  getCategories: () => httpClient.get<ICategoryResponse[]>('/master/categories'),

  getUnits: () => httpClient.get<IUnitResponse[]>('/master/units'),

  getCertifications: () => httpClient.get<ICertificationResponse[]>('/master/certifications'),

  getShippingMethods: () => httpClient.get<IShippingMethodResponse[]>('/master/shipping-methods'),

  getFactoryTypes: () => httpClient.get<IFactoryTypeResponse[]>('/master/factory-types'),

  getMaterials: (categoryId?: string | number) => {
    const endpoint = categoryId
      ? `/master/materials?category_id=${categoryId}`
      : '/master/materials';
    return httpClient.get<IMaterialResponse[]>(endpoint);
  },
};

export const addressesApi = {
  list: () => httpClient.get<unknown[]>('/addresses'),

  get: (id: string | number) => httpClient.get<unknown>(`/addresses/${id}`),

  create: (data: Record<string, unknown>) => httpClient.post<unknown>('/addresses', data),

  update: (id: string | number, data: Record<string, unknown>) =>
    httpClient.put<unknown>(`/addresses/${id}`, data),

  patch: (id: string | number, data: Partial<Record<string, unknown>>) =>
    httpClient.patch<unknown>(`/addresses/${id}`, data),

  delete: (id: string | number) => httpClient.delete<void>(`/addresses/${id}`),

  getDefault: () => httpClient.get<unknown>('/addresses/default'),

  setDefault: (id: string | number) => httpClient.post<void>(`/addresses/${id}/set-default`, {}),
};
