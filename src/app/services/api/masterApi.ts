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
import type { IProductionStepTemplateResponse } from '@/services/api/types/production.types';

export const categoriesApi = {
  list: (limit?: number) => {
    const endpoint = limit ? `/categories?limit=${limit}` : '/categories';
    return httpClient.get<ICategoryResponse[]>(endpoint);
  },

  get: (id: string | number) => httpClient.get<ICategoryResponse>(`/categories/${id}`),

  subCategories: (categoryId: string | number) =>
    httpClient.get<ISubCategoryResponse[]>(`/categories/${categoryId}/sub-categories`),
};

export function getProductCategories(parentCategoryId?: string | number) {
  const endpoint =
    parentCategoryId != null
      ? `/master/product-categories?parent_category_id=${parentCategoryId}`
      : '/master/product-categories';
  return httpClient.get<ICategoryResponse[]>(endpoint);
}

export function getLbiCategories(scope: 'PD' | 'MT' | 'ALL' = 'PD') {
  return httpClient.get<{ categories: ICategoryResponse[] }>(`/lbi/categories?scope=${scope}`);
}

export function getLbiSubCategories(scope: 'PD' | 'MT' | 'ALL' = 'ALL') {
  return httpClient.get<ISubCategoryResponse[]>(`/lbi/sub-categories?scope=${scope}`);
}

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

  getProductCategories: getProductCategories,
  productCategories: getProductCategories,

  getLbiCategories: getLbiCategories,
  lbiCategories: getLbiCategories,

  getLbiSubCategories: getLbiSubCategories,
  lbiSubCategories: getLbiSubCategories,

  getUnits: () => httpClient.get<IUnitResponse[]>('/master/units'),

  getCertifications: () => httpClient.get<ICertificationResponse[]>('/master/certificates'),

  certificates: () => httpClient.get<ICertificationResponse[]>('/master/certificates'),
  getShippingMethods: () => httpClient.get<IShippingMethodResponse[]>('/master/shipping-methods'),

  getFactoryTypes: () => httpClient.get<IFactoryTypeResponse[]>('/master/factory-types'),
  factoryTypes: () => httpClient.get<IFactoryTypeResponse[]>('/master/factory-types'),

  getProductionSteps: (factoryTypeId?: string | number) => {
    const endpoint =
      factoryTypeId != null
        ? `/master/production-steps?factory_type_id=${factoryTypeId}`
        : '/master/production-steps';
    return httpClient.get<IProductionStepTemplateResponse[]>(endpoint);
  },

  getMaterials: (categoryId?: string | number) => {
    const endpoint = categoryId
      ? `/master/materials?category_id=${categoryId}`
      : '/master/materials';
    return httpClient.get<IMaterialResponse[]>(endpoint);
  },

  provinces: () => httpClient.get<unknown[]>('/master/provinces'),

  districts: (provinceId: string | number) =>
    httpClient.get<unknown[]>(`/master/districts?province_id=${provinceId}`),

  subDistricts: (districtId: string | number) =>
    httpClient.get<unknown[]>(`/master/sub-districts?district_id=${districtId}`),
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
